export interface GameState {
    board: {
        Cells: string[][];
        Width: number;
    };
    currentPiece: {
        Shape: boolean[][];
        X: number;
        Y: number;
        Color: string;
    } | null;
    gameOver: boolean;
    score: number;
    level: number;
} 