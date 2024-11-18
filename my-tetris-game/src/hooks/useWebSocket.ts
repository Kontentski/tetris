import { useState } from 'react';

interface WebSocketHookProps {
    onMessage: (data: string) => void;
}

export const useWebSocket = ({ onMessage }: WebSocketHookProps) => {
    const [ws, setWs] = useState<WebSocket | null>(null);

    const connectWebSocket = (roomID: string, playerID: string) => {
        if (!roomID || !playerID) {
            alert('Room ID or Player ID is not set');
            return;
        }
        const socket = new WebSocket(
            `ws://localhost:8080/ws?roomID=${roomID}&playerID=${playerID}`
        );
        socket.onmessage = (event) => onMessage(event.data);
        setWs(socket);
    };

    return { ws, connectWebSocket };
}; 