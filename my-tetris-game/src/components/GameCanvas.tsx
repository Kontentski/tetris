import React, { useRef, useEffect } from 'react';
import { drawGame } from '../utils/drawUtils';
import { GameState } from '../types/game';

interface GameCanvasProps {
    gameState: GameState | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!gameState) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawGame(ctx, gameState);
    }, [gameState]);

    return <canvas ref={canvasRef} width="200" height="400" />;
};

export default GameCanvas;