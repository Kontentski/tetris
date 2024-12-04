import { useState, useRef } from 'react';
import { GameState, GameCommand } from '../types/game';
import { isValidMove, rotatePiece } from '../utils/gameLogic';

interface PendingMove {
    command: string;
    sequenceNumber: number;
    timestamp: number;
    predictedState: GameState;
}

interface WebSocketHookProps {
    onMessage: (data: GameState) => void;
}

export const useWebSocket = ({ onMessage }: WebSocketHookProps) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const pendingMoves = useRef<PendingMove[]>([]);
    const localGameState = useRef<GameState | null>(null);
    const sequenceNumber = useRef<number>(0);
    const playerID = useRef<string | null>(null);
    const MAX_PENDING_MOVES = 10;
    const PENDING_MOVES_TIMEOUT = 3000; // 3 seconds without input
    let lastInputTime = useRef<number>(Date.now());
    let pendingMovesClearTimeout = useRef<NodeJS.Timeout | null>(null);
    const COMMAND_COOLDOWN = 100; // 100ms cooldown between commands
    const lastCommandTime = useRef<{ [key: string]: number }>({});

    const isCurrentPlayer = (): boolean => {
        console.log('Checking current player:', {
            localGameState: localGameState.current,
            currentPlayerID: playerID.current,
            hasGameState: !!localGameState.current,
            hasPlayerID: !!playerID.current
        });

        if (!localGameState.current || !playerID.current) {
            console.log('Cannot check current player: gameState or playerID is null');
            return false;
        }

        const currentPlayerIndex = localGameState.current.currentPlayer;
        const players = localGameState.current.players;

        console.log('Player check details:', {
            currentPlayerIndex,
            players,
            myPlayerID: playerID.current,
            gameState: localGameState.current
        });

        if (!players || currentPlayerIndex >= players.length) {
            console.log('Invalid players array or currentPlayerIndex:', {
                players,
                currentPlayerIndex
            });
            return false;
        }

        const isCurrentTurn = players[currentPlayerIndex] === playerID.current;
        console.log('Turn result:', {
            isCurrentTurn,
            currentPlayer: players[currentPlayerIndex],
            myPlayerID: playerID.current
        });

        return isCurrentTurn;
    };

    const getNewPiecePosition = (command: string, piece: any): { isValid: boolean; newX: number; newY: number; newShape?: boolean[][] } => {
        switch (command) {
            case 'left':
                return { isValid: false, newX: piece.X - 1, newY: piece.Y };
            case 'right':
                return { isValid: false, newX: piece.X + 1, newY: piece.Y };
            case 'down':
                return { isValid: false, newX: piece.X, newY: piece.Y + 1 };
            case 'rotate':
                const rotated = rotatePiece(piece);
                return { isValid: false, newX: piece.X, newY: piece.Y, newShape: rotated.Shape };
            default:
                return { isValid: false, newX: piece.X, newY: piece.Y };
        }
    };

    const validateMove = (state: GameState, command: string): boolean => {
        const piece = state.currentPiece;
        if (!piece) return false;

        const newPosition = getNewPiecePosition(command, piece);
        const pieceToCheck = newPosition.newShape 
            ? { ...piece, Shape: newPosition.newShape }
            : piece;

        return isValidMove(state.board, pieceToCheck, newPosition.newX, newPosition.newY);
    };

    const applyMove = (state: GameState, command: string): GameState => {
        const canMove = isCurrentPlayer();
        console.log('Attempting to apply move:', {
            command,
            canMove,
            currentState: state
        });

        if (!canMove) {
            console.log('Move rejected: not current player\'s turn');
            return state;
        }

        const newState = { ...state };
        const piece = newState.currentPiece;
        if (!piece) {
            console.log('Move rejected: no current piece');
            return newState;
        }

        const newPosition = getNewPiecePosition(command, piece);
        if (isValidMove(newState.board, piece, newPosition.newX, newPosition.newY)) {
            piece.X = newPosition.newX;
            piece.Y = newPosition.newY;
            if (newPosition.newShape) {
                piece.Shape = newPosition.newShape;
            }
            console.log(`Applied ${command} move`);
        }

        return newState;
    };

    const clearPendingMovesAfterDelay = () => {
        // Clear any existing timeout
        if (pendingMovesClearTimeout.current) {
            clearTimeout(pendingMovesClearTimeout.current);
        }

        // Set new timeout
        pendingMovesClearTimeout.current = setTimeout(() => {
            const timeSinceLastInput = Date.now() - lastInputTime.current;
            
            if (timeSinceLastInput >= PENDING_MOVES_TIMEOUT && pendingMoves.current.length > 0) {
                console.log('Clearing pending moves due to inactivity');
                pendingMoves.current = [];
                
                // Reset sequence number to match server's last known state
                if (localGameState.current?.sequenceNumber) {
                    sequenceNumber.current = localGameState.current.sequenceNumber;
                    console.log('Reset sequence number to:', sequenceNumber.current);
                }
            }
        }, PENDING_MOVES_TIMEOUT);
    };

    const sendCommand = (command: string) => {
        // Early validations (WebSocket, cooldown, current player)
        const now = Date.now();
        const lastTime = lastCommandTime.current[command] || 0;
        if (now - lastTime < COMMAND_COOLDOWN) {
            console.log(`Command '${command}' rejected: cooldown not finished`);
            return;
        }
        lastCommandTime.current[command] = now;

        if (!ws || !isCurrentPlayer() || !localGameState.current) {
            console.log('Command rejected: invalid state');
            return;
        }

        // Validate the move
        if (!validateMove(localGameState.current, command)) {
            console.log('Command rejected: invalid move');
            return;
        }

        // Update last input time
        lastInputTime.current = Date.now();

        // Increment sequence number
        sequenceNumber.current++;

        // Create command object
        const gameCommand: GameCommand = {
            command,
            sequenceNumber: sequenceNumber.current
        };

        // Apply move locally first
        if (localGameState.current) {
            const predictedState = applyMove(localGameState.current, command);
            const piece = predictedState.currentPiece;

            // Check if the move is valid using isValidMove before sending
            if (!piece || !isValidMove(predictedState.board, piece, piece.X, piece.Y)) {
                console.log('Move rejected: invalid move, not sending command');
                return; 
            }

            // Limit pending moves
            if (pendingMoves.current.length >= MAX_PENDING_MOVES) {
                console.warn('Too many pending moves, clearing older ones');
                pendingMoves.current = pendingMoves.current.slice(-MAX_PENDING_MOVES/2);
            }

            // Store the pending move with predicted state
            pendingMoves.current.push({
                command,
                sequenceNumber: sequenceNumber.current,
                timestamp: Date.now(),
                predictedState
            });

            console.log('Stored pending move:', {
                command,
                sequenceNumber: sequenceNumber.current,
                pendingMovesCount: pendingMoves.current.length
            });

            // Update local state
            localGameState.current = predictedState;
            onMessage(predictedState);
        }

        // Send to server
        const commandStr = JSON.stringify(gameCommand);
        console.log('Sending command to server:', commandStr);
        ws.send(commandStr);

        // Start/reset the inactivity timer
        clearPendingMovesAfterDelay();
    };

    const isValidGameState = (state: GameState): boolean => {
        return (
            state &&
            state.board &&
            Array.isArray(state.players) &&
            typeof state.currentPlayer === 'number' &&
            state.currentPlayer >= 0 &&
            state.currentPlayer < state.players.length
        );
    };

    const reconcileState = (serverState: GameState) => {
        if (!isValidGameState(serverState)) {
            console.error('Invalid game state received:', serverState);
            return serverState;
        }
        console.log('Reconciling state:', {
            serverSequenceNumber: serverState.sequenceNumber,
            pendingMovesCount: pendingMoves.current.length,
            currentPlayer: serverState.currentPlayer,
            isMyTurn: isCurrentPlayer()
        });

        if (!serverState.sequenceNumber) return serverState;

        // Remove all moves that have been processed by the server
        const initialPendingCount = pendingMoves.current.length;
        pendingMoves.current = pendingMoves.current.filter(
            move => move.sequenceNumber > serverState.sequenceNumber!
        );
        console.log(`Removed ${initialPendingCount - pendingMoves.current.length} processed moves`);

        // Reapply remaining pending moves only if it's the player's turn
        let reconciledState = { ...serverState };
        if (isCurrentPlayer()) {
            pendingMoves.current.forEach(move => {
                console.log('Reapplying pending move:', move.command);
                reconciledState = applyMove(reconciledState, move.command);
            });
        }

        return reconciledState;
    };

    const connectWebSocket = (roomID: string, currentPlayerID: string) => {
        console.log('Connecting WebSocket:', {
            roomID,
            playerID: currentPlayerID
        });

        if (!roomID || !currentPlayerID) {
            console.error('Connection rejected: missing roomID or playerID');
            alert('Room ID or Player ID is not set');
            return;
        }

        playerID.current = currentPlayerID;

        // Create a variable for the WebSocket URL
        const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;

        // Use the variable in the WebSocket connection
        const socket = new WebSocket(
            `${websocketUrl}?roomID=${roomID}&playerID=${currentPlayerID}`
        );

        socket.onopen = () => {
            console.log('WebSocket connected successfully');
        };

        socket.onmessage = (event) => {
            try {
                const serverState = JSON.parse(event.data) as GameState;
                console.log('Received server state:', {
                    sequenceNumber: serverState.sequenceNumber,
                    currentPlayer: serverState.currentPlayer,
                    players: serverState.players
                });
                
                // Store the latest server state
                localGameState.current = serverState;

                // Reconcile state with pending moves
                const reconciledState = reconcileState(serverState);

                // Update the game with reconciled state
                onMessage(reconciledState);
            } catch (error) {
                console.error('Error processing server message:', error);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Attempt to reconnect after a delay
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                connectWebSocket(roomID, currentPlayerID);
            }, 3000);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            if (!event.wasClean) {
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connectWebSocket(roomID, currentPlayerID);
                }, 3000);
            }
        };

        setWs(socket);
    };

    return { connectWebSocket, sendCommand };
}; 