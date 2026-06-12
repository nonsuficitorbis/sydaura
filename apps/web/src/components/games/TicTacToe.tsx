import React from 'react';

interface TicTacToeProps {
  opponentNickname: string;
  symbol: 'X' | 'O';
  myTurn: boolean;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  onMove: (cellIndex: number) => void;
  onClose: () => void;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({
  opponentNickname,
  symbol,
  myTurn,
  board,
  gameOver,
  onMove,
  onClose,
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 15, 15, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="glass-card" style={{
        maxWidth: '450px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative'
      }}>
        
        {/* Close button */}
        {gameOver && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        )}

        <div style={{ textAlign: 'center' }}>
          <h2 className="text-gradient">Tic-Tac-Toe</h2>
          <p className="text-secondary">Playing against {opponentNickname}</p>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem' }}>
          <div>
            <span>Your Symbol: </span>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{symbol}</strong>
          </div>
          <div>
            <span>Status: </span>
            <strong style={{ color: myTurn ? '#50c878' : 'var(--text-muted)' }}>
              {myTurn ? 'Your Turn' : "Opponent's Turn"}
            </strong>
          </div>
        </div>

        {/* 3x3 Grid Board */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '300px',
          aspectRatio: '1'
        }}>
          {board.map((cell, index) => {
            const isClickable = myTurn && cell === null && !gameOver;
            return (
              <button
                key={index}
                onClick={() => isClickable && onMove(index)}
                disabled={!isClickable}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: cell === 'X' ? 'var(--accent-primary)' : cell === 'O' ? '#50c878' : 'transparent',
                  cursor: isClickable ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background var(--transition-fast)',
                }}
                className={isClickable ? 'hover-lift' : ''}
              >
                {cell || '.'}
              </button>
            );
          })}
        </div>

        {/* Win/Lose/Draw Modal Screen overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(20, 20, 20, 0.95)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem' }}>
              {gameOver.draw ? "It's a Draw!" : gameOver.winnerName ? `${gameOver.winnerName} Wins!` : 'Game Over'}
            </h3>
            {gameOver.disconnected && (
              <p style={{ color: '#ff4d4d' }}>Opponent disconnected from the game.</p>
            )}
            <p className="text-secondary">Return to the lobby to challenge someone else.</p>
            <button className="btn-primary" onClick={onClose}>
              Back to Lobby
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
