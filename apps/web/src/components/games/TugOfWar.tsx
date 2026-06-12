import React from 'react';

interface TugOfWarProps {
  opponentNickname: string;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  isPlayer1: boolean;
  myGuestId: string | null;
  onPull: () => void;
  onClose: () => void;
}

export const TugOfWar: React.FC<TugOfWarProps> = ({
  opponentNickname,
  board,
  gameOver,
  isPlayer1,
  myGuestId,
  onPull,
  onClose,
}) => {
  // Rope position (starts at 0, winner at +10 or -10)
  const ropePos = board[0] ? parseInt(board[0], 10) : 0;

  // Calculate percentage offset for the knot
  // Range is -10 to +10, map this to 0% to 100% (50% is center)
  // Each step is 5% offset.
  const knotPercent = 50 + (ropePos * 5);

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
        maxWidth: '500px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
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
          <h2 className="text-gradient">Tug of War</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Directions info */}
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <span>Your Goal: Pull the rope to the </span>
          <strong style={{ color: 'var(--accent-primary)' }}>{isPlayer1 ? 'RIGHT ➡️' : '⬅️ LEFT'}</strong>
        </div>

        {/* Rope slider track container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '60px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Center Line Marker */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'rgba(255,255,255,0.15)',
            zIndex: 1
          }} />

          {/* Winning Flags markers */}
          <div style={{ position: 'absolute', left: '20px', color: '#ff4d4d', fontWeight: 'bold', zIndex: 1, pointerEvents: 'none' }}>🚩 [P2]</div>
          <div style={{ position: 'absolute', right: '20px', color: '#ffd700', fontWeight: 'bold', zIndex: 1, pointerEvents: 'none' }}>[P1] 🚩</div>

          {/* Rope line */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'radial-gradient(ellipse at center, #d35400 0%, #a04000 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            borderRadius: '4px',
            position: 'relative'
          }}>
            {/* Moving Knot */}
            <div style={{
              position: 'absolute',
              left: `${knotPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#fff',
              border: '4px solid var(--accent-primary)',
              boxShadow: '0 0 15px var(--accent-primary)',
              transition: 'left 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />
          </div>
        </div>

        {/* Pull Tap Button */}
        {!gameOver && (
          <button 
            className="btn-primary" 
            onClick={onPull}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(9, 121, 105, 0.4)',
              cursor: 'pointer',
              border: '4px solid rgba(255,255,255,0.1)',
              animation: 'bounceSlow 2s infinite'
            }}
          >
            PULL! 🪢
          </button>
        )}

        <style>{`
          @keyframes bounceSlow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>

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
            textAlign: 'center',
            zIndex: 100
          }}>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem' }}>
              {gameOver.winnerId === myGuestId ? '🏆 Victory!' : `💀 Defeat! ${gameOver.winnerName} wins`}
            </h3>
            {gameOver.disconnected && (
              <p style={{ color: '#ff4d4d' }}>Opponent disconnected in the middle of the pull.</p>
            )}
            <button className="btn-primary" onClick={onClose}>
              Back to Lobby
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
