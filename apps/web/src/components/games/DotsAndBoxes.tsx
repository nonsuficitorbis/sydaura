import React from 'react';

interface DotsAndBoxesProps {
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
  onMove: (lineIndex: number) => void;
  onClose: () => void;
}

export const DotsAndBoxes: React.FC<DotsAndBoxesProps> = ({
  opponentNickname,
  symbol,
  myTurn,
  board,
  gameOver,
  onMove,
  onClose,
}) => {
  // Count scores from box indices (40 to 55)
  const redScore = board.slice(40, 56).filter(val => val === 'R').length;
  const yellowScore = board.slice(40, 56).filter(val => val === 'Y').length;

  const isLineSelected = (index: number) => board[index] !== null;
  const getLineColor = (index: number) => {
    const val = board[index];
    if (val === 'R') return '#ff4d4d'; // Red
    if (val === 'Y') return '#ffd700'; // Yellow
    return 'transparent';
  };

  const handleLineClick = (index: number) => {
    if (myTurn && !gameOver && !isLineSelected(index)) {
      onMove(index);
    }
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
        maxWidth: '500px',
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
          <h2 className="text-gradient">Dots & Boxes</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Score & Turn Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '1.1rem' }}>
            <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Red: {redScore}</span>
            <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Yellow: {yellowScore}</span>
          </div>
          <div style={{ fontSize: '0.95rem' }}>
            <span>Your Color: </span>
            <span style={{ 
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: symbol === 'R' ? '#ff4d4d' : '#ffd700',
              verticalAlign: 'middle',
              marginRight: '0.5rem'
            }}></span>
            <strong> {symbol === 'R' ? 'Red' : 'Yellow'}</strong>
            <span style={{ margin: '0 1rem' }}>|</span>
            <strong style={{ color: myTurn ? '#50c878' : 'var(--text-muted)' }}>
              {myTurn ? 'Your Turn' : "Opponent's Turn"}
            </strong>
          </div>
        </div>

        {/* Interactive Game Board */}
        <div style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          background: 'rgba(9, 121, 105, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          {/* Claimed Boxes Backgrounds */}
          <div style={{
            position: 'absolute',
            top: '20px', left: '20px', right: '20px', bottom: '20px',
            display: 'grid',
            gridTemplateRows: 'repeat(4, 1fr)',
            gridTemplateColumns: 'repeat(4, 1fr)',
            pointerEvents: 'none'
          }}>
            {Array.from({ length: 16 }).map((_, idx) => {
              const owner = board[40 + idx];
              let background = 'transparent';
              if (owner === 'R') background = 'rgba(255, 77, 77, 0.15)';
              if (owner === 'Y') background = 'rgba(255, 215, 0, 0.15)';
              return (
                <div 
                  key={idx} 
                  style={{
                    background,
                    border: '1px solid transparent',
                    boxSizing: 'border-box',
                    transition: 'background 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: owner === 'R' ? 'rgba(255, 77, 77, 0.8)' : 'rgba(255, 215, 0, 0.8)',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  {owner && owner}
                </div>
              );
            })}
          </div>

          {/* Dots Grid Layout */}
          <div style={{
            position: 'absolute',
            top: '20px', left: '20px', right: '20px', bottom: '20px',
            display: 'grid',
            gridTemplateRows: 'repeat(5, 1fr)',
            gridTemplateColumns: 'repeat(5, 1fr)',
            height: 'calc(100% - 40px)',
            width: 'calc(100% - 40px)'
          }}>
            {/* Draw Horizontal Lines */}
            {Array.from({ length: 20 }).map((_, idx) => {
              const row = Math.floor(idx / 4);
              const col = idx % 4;
              const selected = isLineSelected(idx);
              const color = getLineColor(idx);
              const topOffset = `${row * 25}%`;
              const leftOffset = `${col * 25}%`;

              return (
                <div
                  key={`h-${idx}`}
                  onClick={() => handleLineClick(idx)}
                  style={{
                    position: 'absolute',
                    top: `calc(${topOffset} - 4px)`,
                    left: `calc(${leftOffset} + 6px)`,
                    width: 'calc(25% - 12px)',
                    height: '10px',
                    cursor: (!selected && myTurn && !gameOver) ? 'pointer' : 'default',
                    zIndex: 10
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '4px',
                    marginTop: '3px',
                    borderRadius: '2px',
                    background: selected ? color : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: selected ? `0 0 8px ${color}` : 'none',
                    transition: 'all 0.2s ease',
                  }} 
                  className={(!selected && myTurn && !gameOver) ? 'hover-line-glow' : ''}
                  />
                </div>
              );
            })}

            {/* Draw Vertical Lines */}
            {Array.from({ length: 20 }).map((_, idx) => {
              const row = Math.floor(idx / 5);
              const col = idx % 5;
              const boardIdx = 20 + idx;
              const selected = isLineSelected(boardIdx);
              const color = getLineColor(boardIdx);
              const topOffset = `${row * 25}%`;
              const leftOffset = `${col * 25}%`;

              return (
                <div
                  key={`v-${idx}`}
                  onClick={() => handleLineClick(boardIdx)}
                  style={{
                    position: 'absolute',
                    top: `calc(${topOffset} + 6px)`,
                    left: `calc(${leftOffset} - 4px)`,
                    width: '10px',
                    height: 'calc(25% - 12px)',
                    cursor: (!selected && myTurn && !gameOver) ? 'pointer' : 'default',
                    zIndex: 10
                  }}
                >
                  <div style={{
                    width: '4px',
                    height: '100%',
                    marginLeft: '3px',
                    borderRadius: '2px',
                    background: selected ? color : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: selected ? `0 0 8px ${color}` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  className={(!selected && myTurn && !gameOver) ? 'hover-line-glow' : ''}
                  />
                </div>
              );
            })}

            {/* Draw Grid Dots */}
            {Array.from({ length: 25 }).map((_, idx) => {
              const row = Math.floor(idx / 5);
              const col = idx % 5;
              return (
                <div
                  key={`dot-${idx}`}
                  style={{
                    position: 'absolute',
                    top: `calc(${row * 25}% - 4px)`,
                    left: `calc(${col * 25}% - 4px)`,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--text-secondary)',
                    boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                    pointerEvents: 'none',
                    zIndex: 20
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* CSS custom hover animations */}
        <style>{`
          .hover-line-glow:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            box-shadow: 0 0 6px rgba(255,255,255,0.3) !important;
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
              {gameOver.draw ? "It's a Draw!" : gameOver.winnerName ? `${gameOver.winnerName} Wins!` : 'Game Over'}
            </h3>
            <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
              Final Score:<br />
              <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Red: {redScore}</span> | <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Yellow: {yellowScore}</span>
            </p>
            {gameOver.disconnected && (
              <p style={{ color: '#ff4d4d' }}>Opponent disconnected from the match.</p>
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
