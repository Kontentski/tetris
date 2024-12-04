import React from "react";

interface NextPieceProps {
    nextPiece: {
        shape: boolean[][];
        color: string;
    } | null;
}

const NextPiece: React.FC<NextPieceProps> = ({ nextPiece }) => {
    if (!nextPiece) return null;

    return (
        <div className="next-piece">
            <div className="piece-container">
                <div 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 20px)` 
                    }}
                >
                    {nextPiece.shape.map((row, rowIndex) => (
                        <div key={rowIndex} style={{ display: 'contents' }}>
                            {row.map((cell, colIndex) => (
                                <div
                                    key={colIndex}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: cell ? nextPiece.color : 'transparent',
                                        border: cell ? '1px solid #333' : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NextPiece;
