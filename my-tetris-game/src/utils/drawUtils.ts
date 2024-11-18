export const drawGame = (ctx: CanvasRenderingContext2D, gameState: any) => {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw board
    drawBoard(ctx, gameState.board);

    // Draw current piece
    if (gameState.currentPiece) {
        drawPiece(ctx, gameState.currentPiece);
    }

    // Check game over
    if (gameState.gameOver) {
        drawGameOver(ctx);
    }
};

const drawBoard = (ctx: CanvasRenderingContext2D, board: any) => {
    const blockSize = 20;
    const bufferRows = 4;
    for (let y = bufferRows; y < board.Cells.length; y++) {
        const visibleY = y - bufferRows;
        for (let x = 0; x < board.Width; x++) {
            if (board.Cells[y][x]) {
                drawBlock(ctx, x, visibleY, board.Cells[y][x]);
            } else {
                // Draw grid
                ctx.strokeStyle = '#333';
                ctx.strokeRect(
                    x * blockSize,
                    visibleY * blockSize,
                    blockSize,
                    blockSize
                );
            }
        }
    }
};

const drawPiece = (ctx: CanvasRenderingContext2D, piece: any) => {
/*     const blockSize = 20;
 */    const bufferRows = 4;
    for (let y = 0; y < piece.Shape.length; y++) {
        for (let x = 0; x < piece.Shape[y].length; x++) {
            if (piece.Shape[y][x]) {
                const visibleY = piece.Y + y - bufferRows;
                if (visibleY >= 0 && visibleY < 20) {
                    drawBlock(ctx, piece.X + x, visibleY, piece.Color);
                }
            }
        }
    }
};

const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const blockSize = 20;
    ctx.fillStyle = color;
    ctx.fillRect(
        x * blockSize,
        y * blockSize,
        blockSize,
        blockSize
    );
    // Draw border
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(
        x * blockSize,
        y * blockSize,
        blockSize,
        blockSize
    );
};

const drawGameOver = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        'GAME OVER',
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
    );
};
