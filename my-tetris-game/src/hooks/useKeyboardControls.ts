import { useEffect } from 'react';

export const useKeyboardControls = (ws: WebSocket | null) => {
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
}; 