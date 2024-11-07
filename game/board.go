package game

const (
    BufferRows = 4  // Hidden rows at the top
)

type Board struct {
    Width  int
    Height int
    Cells  [][]string 
}

func NewBoard(width, height int) *Board {
    totalHeight := height + BufferRows
    cells := make([][]string, totalHeight)
    for i := range cells {
        cells[i] = make([]string, width)
    }
    return &Board{
        Width:  width,
        Height: height,
        Cells:  cells,
    }
}

func (b *Board) IsValidMove(p *Piece, x, y int) bool {
    if p == nil {
        return false
    }
    
    for row := 0; row < len(p.Shape); row++ {
        for col := 0; col < len(p.Shape[row]); col++ {
            if p.Shape[row][col] {
                newY := y + row
                newX := x + col

                // Check boundaries (including buffer zone)
                if newX < 0 || newX >= b.Width || newY >= len(b.Cells) {
                    return false
                }

                // Check collision with placed pieces
                if newY >= 0 && b.Cells[newY][newX] != "" {
                    return false
                }
            }
        }
    }
    return true
}

func (b *Board) PlacePiece(p *Piece) {
    if p == nil {
        return
    }
    
    for row := 0; row < len(p.Shape); row++ {
        for col := 0; col < len(p.Shape[row]); col++ {
            if p.Shape[row][col] {
                newY := p.Y + row
                newX := p.X + col
                if newY >= 0 && newY < len(b.Cells) && newX >= 0 && newX < b.Width {
                    b.Cells[newY][newX] = p.Color
                }
            }
        }
    }
}

func (b *Board) ClearLines() int {
    linesCleared := 0
    fullRows := make([]int, 0)

    for row := len(b.Cells) - 1; row >= 0; row-- {
        if b.isLineFull(row) {
            fullRows = append(fullRows, row)
            linesCleared++
        }
    }

    if linesCleared > 0 {
        newRow := len(b.Cells) - 1
        for row := len(b.Cells) - 1; row >= 0; row-- {
            if contains(fullRows, row) {
                continue
            }
            if newRow != row {
                copy(b.Cells[newRow], b.Cells[row])
            }
            newRow--
        }

        for row := newRow; row >= 0; row-- {
            for col := 0; col < b.Width; col++ {
                b.Cells[row][col] = ""
            }
        }
    }

    return linesCleared
}

func (b *Board) isLineFull(row int) bool {
    for col := 0; col < b.Width; col++ {
        if b.Cells[row][col] == "" {
            return false
        }
    }
    return true
}

// Helper function to check if a slice contains a value
func contains(slice []int, val int) bool {
    for _, item := range slice {
        if item == val {
            return true
        }
    }
    return false
} 