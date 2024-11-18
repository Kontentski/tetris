import React, { useRef } from 'react';

interface ControlsProps {
    createRoom: () => void;
    joinRoom: (roomID: string) => void;  // Update to accept roomID parameter
    startGame: () => void;
}

const Controls: React.FC<ControlsProps> = ({ createRoom, joinRoom, startGame }) => {
    const roomInputRef = useRef<HTMLInputElement>(null);

    const handleJoinRoom = () => {
        const roomID = roomInputRef.current?.value;
        if (roomID) {
            joinRoom(roomID);
        } else {
            alert('Please enter a room ID');
        }
    };

    return (
        <div className="controls">
            <button onClick={createRoom}>Create Room</button>
            <input ref={roomInputRef} type="text" placeholder="Room ID" />
            <button onClick={handleJoinRoom}>Join Room</button>
            <button onClick={startGame}>Start Game</button>
        </div>
    );
};

export default Controls;