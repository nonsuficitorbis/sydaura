import React, { useState } from 'react';

interface BattleshipProps {
  opponentNickname: string;
  symbol: string; // 'B'
  myTurn: boolean;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  battleshipState: {
    placementDone: boolean;
    p1Placed: boolean;
    p2Placed: boolean;
  };
  myGuestId: string | null;
  isPlayer1: boolean;
  onPlaceShips: (shipCoords: number[]) => void;
  onStrike: (coordIdx: number) => void;
  onClose: () => void;
}

export const Battleship: React.FC<BattleshipProps> = ({
  opponentNickname,
  myTurn,
  board,
  gameOver,
  battleshipState,
  isPlayer1,
  myGuestId,
  onPlaceShips,
  onStrike,
  onClose,
}) => {
  const myPlaced = isPlayer1 ? battleshipState.p1Placed : battleshipState.p2Placed;

  // Local state for selecting 6 ship cells during placement
  const [selectedCoords, setSelectedCoords] = useState<number[]>([]);

  const handlePlacementCellClick = (idx: number) => {
    if (myPlaced) return;
    if (selectedCoords.includes(idx)) {
      setSelectedCoords(prev => prev.filter(c => c !== idx));
    } else {
      if (selectedCoords.length >= 6) return;
      setSelectedCoords(prev => [...prev, idx]);
    }
  };

  const handleConfirmPlacement = () => {
    if (selectedCoords.length !== 6) return;
    onPlaceShips(selectedCoords);
  };

  // Render Placement View
  if (!battleshipState.placementDone) {
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
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', position: 'relative' }}>
          <h2 className="text-gradient">Place Your Fleet</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Choose exactly 6 grid squares to deploy your patrol fleet secretly.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateRows: 'repeat(6, 1fr)',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.35rem',
            width: '280px',
            height: '280px',
            margin: '0 auto 1.5rem auto'
          }}>
            {Array.from({ length: 36 }).map((_, idx) => {
              const selected = selectedCoords.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handlePlacementCellClick(idx)}
                  disabled={myPlaced}
                  style={{
                    background: selected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    cursor: myPlaced ? 'default' : 'pointer',
                    boxShadow: selected ? '0 0 8px var(--accent-primary)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  className={!myPlaced ? 'hover-lift' : ''}
                />
              );
            })}
          </div>

          {!myPlaced ? (
            <button
              className="btn-primary"
              disabled={selectedCoords.length !== 6}
              onClick={handleConfirmPlacement}
              style={{ width: '100%' }}
            >
              Confirm Deployment ({selectedCoords.length}/6)
            </button>
          ) : (
            <div style={{ padding: '0.75rem', background: 'rgba(9, 121, 105, 0.1)', borderRadius: '12px', border: '1px solid rgba(9, 121, 105, 0.3)' }}>
              <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 600 }} className="pulse-animation">
                Fleet Deployed!
              </p>
              <p className="text-secondary" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                Waiting for {opponentNickname} to finish deployment...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Firing Game View
  // My grid data is indices 0-35 (if P1) or 36-71 (if P2)
  // Opponent grid data (target) is indices 36-71 (if P1) or 0-35 (if P2)
  const myGridOffset = isPlayer1 ? 0 : 36;
  const oppGridOffset = isPlayer1 ? 36 : 0;

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
        maxWidth: '640px',
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
          <h2 className="text-gradient">Battleship</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Turn Status */}
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: myTurn ? '#50c878' : 'var(--text-muted)' }}>
          {myTurn ? '🚨 Your Turn to Fire!' : `Opponent ${opponentNickname} is targeting...`}
        </div>

        {/* Double Grids Layout */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%'
        }}>
          {/* My Defensive Board */}
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>My Defensive Grid</h4>
            <div style={{
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.3rem',
              width: '220px',
              height: '220px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '8px'
            }}>
              {Array.from({ length: 36 }).map((_, idx) => {
                const globalIdx = myGridOffset + idx;
                const cellStatus = board[globalIdx]; // 'H' or 'M' or null
                const isMyShip = selectedCoords.includes(idx);

                let bg = 'rgba(255,255,255,0.02)';
                if (isMyShip) bg = 'rgba(9, 121, 105, 0.3)'; // Green ship
                if (cellStatus === 'H') bg = '#ff4d4d'; // Sunk/Hit
                if (cellStatus === 'M') bg = '#7f8c8d'; // Miss

                return (
                  <div
                    key={idx}
                    style={{
                      background: bg,
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      boxShadow: cellStatus === 'H' ? '0 0 6px #ff4d4d' : 'none',
                      transition: 'background 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    {cellStatus && cellStatus}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opponent Offensive Board (Targeting) */}
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Opponent Targeting Grid</h4>
            <div style={{
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.3rem',
              width: '220px',
              height: '220px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '8px'
            }}>
              {Array.from({ length: 36 }).map((_, idx) => {
                const globalIdx = oppGridOffset + idx;
                const cellStatus = board[globalIdx]; // 'H' or 'M' or null
                const clickable = myTurn && !gameOver && cellStatus === null;

                let bg = 'rgba(255, 255, 255, 0.03)';
                if (cellStatus === 'H') bg = '#ff4d4d'; // Hit
                if (cellStatus === 'M') bg = '#7f8c8d'; // Miss

                return (
                  <button
                    key={idx}
                    disabled={!clickable}
                    onClick={() => onStrike(idx)}
                    style={{
                      background: bg,
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      cursor: clickable ? 'pointer' : 'default',
                      boxShadow: cellStatus === 'H' ? '0 0 6px #ff4d4d' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                    className={clickable ? 'hover-lift' : ''}
                  >
                    {cellStatus && cellStatus}
                  </button>
                );
              })}
            </div>
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
            textAlign: 'center',
            zIndex: 100
          }}>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem' }}>
              {gameOver.winnerId === myGuestId ? '🎉 You Won!' : `💀 Defeat! ${gameOver.winnerName} wins`}
            </h3>
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
