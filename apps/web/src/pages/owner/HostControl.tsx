import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

interface QuestionPack {
  id: string;
  name: string;
  questions: any[];
}

interface Player {
  guestId: string;
  nickname: string;
}

export const HostControl = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [responsesCount, setResponsesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const apiHost = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:3001' : window.location.host;

    // 1. Fetch Stored Packs
    fetch(`${apiHost}/api/v1/owner/packs`)
      .then((res) => res.json())
      .then((data) => {
        setPacks(data);
        if (data.length > 0) setSelectedPackId(data[0].id);
      })
      .catch(() => setError('Failed to load trivia packs'));

    // 2. Connect Host WebSocket
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/owner?sessionId=${sessionId}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Host WS message received:', data);

      if (data.type === 'PLAYER_JOINED') {
        const { guestId, nickname } = data.payload;
        setPlayers((prev) => {
          if (prev.some(p => p.guestId === guestId)) return prev;
          return [...prev, { guestId, nickname }];
        });
      }

      if (data.type === 'PLAYER_LEFT') {
        const { guestId } = data.payload;
        setPlayers((prev) => prev.filter(p => p.guestId !== guestId));
      }

      if (data.type === 'GAME_STARTED') {
        setGameStarted(true);
        setTotalQuestions(data.payload.totalQuestions);
      }

      if (data.type === 'NEXT_QUESTION') {
        setCurrentQuestion(data.payload);
        setQuestionIndex(data.payload.index);
        setIsAnswerRevealed(false);
        setCorrectAnswer('');
        setResponsesCount(0);
      }

      if (data.type === 'RESPONSE_SUBMITTED') {
        setResponsesCount((prev) => prev + 1);
      }

      if (data.type === 'ANSWER_REVEALED') {
        setIsAnswerRevealed(true);
        setCorrectAnswer(data.payload.correctOption);
      }

      if (data.type === 'GAME_ENDED') {
        setGameStarted(false);
        setCurrentQuestion(null);
        setQuestionIndex(-1);
      }

      if (data.type === 'ERROR') {
        setError(data.payload);
      }
    };

    ws.onopen = () => {
      setError(null);
    };
    ws.onerror = () => setError('WebSocket connection error');
    ws.onclose = () => setError('Host WebSocket disconnected');

    return () => {
      ws.onclose = null;
      ws.onerror = null;
      ws.close();
    };
  }, [sessionId]);

  const handleStartGame = () => {
    if (!selectedPackId || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type: 'START_GAME',
      payload: { questionPackId: selectedPackId }
    }));
  };

  const handleNextQuestion = () => {
    if (!socketRef.current) return;
    socketRef.current.send(JSON.stringify({ type: 'NEXT_QUESTION' }));
  };

  const handleRevealAnswer = () => {
    if (!socketRef.current) return;
    socketRef.current.send(JSON.stringify({ type: 'REVEAL_ANSWER' }));
  };

  const handleEndGame = () => {
    if (!socketRef.current) return;
    socketRef.current.send(JSON.stringify({ type: 'END_GAME' }));
    navigate('/owner/dashboard');
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient">Live Game Host Controls</h2>
          <p className="text-secondary">Session ID: <code style={{ color: 'var(--accent-primary)' }}>{sessionId}</code></p>
        </div>
        <button className="btn-primary" style={{ background: '#3a0000', color: '#ffb3b3' }} onClick={handleEndGame}>
          Exit Host Lobby
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Left Side: Game Controller Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!gameStarted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 className="text-gradient">Select Game Pack</h3>
              <p className="text-secondary">Choose which trivia pack you want to run tonight.</p>
              
              {packs.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 1rem 0' }}>No Custom Packs Available.</p>
                  <Link to="/owner/packs" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                    + Create Question Pack
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    className="input-premium"
                    value={selectedPackId}
                    onChange={(e) => setSelectedPackId(e.target.value)}
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    {packs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.questions.length} Qs)</option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleStartGame}>
                    Start Live Game Loop
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 className="text-secondary" style={{ margin: 0 }}>Active Trivia Game</h4>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                  Question {questionIndex + 1} of {totalQuestions}
                </p>
              </div>

              {currentQuestion && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{currentQuestion.text}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {currentQuestion.options.map((opt: string, i: number) => {
                      const isCorrect = isAnswerRevealed && opt === correctAnswer;
                      return (
                        <div 
                          key={i} 
                          style={{
                            background: isCorrect ? 'rgba(9, 121, 105, 0.2)' : 'var(--bg-surface-elevated)',
                            border: isCorrect ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.95rem',
                            fontWeight: isCorrect ? 'bold' : 'normal'
                          }}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(9, 121, 105, 0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <span className="text-secondary">Answers Submitted: </span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{responsesCount}</strong>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} onClick={handleRevealAnswer} disabled={isAnswerRevealed}>
                  Reveal Correct Answer
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleNextQuestion}>
                  {questionIndex + 1 === totalQuestions ? 'End Trivia' : 'Next Question'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Lobby Player list */}
        <div className="glass-card">
          <h3 className="text-gradient" style={{ marginBottom: '1.5rem' }}>Lobby Players ({players.length})</h3>
          {players.length === 0 ? (
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>
              Waiting for players to scan QRs and join the session...
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {players.map((p) => (
                <div 
                  key={p.guestId} 
                  className="pulse-animation" 
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  🟢 {p.nickname}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
