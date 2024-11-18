import React, { useEffect, useRef, useState } from 'react';

const TetrisGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [roomID, setRoomID] = useState<string | null>(null);
    const [playerID, setPlayerID] = useState<string>(Math.random().toString(36).substring(7));
    const [score, setScore] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!ws) return;
            switch (event.key) {
                case 'ArrowLeft':
                    ws.send('left');
                    break;
                case 'ArrowRight':
                    ws.send('right');
                    break;
                case 'ArrowDown':
                    ws.send('down');
                    break;
                case 'ArrowUp':
                    ws.send('rotate');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [ws]);

    const createRoom = async () => {
        const response = await fetch('/create-room');
        const roomID = await response.text();
        setRoomID(roomID);
        alert('Room created: ' + roomID);
    };

    const joinRoom = async () => {
        const roomIDInput = (document.getElementById('roomID') as HTMLInputElement).value;
        const response = await fetch(`/join-room?roomID=${roomIDInput}`);
        const data = await response.json();
        setRoomID(roomIDInput);
        setPlayerID(data.playerID);
        alert(data.message);
    };

    const startGame = () => {
        if (roomID) {
            connectWebSocket();
        } else {
            alert('Please join a room first');
        }
    };

    const connectWebSocket = () => {
        if (!roomID || !playerID) {
            alert('Room ID or Player ID is not set');
            return;
        }
        const socket = new WebSocket(`ws://localhost:8080/ws?roomID=${roomID}&playerID=${playerID}`);
        socket.onmessage = (event) => handleGameState(event.data);
        setWs(socket);
    };

    const handleGameState = (data: string) => {
        const gameState = JSON.parse(data);
        drawGame(gameState);
    };

    const drawGame = (gameState: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw board
        drawBoard(ctx, gameState.board);

        // Draw current piece
        if (gameState.currentPiece) {
            drawPiece(ctx, gameState.currentPiece);
        }

        // Update score and level
        setScore(gameState.score);
        setLevel(gameState.level);

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
        const blockSize = 20;
        const bufferRows = 4;
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
        ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            'GAME OVER',
            canvasRef.current!.width / 2,
            canvasRef.current!.height / 2
        );
    };

    return (
        <div className="game-container">
            <canvas ref={canvasRef} id="tetris" width="200" height="400"></canvas>
            <div className="info">
                <div>Score: <span id="score">{score}</span></div>
                <div>Level: <span id="level">{level}</span></div>
            </div>
            <div className="controls">
                <button onClick={createRoom}>Create Room</button>
                <input type="text" id="roomID" placeholder="Room ID" />
                <button onClick={joinRoom}>Join Room</button>
                <button onClick={startGame}>Start Game</button>
            </div>
        </div>
    );
};

export default TetrisGame;