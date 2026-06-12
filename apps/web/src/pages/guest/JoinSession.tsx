import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameSocket } from '../../hooks/useGameSocket';

interface SessionData {
  placement: { id: string; name: string };
  venue: { id: string; name: string; locationName: string };
  session: { id: string; status: string; prizeType: string | null } | null;
}

export const JoinSession = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { 
    gameState, 
    joinSession, 
    submitAnswer,
    players, 
    currentQuestion, 
    selectedAnswer, 
    correctAnswer, 
    lastFeedback 
  } = useGameSocket();

  useEffect(() => {
    // Fetch session data based on the QR Token
    fetch(`http://localhost:3001/api/v1/guest/scan/${qrToken}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid QR Code');
        return res.json();
      })
      .then((data) => setSessionData(data))
      .catch((err) => setError(err.message));
  }, [qrToken]);

  const handleJoin = () => {
    if (!nickname.trim() || !sessionData?.session) return;
    joinSession(sessionData.session.id, sessionData.placement.id, nickname);
  };

  if (error) {
    return (
      <div className="glass-card page-enter">
        <h2 style={{ color: '#ff4d4d' }}>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!sessionData) {
    return <div className="page-enter">Loading table data...</div>;
  }

  // 1. JOINING STATE
  if (gameState === 'JOINING') {
    return (
      <div className="glass-card page-enter" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <h2 className="text-gradient">Welcome to {sessionData.venue.name}</h2>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>You are sitting at {sessionData.placement.name}.</p>
        
        {!sessionData.session ? (
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', textAlign: 'center' }}>
            <p className="text-secondary" style={{ margin: 0 }}>No active game right now. Ask your server when trivia night starts!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Enter your nickname..." 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={15}
            />
            <button 
              className="btn-primary" 
              onClick={handleJoin}
              disabled={!nickname.trim()}
            >
              Join the Game Room
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. WAITING STATE (LOBBY)
  if (gameState === 'WAITING') {
    return (
      <div className="glass-card page-enter" style={{ textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <h2 className="text-gradient pulse-animation">Waiting for host to start...</h2>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Get ready, trivia is launching soon!</p>
        
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            Lobby Players ({players.length}):
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {players.map((p, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  fontSize: '0.9rem' 
                }}
              >
                👤 {p.nickname}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. PLAYING STATE
  if (gameState === 'PLAYING') {
    const flashClass = lastFeedback === 'CORRECT' ? 'flash-green' : lastFeedback === 'INCORRECT' ? 'flash-red' : '';

    return (
      <div className={`glass-card page-enter ${flashClass}`} style={{ maxWidth: '600px', margin: '2rem auto' }}>
        {currentQuestion ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Question {currentQuestion.index + 1} of {currentQuestion.total}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                {selectedAnswer ? '✓ Answer locked in' : '⏱ Waiting for input...'}
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '1.4rem', lineHeight: '1.4' }}>{currentQuestion.text}</h2>

            {/* Options grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = correctAnswer === option;
                const isIncorrectReveal = correctAnswer && isSelected && !isCorrect;
                
                let btnStyle: React.CSSProperties = {
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.25rem',
                  fontSize: '1.05rem',
                  fontWeight: isSelected || isCorrect ? 600 : 'normal'
                };

                // Add conditional visual highlights when answers are revealed
                let className = 'btn-primary ';
                if (correctAnswer) {
                  if (isCorrect) {
                    className += 'flash-green';
                    btnStyle.background = 'rgba(9, 121, 105, 0.3)';
                    btnStyle.border = '2px solid var(--accent-primary)';
                  } else if (isIncorrectReveal) {
                    className += 'flash-red';
                    btnStyle.background = 'rgba(255, 77, 77, 0.2)';
                    btnStyle.border = '2px solid #ff4d4d';
                  } else {
                    btnStyle.background = 'var(--bg-surface-elevated)';
                    btnStyle.border = '1px solid var(--border-subtle)';
                    btnStyle.color = 'var(--text-muted)';
                    btnStyle.opacity = 0.5;
                  }
                } else if (isSelected) {
                  btnStyle.background = 'var(--accent-primary)';
                  btnStyle.border = '1px solid var(--accent-primary)';
                } else {
                  btnStyle.background = 'var(--bg-surface-elevated)';
                  btnStyle.border = '1px solid var(--border-subtle)';
                  btnStyle.color = 'var(--text-primary)';
                }

                return (
                  <button
                    key={i}
                    className={className}
                    style={btnStyle}
                    onClick={() => {
                      if (!selectedAnswer && !correctAnswer) {
                        submitAnswer(currentQuestion.questionId, option);
                      }
                    }}
                    disabled={!!selectedAnswer || !!correctAnswer}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Answer Reveal Text Banner */}
            {correctAnswer && (
              <div 
                style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  background: selectedAnswer === correctAnswer ? 'rgba(9, 121, 105, 0.15)' : 'rgba(255, 77, 77, 0.1)',
                  borderRadius: '12px',
                  border: `1px solid ${selectedAnswer === correctAnswer ? 'var(--accent-primary)' : '#ff4d4d'}`
                }}
              >
                <h3>
                  {selectedAnswer === correctAnswer ? '🎉 Correct!' : '❌ Incorrect'}
                </h3>
                <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  The correct answer was: <strong>{correctAnswer}</strong>
                </p>
              </div>
            )}

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 className="pulse-animation">Preparing next question...</h3>
          </div>
        )}
      </div>
    );
  }

  // 4. ENDED STATE
  return (
    <div className="glass-card page-enter" style={{ textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
      <h2 className="text-gradient">Thanks for playing!</h2>
      <p className="text-secondary" style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
        The session has concluded. Check the main screen for the final standings and prize claims.
      </p>
      <div style={{ padding: '1.25rem', background: 'rgba(9, 121, 105, 0.1)', border: '1px solid rgba(9, 121, 105, 0.3)', borderRadius: '16px' }}>
        <h4 style={{ margin: 0, color: 'var(--accent-primary)' }}>Prize Claims</h4>
        <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Show your score screen to your server/bartender to claim your reward!
        </p>
      </div>
    </div>
  );
};
