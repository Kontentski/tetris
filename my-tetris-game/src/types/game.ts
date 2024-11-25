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
    sequenceNumber?: number;
    currentPlayer: number;
    players: string[];
}

export interface GameCommand {
    command: string;
    sequenceNumber: number;
} 