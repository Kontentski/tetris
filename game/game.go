package game

import (
	"encoding/json"
	"log"
	"time"
)

const (
	InitialSpeed   = 500
	MinimumSpeed   = 50
	SpeedIncrement = 20
)

type GameState struct {
	Board        *Board `json:"board"`
	CurrentPiece *Piece `json:"currentPiece"`
	NextPiece    *Piece `json:"nextPiece"`
	Score        int    `json:"score"`
	GameOver     bool   `json:"gameOver"`
	PiecesPlaced int    `json:"piecesPlaced"`
	Level        int    `json:"level"`
	CurrentPlayer int   `json:"currentPlayer"`
}

type Game struct {
	State   *GameState
	Updates chan []byte
	ticker  *time.Ticker
	Players []*Player // Add this line to store players
}

func NewGame() *Game {
	return &Game{
		State: &GameState{
			Board:        NewBoard(10, 20),
			CurrentPiece: NewPiece(-1),
			NextPiece:    NewPiece(-1),
			Score:        0,
			GameOver:     false,
			PiecesPlaced: 0,
			Level:        1,
		},
		Updates: make(chan []byte),
		ticker:  time.NewTicker(InitialSpeed * time.Millisecond),
	}
}

func (g *Game) Start() {
	go func() {
		for range g.ticker.C {
			g.Update()
		}
	}()
}

func (g *Game) Update() {
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

		// Check if game over - now checks if piece can't be placed in buffer zone
		if !g.State.Board.IsValidMove(g.State.CurrentPiece,
			g.State.CurrentPiece.X,
			g.State.CurrentPiece.Y) {
			g.State.GameOver = true
			return
		}
	}

	// Try to move piece down
	if g.State.Board.IsValidMove(g.State.CurrentPiece,
		g.State.CurrentPiece.X,
		g.State.CurrentPiece.Y+1) {
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
		g.State.CurrentPlayer = (g.State.CurrentPlayer + 1) % len(g.Players) // Use the number of players
	}

	// Send update to client
	if update, err := json.Marshal(g.State); err == nil {
		g.Updates <- update
	}
}

func (g *Game) HandleInput(playerID string, command string) {
	if g.State.GameOver || g.State.CurrentPiece == nil {
		return
	}

	// Check if the input is from the current player
	if playerID != g.GetCurrentPlayerID() {
		log.Printf("Ignoring input from player %s, current player is %s", playerID, g.GetCurrentPlayerID())
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

func (g *Game) GetCurrentPlayerID() string {
	if len(g.Players) > 0 {
		currentPlayerID := g.Players[g.State.CurrentPlayer].ID
		log.Printf("Current player is %s", currentPlayerID)
		return currentPlayerID
	}
	log.Println("No players found")
	return ""
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
