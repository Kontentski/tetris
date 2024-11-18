package game

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

const (
	InitialSpeed   = 500
	MinimumSpeed   = 50
	SpeedIncrement = 20
)

type GameState struct {
	Board         *Board `json:"board"`
	CurrentPiece  *Piece `json:"currentPiece"`
	NextPiece     *Piece `json:"nextPiece"`
	Score         int    `json:"score"`
	GameOver      bool   `json:"gameOver"`
	PiecesPlaced  int    `json:"piecesPlaced"`
	Level         int    `json:"level"`
	CurrentPlayer int    `json:"currentPlayer"`
}

type Game struct {
	State   *GameState
	Updates chan []byte
	ticker  *time.Ticker
	Players []*Player
	Started bool
	mu      sync.RWMutex
}

func NewGame() *Game {
	return &Game{
		State: &GameState{
			Board:         NewBoard(10, 20),
			CurrentPiece:  nil,
			NextPiece:     nil,
			Score:         0,
			GameOver:      false,
			PiecesPlaced:  0,
			Level:         1,
			CurrentPlayer: 0,
		},
		Updates: make(chan []byte),
		ticker:  time.NewTicker(InitialSpeed * time.Millisecond),
		Started: false,
		Players: make([]*Player, 0, 2),
	}
}

func (g *Game) Start() {
	g.mu.Lock()
	g.State.NextPiece = NewPiece(-1)
	g.State.CurrentPiece = NewPiece(-1)
	
	if len(g.Players) > 0 && g.Players[0] != nil {
		g.State.CurrentPlayer = 0
		currentPlayerID := g.Players[0].ID
		log.Printf("Game starting with first player: %s (verified)", currentPlayerID)
	}
	g.mu.Unlock()

	// Send initial game state
	if update, err := json.Marshal(g.State); err == nil {
		g.Updates <- update
	}

	// Start the game loop
	for range g.ticker.C {
		g.Update()
	}
}

func (g *Game) Update() {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.State.GameOver {
		return
	}

	// Initialize pieces if needed
	if g.State.CurrentPiece == nil {
		if g.State.NextPiece == nil {
			g.State.NextPiece = NewPiece(-1)
		}
		g.State.CurrentPiece = g.State.NextPiece
		g.State.NextPiece = NewPiece(-1)

		// Check if game over
		if !g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X, g.State.CurrentPiece.Y) {
			g.State.GameOver = true
			return
		}
	}

	// Try to move piece down
	if g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X, g.State.CurrentPiece.Y+1) {
		g.State.CurrentPiece.Y++
	} else {
		// Place piece and create new one
		g.State.Board.PlacePiece(g.State.CurrentPiece)
		g.State.PiecesPlaced++
		g.updateSpeed()

		linesCleared := g.State.Board.ClearLines()
		g.State.Score += linesCleared * 100
		g.State.CurrentPiece = nil

		// Switch to the next player
		if len(g.Players) > 1 {
			prevPlayer := g.Players[g.State.CurrentPlayer]
			g.State.CurrentPlayer = (g.State.CurrentPlayer + 1) % len(g.Players)
			nextPlayer := g.Players[g.State.CurrentPlayer]
			if nextPlayer != nil {
				log.Printf("Switched from player %s to player %s",
					prevPlayer.ID, nextPlayer.ID)
			}
		}
	}

	// Send update
	if update, err := json.Marshal(g.State); err == nil {
		g.Updates <- update
	}
}

func (g *Game) HandleInput(playerID string, command string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.State.GameOver || g.State.CurrentPiece == nil || len(g.Players) == 0 {
		return
	}

	currentPlayerIndex := g.State.CurrentPlayer % len(g.Players)
	currentPlayer := g.Players[currentPlayerIndex]
	if currentPlayer == nil {
		log.Printf("Current player is nil at index %d", currentPlayerIndex)
		return
	}

	if playerID != currentPlayer.ID {
		log.Printf("Ignoring input from player %s, current player is %s (index: %d)",
			playerID, currentPlayer.ID, currentPlayerIndex)
		return
	}

	log.Printf("Processing command '%s' from player %s", command, playerID)

	switch command {
	case "left":
		if g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X-1, g.State.CurrentPiece.Y) {
			g.State.CurrentPiece.X--
		}
	case "right":
		if g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X+1, g.State.CurrentPiece.Y) {
			g.State.CurrentPiece.X++
		}
	case "down":
		if g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X, g.State.CurrentPiece.Y+1) {
			g.State.CurrentPiece.Y++
		}
	case "rotate":
		g.State.CurrentPiece.Rotate()
		if !g.State.Board.IsValidMove(g.State.CurrentPiece, g.State.CurrentPiece.X, g.State.CurrentPiece.Y) {
			// Undo rotation if invalid
			for i := 0; i < 3; i++ {
				g.State.CurrentPiece.Rotate()
			}
		}
	}

	// Send update after handling input
	if update, err := json.Marshal(g.State); err == nil {
		g.Updates <- update
	}
}

func (g *Game) updateSpeed() {
	// Calculate new level (every 10 pieces increases level)
	newLevel := (g.State.PiecesPlaced / 10) + 1

	if newLevel != g.State.Level {
		g.State.Level = newLevel
		// Speed up by reducing ticker interval
		// Start at 300ms and decrease by 20ms per level, minimum 50ms
		newSpeed := time.Duration(max(MinimumSpeed, InitialSpeed-SpeedIncrement*newLevel)) * time.Millisecond
		g.ticker.Reset(newSpeed)
	}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func (g *Game) CheckAndStartGame() {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.Started {
		return
	}

	connectedPlayers := 0
	var connectedPlayerIDs []string
	for _, p := range g.Players {
		if p != nil && p.Conn != nil {
			connectedPlayers++
			log.Printf("Player connected: %s", p.ID)
			connectedPlayerIDs = append(connectedPlayerIDs, p.ID)
		}
	}

	log.Printf("Connected players: %d", connectedPlayers)

	if connectedPlayers == 2 {
		log.Printf("Starting game with players: %s vs %s",
			connectedPlayerIDs[0],
			connectedPlayerIDs[1])
		g.Started = true
		go g.Start()
	}
}

func (g *Game) BroadcastUpdate(update []byte) {
	g.mu.RLock()
	players := make([]*Player, len(g.Players))
	copy(players, g.Players)
	g.mu.RUnlock()

	for _, p := range players {
		if p == nil {
			continue
		}
		p.SendUpdate(update)
	}
}