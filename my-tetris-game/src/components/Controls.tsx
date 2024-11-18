import React from 'react';

interface ControlsProps {
    createRoom: () => void;
    joinRoom: () => void;
    startGame: () => void;
}

const Controls: React.FC<ControlsProps> = ({ createRoom, joinRoom, startGame }) => {
    return (
        <div className="controls">
            <button onClick={createRoom}>Create Room</button>
            <input type="text" id="roomID" placeholder="Room ID" />
            <button onClick={joinRoom}>Join Room</button>
            <button onClick={startGame}>Start Game</button>
        </div>
    );
};

export default Controls;
