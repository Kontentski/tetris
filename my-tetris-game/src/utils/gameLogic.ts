export const isValidMove = (board: any, piece: any, newX: number, newY: number): boolean => {
    if (!piece) return false;
    
    for (let row = 0; row < piece.Shape.length; row++) {
        for (let col = 0; col < piece.Shape[row].length; col++) {
            if (piece.Shape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;
                
                // Check boundaries
                if (boardX < 0 || boardX >= board.Width || boardY >= board.Cells.length) {
                    return false;
                }
                
                // Check collision with placed pieces
                if (boardY >= 0 && board.Cells[boardY][boardX]) {
                    return false;
                }
            }
        }
    }
    return true;
};

export const rotatePiece = (piece: any): any => {
    const rows = piece.Shape.length;
    const cols = piece.Shape[0].length;
    
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(false));
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            rotated[j][rows-1-i] = piece.Shape[i][j];
        }
    }
    
    return {
        ...piece,
        Shape: rotated
    };
}; 