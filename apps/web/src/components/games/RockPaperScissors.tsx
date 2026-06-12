import React from 'react';

interface RockPaperScissorsProps {
  opponentNickname: string;
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
  rpsRound: number;
  rpsChoiceConfirmed: 'ROCK' | 'PAPER' | 'SCISSORS' | null;
  rpsRoundResults: {
    p1Choice: 'ROCK' | 'PAPER' | 'SCISSORS';
    p2Choice: 'ROCK' | 'PAPER' | 'SCISSORS';
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    scores: { p1Score: number; p2Score: number };
  } | null;
  isPlayer1: boolean;
  myGuestId: string | null;
  onSubmitChoice: (choice: 'ROCK' | 'PAPER' | 'SCISSORS') => void;
  onClose: () => void;
}

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({
  opponentNickname,
  gameOver,
  rpsRound,
  rpsChoiceConfirmed,
  rpsRoundResults,
  isPlayer1,
  myGuestId,
  onSubmitChoice,
  onClose,
}) => {
  // Score tracking
  const myWins = rpsRoundResults ? (isPlayer1 ? rpsRoundResults.scores.p1Score : rpsRoundResults.scores.p2Score) : 0;
  const oppWins = rpsRoundResults ? (isPlayer1 ? rpsRoundResults.scores.p2Score : rpsRoundResults.scores.p1Score) : 0;

  // Icon maps
  const getChoiceIcon = (choice: string) => {
    switch (choice) {
      case 'ROCK': return '✊';
      case 'PAPER': return '✋';
      case 'SCISSORS': return '✌️';
      default: return '?';
    }
  };

  const mySelection = rpsRoundResults ? (isPlayer1 ? rpsRoundResults.p1Choice : rpsRoundResults.p2Choice) : rpsChoiceConfirmed;
  const oppSelection = rpsRoundResults ? (isPlayer1 ? rpsRoundResults.p2Choice : rpsRoundResults.p1Choice) : null;

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
          <h2 className="text-gradient">Rock Paper Scissors</h2>
          <p className="text-secondary">Opponent: {opponentNickname}</p>
        </div>

        {/* Round Roster Scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
          <h4 style={{ margin: 0, letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ROUND {rpsRound}/3
          </h4>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span>You: {myWins} 🏆</span>
            <span>Opponent: {oppWins} 👤</span>
          </div>
        </div>

        {/* Dynamic game status */}
        {!mySelection ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <p className="text-secondary" style={{ fontSize: '0.95rem' }}>Select your move:</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', width: '100%' }}>
              {(['ROCK', 'PAPER', 'SCISSORS'] as const).map((choice) => (
                <button
                  key={choice}
                  onClick={() => onSubmitChoice(choice)}
                  style={{
                    flex: 1,
                    height: '100px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="hover-lift"
                >
                  {getChoiceIcon(choice)}
                </button>
              ))}
            </div>
          </div>
        ) : !rpsRoundResults ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {getChoiceIcon(mySelection)}
            </div>
            <p className="text-secondary pulse-animation" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
              Choice confirmed! Waiting for opponent...
            </p>
          </div>
        ) : (
          /* Standoff outcome result */
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', alignItems: 'center', margin: '1rem 0' }}>
              <div>
                <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>You</p>
                <div style={{ fontSize: '3.5rem' }}>{getChoiceIcon(mySelection)}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>VS</div>
              <div>
                <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>{opponentNickname}</p>
                <div style={{ fontSize: '3.5rem' }}>{getChoiceIcon(oppSelection || '')}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', color: rpsRoundResults.draw ? 'var(--text-muted)' : rpsRoundResults.winnerId === myGuestId ? '#50c878' : '#ff4d4d' }}>
              {rpsRoundResults.draw ? "Draw Round!" : rpsRoundResults.winnerId === myGuestId ? "You Won the Round! 🎉" : "Opponent Won the Round ❌"}
            </h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Get ready for the next round...</p>
          </div>
        )}

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
              {gameOver.winnerId === myGuestId ? '🏆 Victory!' : '💀 Defeat!'}
            </h2>
            <p className="text-secondary" style={{ fontSize: '1.2rem', margin: 0 }}>
              {gameOver.winnerName ? `${gameOver.winnerName} wins the match!` : 'Match concluded'}
            </p>
            {gameOver.disconnected && (
              <p style={{ color: '#ff4d4d' }}>Opponent disconnected in the middle of the match.</p>
            )}
            <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem' }}>
              Back to Lobby
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
