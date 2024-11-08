class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 20;
        this.bufferRows = 4;
        
        this.roomID = null;
        this.playerID = Math.random().toString(36).substring(7); // Random player ID

        document.getElementById('createRoom').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoom').addEventListener('click', () => this.joinRoom());
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
    }

    createRoom() {
        fetch('/create-room')
            .then(response => response.text())
            .then(roomID => {
                this.roomID = roomID;
                alert('Room created: ' + roomID);
            });
    }

    joinRoom() {
        const roomID = document.getElementById('roomID').value;
        fetch(`/join-room?roomID=${roomID}`)
            .then(response => response.json())
            .then(data => {
                this.roomID = roomID;
                this.playerID = data.playerID; // Store the player ID
                alert(data.message);
            })
            .catch(() => alert('Failed to join room'));
    }

    startGame() {
        if (this.roomID) {
            this.connectWebSocket();
        } else {
            alert('Please join a room first');
        }
    }

    connectWebSocket() {
        if (!this.roomID || !this.playerID) {
            alert('Room ID or Player ID is not set');
            return;
        }
        this.ws = new WebSocket(`ws://localhost:8080/ws?roomID=${this.roomID}&playerID=${this.playerID}`);
        this.ws.onmessage = (event) => this.handleGameState(event.data);
    }

    handleGameState(data) {
        const gameState = JSON.parse(data);
        this.drawGame(gameState);
    }

    drawGame(gameState) {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        this.drawBoard(gameState.board);
        
        // Draw current piece
        if (gameState.currentPiece) {
            this.drawPiece(gameState.currentPiece);
        }

        // Update score and level
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('level').textContent = gameState.level;

        // Check game over
        if (gameState.gameOver) {
            this.drawGameOver();
        }
    }

    drawBoard(board) {
        // Only draw the visible part of the board (skip buffer rows)
        for (let y = this.bufferRows; y < board.Cells.length; y++) {
            const visibleY = y - this.bufferRows;
            for (let x = 0; x < board.Width; x++) {
                if (board.Cells[y][x]) {
                    this.drawBlock(x, visibleY, board.Cells[y][x]);
                } else {
                    // Draw grid
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(
                        x * this.blockSize,
                        visibleY * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
            }
        }
    }

    drawPiece(piece) {
        if (!piece) return;
        
        for (let y = 0; y < piece.Shape.length; y++) {
            for (let x = 0; x < piece.Shape[y].length; x++) {
                if (piece.Shape[y][x]) {
                    const visibleY = piece.Y + y - this.bufferRows;
                    // Only draw if the piece is in the visible area
                    if (visibleY >= 0 && visibleY < 20) {
                        this.drawBlock(
                            piece.X + x,
                            visibleY,
                            piece.Color
                        );
                    }
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize,
            this.blockSize
        );
        // Draw border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.strokeRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize,
            this.blockSize
        );
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'GAME OVER',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }
}

const game = new TetrisGame();

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft':
            game.ws.send('left');
            break;
        case 'ArrowRight':
            game.ws.send('right');
            break;
        case 'ArrowDown':
            game.ws.send('down');
            break;
        case 'ArrowUp':
            game.ws.send('rotate');
            break;
    }
}); 