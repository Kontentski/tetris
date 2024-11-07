package game

import (
	"math/rand"
	"fmt"
)

type Piece struct {
	Shape  [][]bool
	X      int
	Y      int
	Color  string
}

var Pieces = [][][]bool{
	{ // I piece
		{true, true, true, true},
	},
	{ // O piece
		{true, true},
		{true, true},
	},
	{ // T piece
		{true, true, true},
		{false, true, false},
	},
	{ // L piece
		{true, false},
		{true, false},
		{true, true},
	},
	{ // J piece
		{false, true},
		{false, true},
		{true, true},
	},
	{ // S piece
		{false, true, true},
		{true, true, false},
	},
	{ // Z piece
		{true, true, false},
		{false, true, true},
	},
}

/* var Colors = []string{
    "#FF0D72", // I
    "#0DC2FF", // O
    "#0DFF72", // T
    "#F538FF", // L
    "#FF8E0D", // J
    "#FFE138", // S
    "#3877FF", // Z
} */

func generateRandomColor() string {
	// Ensure at least one color component is bright (>128)
	r := rand.Intn(256)
	g := rand.Intn(256)
	b := rand.Intn(256)
	
	// Make sure at least one component is bright
	if r < 128 && g < 128 && b < 128 {
		switch rand.Intn(3) {
		case 0:
			r = rand.Intn(128) + 128
		case 1:
			g = rand.Intn(128) + 128
		case 2:
			b = rand.Intn(128) + 128
		}
	}
	
	return fmt.Sprintf("#%02X%02X%02X", r, g, b)
}

func NewPiece(pieceType int) *Piece {
	if pieceType < 0 {
		pieceType = rand.Intn(len(Pieces))
	}
	
	return &Piece{
		Shape: Pieces[pieceType],
		Color: generateRandomColor(),
		X:     3,
		Y:     0,
	}
}

func (p *Piece) Rotate() {
	rows := len(p.Shape)
	cols := len(p.Shape[0])
	
	rotated := make([][]bool, cols)
	for i := range rotated {
		rotated[i] = make([]bool, rows)
	}
	
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			rotated[j][rows-1-i] = p.Shape[i][j]
		}
	}
	
	p.Shape = rotated
} 