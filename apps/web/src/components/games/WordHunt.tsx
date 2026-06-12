import React, { useState, useEffect } from 'react';

interface WordHuntProps {
  opponentNickname: string;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    scores?: { p1Score: number; p2Score: number };
    disconnected?: boolean;
  } | null;
  wordHuntState: {
    p1Score: number;
    p2Score: number;
    p1Words: string[];
    p2Words: string[];
  };
  isPlayer1: boolean;
  myGuestId: string | null;
  onSubmitWord: (word: string) => void;
  onClose: () => void;
}

export const WordHunt: React.FC<WordHuntProps> = ({
  opponentNickname,
  board,
  gameOver,
  wordHuntState,
  isPlayer1,
  myGuestId,
  onSubmitWord,
  onClose,
}) => {
  const myScore = isPlayer1 ? wordHuntState.p1Score : wordHuntState.p2Score;
  const oppScore = isPlayer1 ? wordHuntState.p2Score : wordHuntState.p1Score;
  const myWords = isPlayer1 ? wordHuntState.p1Words : wordHuntState.p2Words;
  const oppWords = isPlayer1 ? wordHuntState.p2Words : wordHuntState.p1Words;

  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  // Local Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputWord.trim().toUpperCase();
    if (clean.length >= 3) {
      onSubmitWord(clean);
      setInputWord('');
    }
  };

  // Convert flat board array of size 16 into a 4x4 matrix representation
  const gridCells = board.slice(0, 16);

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
        gap: '1rem',
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
          <h2 className="text-gradient">Word Hunt</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Timer and Score Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Mine: {myScore}</span>
            <span style={{ color: 'var(--text-muted)' }}>Opponent: {oppScore}</span>
          </div>
          <div style={{ fontWeight: 'bold', color: timeLeft <= 10 ? '#ff4d4d' : 'var(--text-secondary)' }}>
            ⏱️ {timeLeft}s left
          </div>
        </div>

        {/* 4x4 Boggle Grid */}
        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(4, 1fr)',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.4rem',
          width: '260px',
          height: '260px',
          background: 'rgba(9, 121, 105, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '12px'
        }}>
          {gridCells.map((letter, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                textShadow: '0 0 4px rgba(255, 255, 255, 0.1)',
                userSelect: 'none'
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Input box */}
        {!gameOver && (
          <form onSubmit={handleWordSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              type="text"
              className="input-premium"
              placeholder="Type word (min 3 letters)..."
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              style={{ flex: 1, textTransform: 'uppercase' }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem' }}>
              Submit
            </button>
          </form>
        )}

        {/* Found Words Lists */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100px', overflowY: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>My Words ({myWords?.length}):</h5>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {myWords?.map((w, idx) => <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{w}</span>)}
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.5rem' }}>
            <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opponent's Words:</h5>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {oppWords?.map((w, idx) => <span key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px' }}>{w}</span>)}
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
              {gameOver.winnerId === myGuestId ? '🎉 Victory!' : gameOver.draw ? "It's a Draw!" : `💀 Defeat! ${gameOver.winnerName} wins`}
            </h3>
            <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
              Final Scores:<br />
              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Mine: {myScore}</span> | <span style={{ color: 'var(--text-muted)' }}>Opponent: {oppScore}</span>
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
