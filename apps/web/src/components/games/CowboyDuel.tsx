import React from 'react';

interface CowboyDuelProps {
  opponentNickname: string;
  myTurn: boolean;
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  duelState: 'STEADY' | 'DRAW' | 'ROUND_OVER' | null;
  duelRound: number;
  duelResults: {
    winnerId: string | null;
    winnerName: string | null;
    foul: boolean;
    foulPlayerName?: string;
    p1ShotTime?: number;
    p2ShotTime?: number;
    scores: { p1Score: number; p2Score: number };
  } | null;
  isPlayer1: boolean;
  onShoot: () => void;
  onClose: () => void;
}

export const CowboyDuel: React.FC<CowboyDuelProps> = ({
  opponentNickname,
  gameOver,
  duelState,
  duelRound,
  duelResults,
  isPlayer1,
  onShoot,
  onClose,
}) => {
  // Score tracking
  const myWins = duelResults ? (isPlayer1 ? duelResults.scores.p1Score : duelResults.scores.p2Score) : 0;
  const oppWins = duelResults ? (isPlayer1 ? duelResults.scores.p2Score : duelResults.scores.p1Score) : 0;

  // Shot times
  const myShotTime = duelResults ? (isPlayer1 ? duelResults.p1ShotTime : duelResults.p2ShotTime) : undefined;
  const oppShotTime = duelResults ? (isPlayer1 ? duelResults.p2ShotTime : duelResults.p1ShotTime) : undefined;

  // Render atmospheric duel state styles
  let containerBg = 'rgba(20, 20, 20, 0.98)';
  let glowColor = 'rgba(255, 255, 255, 0.05)';
  let statusText = 'WAITING FOR ROUND START...';
  let instruction = 'Get ready to tap the screen...';

  if (duelState === 'STEADY') {
    containerBg = 'rgba(15, 10, 10, 0.98)';
    glowColor = 'rgba(231, 76, 60, 0.1)';
    statusText = 'READY... STEADY...';
    instruction = 'Do NOT tap yet! Tap early and you lose.';
  } else if (duelState === 'DRAW') {
    containerBg = 'rgba(9, 121, 105, 0.98)';
    glowColor = 'rgba(80, 200, 120, 0.5)';
    statusText = 'DRAW! 🤠🔫';
    instruction = 'TAP NOW! FAST!';
  } else if (duelState === 'ROUND_OVER') {
    containerBg = 'rgba(20, 20, 20, 0.98)';
    glowColor = 'rgba(255, 255, 255, 0.05)';
    
    if (duelResults?.foul) {
      statusText = `FOUL! ❌`;
      instruction = `${duelResults.foulPlayerName} shot too early!`;
    } else {
      statusText = `${duelResults?.winnerName} won the round!`;
      instruction = 'Prepare for the next standoff...';
    }
  }

  const handleContainerClick = () => {
    if (duelState === 'STEADY' || duelState === 'DRAW') {
      onShoot();
    }
  };

  return (
    <div 
      onClick={handleContainerClick}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: containerBg,
        boxShadow: `inset 0 0 100px ${glowColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        boxSizing: 'border-box',
        cursor: (duelState === 'STEADY' || duelState === 'DRAW') ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.15s ease'
      }}
    >
      
      {/* Top Banner stats */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#fff',
        pointerEvents: 'none'
      }}>
        <h4 style={{ margin: 0, letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          QUICK DRAW DUEL — ROUND {duelRound}/3
        </h4>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
          <span>You: {myWins} 🤠</span>
          <span>{opponentNickname}: {oppWins} 👤</span>
        </div>
      </div>

      {/* Main Duel Flash Zone */}
      <div style={{
        textAlign: 'center',
        pointerEvents: 'none',
        animation: duelState === 'DRAW' ? 'pulseGrow 0.15s infinite alternate' : 'none'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          margin: '0 0 1rem 0',
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 20px rgba(255,255,255,0.4)',
          letterSpacing: '1px'
        }}>
          {statusText}
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255,255,255,0.7)',
          margin: 0
        }}>
          {instruction}
        </p>

        {/* Reaction Times display */}
        {duelState === 'ROUND_OVER' && duelResults && (
          <div style={{
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '1rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div>
              <span>Your reaction: </span>
              <strong style={{ color: myShotTime === -1 ? '#ff4d4d' : '#50c878' }}>
                {myShotTime === -1 ? 'FOUL (Early)' : myShotTime ? `${myShotTime}ms` : 'Waiting...'}
              </strong>
            </div>
            <div>
              <span>{opponentNickname}: </span>
              <strong style={{ color: oppShotTime === -1 ? '#ff4d4d' : '#50c878' }}>
                {oppShotTime === -1 ? 'FOUL (Early)' : oppShotTime ? `${oppShotTime}ms` : 'Waiting...'}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Custom Keyframe animations */}
      <style>{`
        @keyframes pulseGrow {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      `}</style>

      {/* Final Game Over Overlay */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 15, 15, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          zIndex: 1100
        }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
            {gameOver.winnerId === (isPlayer1 ? 'P1' : 'P2') || gameOver.winnerName ? '🏆 DUEL VICTOR!' : '💀 DEFEAT!'}
          </h2>
          <p className="text-secondary" style={{ fontSize: '1.2rem', margin: 0 }}>
            {gameOver.winnerName ? `${gameOver.winnerName} wins the shootout!` : 'Showout concluded'}
          </p>
          {gameOver.disconnected && (
            <p style={{ color: '#ff4d4d' }}>Opponent disconnected in the middle of the standoff.</p>
          )}
          <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem' }}>
            Return to Lobby
          </button>
        </div>
      )}

    </div>
  );
};
