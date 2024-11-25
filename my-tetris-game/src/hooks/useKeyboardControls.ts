import { useEffect } from 'react';

export const useKeyboardControls = (
    sendCommand: (command: string) => void
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowLeft':
                    sendCommand('left');
                    break;
                case 'ArrowRight':
                    sendCommand('right');
                    break;
                case 'ArrowDown':
                    sendCommand('down');
                    break;
                case 'ArrowUp':
                    sendCommand('rotate');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sendCommand]);
}; 