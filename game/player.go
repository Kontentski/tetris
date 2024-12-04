package game

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	COMMAND_COOLDOWN = 100 * time.Millisecond
	MAX_COMMANDS     = 15
)

type Player struct {
	ID   string
	Conn *websocket.Conn
	mu   sync.Mutex
	lastCommand time.Time
	commandCount int
	commandWindow time.Time
}

func (p *Player) SendUpdate(update []byte) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.Conn == nil {
		return
	}

	if err := p.Conn.WriteMessage(websocket.TextMessage, update); err != nil {
		log.Printf("Error sending update to player %s: %v", p.ID, err)
	}
}

func (p *Player) IsRateLimited() bool {
	p.mu.Lock()
	defer p.mu.Unlock()

	now := time.Now()

	if now.Sub(p.lastCommand) < COMMAND_COOLDOWN{
		log.Printf("command rejected, rate limit exceeded")
		return true
	}

	if now.Sub(p.commandWindow) >= time.Second{
		p.commandWindow = now
        p.commandCount = 0
	}

	if p.commandCount >= MAX_COMMANDS {
		log.Printf("command rejected, too many commands")
        return true
	}

	p.lastCommand = now
	p.commandCount++

	return false
}

func (p *Player) SetConnection(conn *websocket.Conn) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Conn = conn
	p.lastCommand = time.Now()
	p.commandWindow = time.Now()
	p.commandCount = 0
}

func (p *Player) GetConnection() *websocket.Conn {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.Conn
}
