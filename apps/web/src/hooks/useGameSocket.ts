import { useEffect, useRef, useState } from 'react';

type GameState = 'JOINING' | 'WAITING' | 'PLAYING' | 'ENDED';

interface Question {
  questionId: string;
  text: string;
  options: string[];
  index: number;
  total: number;
}

export function useGameSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>('JOINING');
  const [players, setPlayers] = useState<{ guestId: string; nickname: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'CORRECT' | 'INCORRECT' | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3001' : window.location.host;
    const wsUrl = `${protocol}//${host}/guest`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to Game Server');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Guest WS message received:', data);
        
        if (data.type === 'JOINED_SUCCESS') {
          setGameState('WAITING');
        } else if (data.type === 'PLAYER_JOINED') {
          setPlayers((prev) => {
            if (prev.some(p => p.guestId === data.payload.guestId)) return prev;
            return [...prev, data.payload];
          });
        } else if (data.type === 'GAME_STARTED') {
          setGameState('PLAYING');
          setSelectedAnswer(null);
          setCorrectAnswer(null);
          setLastFeedback(null);
        } else if (data.type === 'NEXT_QUESTION') {
          setGameState('PLAYING');
          setCurrentQuestion(data.payload);
          setSelectedAnswer(null);
          setCorrectAnswer(null);
          setLastFeedback(null);
        } else if (data.type === 'ANSWER_RECEIVED') {
          // Keep track of the client-side chosen option
          setSelectedAnswer(data.payload.selectedAnswer);
          setLastFeedback(data.payload.isCorrect ? 'CORRECT' : 'INCORRECT');
        } else if (data.type === 'ANSWER_REVEALED') {
          setCorrectAnswer(data.payload.correctOption);
        } else if (data.type === 'GAME_ENDED') {
          setGameState('ENDED');
          setCurrentQuestion(null);
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const joinSession = (sessionId: string, placementId: string, nickname: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'JOIN_SESSION',
        payload: { sessionId, placementId, nickname }
      }));
    }
  };

  const submitAnswer = (questionId: string, answer: string) => {
    if (selectedAnswer) return; // Answer already submitted for this question
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SUBMIT_ANSWER',
        payload: { questionId, answer }
      }));
    }
  };

  return {
    gameState,
    players,
    currentQuestion,
    selectedAnswer,
    correctAnswer,
    lastFeedback,
    joinSession,
    submitAnswer,
  };
}
