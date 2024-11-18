import React, { useRef, useEffect } from 'react';
import { drawGame } from '../utils/drawUtils';

interface GameCanvasProps {
    gameState: any;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawGame(ctx, gameState);
    }, [gameState]);

    return <canvas ref={canvasRef} id="tetris" width="200" height="400"></canvas>;
};

export default GameCanvas;
