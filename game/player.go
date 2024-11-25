package game

import (
	"github.com/gorilla/websocket"
	"log"
	"sync"
)

type Player struct {
	ID   string
	Conn *websocket.Conn
	mu   sync.Mutex
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

func (p *Player) SetConnection(conn *websocket.Conn) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Conn = conn
}

func (p *Player) GetConnection() *websocket.Conn {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.Conn
}