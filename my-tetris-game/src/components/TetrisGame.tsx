import React, { useState } from 'react';
import GameCanvas from './GameCanvas';
import Controls from './Controls';
import { useWebSocket } from '../hooks/useWebSocket';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { GameState } from '../types/game';

const TetrisGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [roomID, setRoomID] = useState<string | null>(null);
    const [playerID, setPlayerID] = useState<string | null>(null);
    const [score, setScore] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);

    const { connectWebSocket, sendCommand } = useWebSocket({
        onMessage: (newGameState: GameState) => {
            setGameState(newGameState);
            setScore(newGameState.score);
            setLevel(newGameState.level);
        }
    });

    useKeyboardControls(sendCommand);

    const createRoom = async () => {
        try {
            const response = await fetch('/api/create-room');
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            const newRoomID = await response.text();
            setRoomID(newRoomID);
            // When creating a room, we also need to join it
            await joinRoom(newRoomID);
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room');
        }
    };

    const joinRoom = async (inputRoomID: string) => {
        try {
            console.log('Attempting to join room:', inputRoomID);
            
            const response = await fetch(`/api/join-room?roomID=${inputRoomID}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to join room: ${response.status}`);
            }

            const data = await response.json();
            console.log('Join room response:', data);
            
            if (data && data.message && data.playerID) {
                setRoomID(inputRoomID);
                setPlayerID(data.playerID); // Set the playerID from server response
                alert(data.message);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room');
        }
    };

    const startGame = () => {
        if (roomID && playerID) {
            connectWebSocket(roomID, playerID);
        } else {
            alert('Please join a room first');
        }
    };

    return (
        <div className="game-container">
            <GameCanvas gameState={gameState} />
            <div className="info">
                <div>Score: <span>{score}</span></div>
                <div>Level: <span>{level}</span></div>
                {roomID && <div>Room ID: <span>{roomID}</span></div>}
                {playerID && <div>Player ID: <span>{playerID}</span></div>}
            </div>
            <Controls 
                createRoom={createRoom}
                joinRoom={joinRoom}
                startGame={startGame}
            />
        </div>
    );
};

export default TetrisGame;