import React from 'react';

interface ConnectFourProps {
  opponentNickname: string;
  symbol: 'R' | 'Y';
  myTurn: boolean;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  onDrop: (column: number) => void;
  onClose: () => void;
}

export const ConnectFour: React.FC<ConnectFourProps> = ({
  opponentNickname,
  symbol,
  myTurn,
  board,
  gameOver,
  onDrop,
  onClose,
}) => {
  const ROWS = 6;
  const COLS = 7;

  // Check if a column has at least one empty slot at the top row (row 0)
  const isColumnPlayable = (col: number) => {
    return board[col] === null && myTurn && !gameOver;
  };

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
        maxWidth: '550px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        position: 'relative'
      }}>
        
        {/* Close Button */}
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
          <h2 className="text-gradient">Connect 4</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Info indicators */}
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem' }}>
          <div>
            <span>Your Color: </span>
            <span style={{ 
              display: 'inline-block',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: symbol === 'R' ? '#ff4d4d' : '#ffd700',
              verticalAlign: 'middle',
              marginLeft: '0.25rem'
            }}></span>
            <strong> {symbol === 'R' ? 'Red' : 'Yellow'}</strong>
          </div>
          <div>
            <span>Turn: </span>
            <strong style={{ color: myTurn ? '#50c878' : 'var(--text-muted)' }}>
              {myTurn ? 'Your Turn' : "Opponent's Turn"}
            </strong>
          </div>
        </div>

        {/* Board Frame Wrapper */}
        <div style={{
          background: 'rgba(9, 121, 105, 0.1)',
          border: '4px solid var(--accent-primary)',
          borderRadius: '16px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '380px'
        }}>
          
          {/* Column Drop Buttons Indicator Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.4rem',
            textAlign: 'center',
          }}>
            {Array.from({ length: COLS }).map((_, c) => {
              const active = isColumnPlayable(c);
              return (
                <button
                  key={c}
                  onClick={() => active && onDrop(c)}
                  disabled={!active}
                  style={{
                    background: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '24px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: active ? 'pointer' : 'default',
                    fontSize: '0.8rem',
                    transition: 'all 0.15s ease'
                  }}
                  className={active ? 'hover-lift' : ''}
                >
                  ↓
                </button>
              );
            })}
          </div>

          {/* Grid Slots */}
          <div style={{
            display: 'grid',
            gridTemplateRows: 'repeat(6, 1fr)',
            gap: '0.4rem',
          }}>
            {Array.from({ length: ROWS }).map((_, r) => (
              <div key={r} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem',
              }}>
                {Array.from({ length: COLS }).map((_, c) => {
                  const cellValue = board[r * COLS + c];
                  let circleColor = 'transparent';
                  let border = '1px solid var(--border-subtle)';
                  
                  if (cellValue === 'R') {
                    circleColor = '#ff4d4d'; // Red
                    border = '1px solid #ff4d4d';
                  } else if (cellValue === 'Y') {
                    circleColor = '#ffd700'; // Yellow
                    border = '1px solid #ffd700';
                  }

                  return (
                    <div
                      key={c}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '50%',
                        background: circleColor,
                        border: border,
                        transition: 'background var(--transition-fast)'
                      }}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>

        {/* Win/Lose Screen Overlay */}
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
              <p style={{ color: '#ff4d4d' }}>Opponent disconnected from the match.</p>
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
