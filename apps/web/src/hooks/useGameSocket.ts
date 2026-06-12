import { useEffect, useRef, useState } from 'react';

type GameState = 'JOINING' | 'WAITING' | 'PLAYING' | 'ENDED';

interface Question {
  questionId: string;
  text: string;
  options: string[];
  index: number;
  total: number;
}

interface ActiveGame {
  gameRoomId: string;
  gameType: 'TIC_TAC_TOE' | 'CONNECT_4';
  opponentNickname: string;
  symbol: 'X' | 'O' | 'R' | 'Y' | string;
  myTurn: boolean;
  board: (string | null)[];
  gameOver: {
    winnerId: string | null;
    winnerName: string | null;
    draw: boolean;
    disconnected?: boolean;
  } | null;
}

export function useGameSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>('JOINING');
  const [players, setPlayers] = useState<{ guestId: string; nickname: string }[]>([]);
  const [lobbyRoster, setLobbyRoster] = useState<{ guestId: string; nickname: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'CORRECT' | 'INCORRECT' | null>(null);
  
  const [myGuestId, setMyGuestId] = useState<string | null>(null);
  
  // 2-Player Game states
  const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: string; challengerNickname: string; gameType: 'TIC_TAC_TOE' | 'CONNECT_4' } | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);

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
          setMyGuestId(data.payload.guestId);
        } else if (data.type === 'PLAYER_JOINED') {
          setPlayers((prev) => {
            if (prev.some(p => p.guestId === data.payload.guestId)) return prev;
            return [...prev, data.payload];
          });
          setLobbyRoster((prev) => {
            if (prev.some(p => p.guestId === data.payload.guestId)) return prev;
            return [...prev, data.payload];
          });
        } else if (data.type === 'LOBBY_ROSTER') {
          setLobbyRoster(data.payload);
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
          setSelectedAnswer(data.payload.selectedAnswer);
          setLastFeedback(data.payload.isCorrect ? 'CORRECT' : 'INCORRECT');
        } else if (data.type === 'ANSWER_REVEALED') {
          setCorrectAnswer(data.payload.correctOption);
        } else if (data.type === 'GAME_ENDED') {
          setGameState('ENDED');
          setCurrentQuestion(null);
        }
        
        // --- 2-PLAYER EVENTS ---
        else if (data.type === 'CHALLENGE_RECEIVED') {
          setIncomingChallenge(data.payload);
        } else if (data.type === 'CHALLENGE_DECLINED') {
          alert(`${data.payload.opponentNickname} declined your challenge.`);
        } else if (data.type === 'GAME_START') {
          setIncomingChallenge(null);
          setActiveGame({
            gameRoomId: data.payload.gameRoomId,
            gameType: data.payload.gameType,
            opponentNickname: data.payload.opponentNickname,
            symbol: data.payload.symbol,
            myTurn: data.payload.myTurn,
            board: data.payload.board,
            gameOver: null,
          });
        } else if (data.type === 'GAME_UPDATE') {
          setActiveGame((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              board: data.payload.board,
              myTurn: data.payload.myTurn,
            };
          });
        } else if (data.type === 'GAME_OVER') {
          setActiveGame((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              board: data.payload.board,
              myTurn: false,
              gameOver: data.payload,
            };
          });
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
    if (selectedAnswer) return;
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SUBMIT_ANSWER',
        payload: { questionId, answer }
      }));
    }
  };

  // --- 2-Player Game Helpers ---

  const sendChallenge = (targetGuestId: string, gameType: 'TIC_TAC_TOE' | 'CONNECT_4') => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SEND_CHALLENGE',
        payload: { targetGuestId, gameType }
      }));
    }
  };

  const respondToChallenge = (challengerId: string, accepted: boolean, gameType?: 'TIC_TAC_TOE' | 'CONNECT_4') => {
    setIncomingChallenge(null);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'CHALLENGE_RESPONSE',
        payload: { challengerId, accepted, gameType }
      }));
    }
  };

  const makeTicTacToeMove = (gameRoomId: string, cellIndex: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'TIC_TAC_TOE_MOVE',
        payload: { gameRoomId, cellIndex }
      }));
    }
  };

  const makeConnect4Move = (gameRoomId: string, column: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'CONNECT_4_MOVE',
        payload: { gameRoomId, column }
      }));
    }
  };

  const closeGame = () => {
    setActiveGame(null);
  };

  const joinCasual = (locationId: string, nickname: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'JOIN_CASUAL',
        payload: { locationId, nickname }
      }));
    }
  };

  return {
    gameState,
    players,
    lobbyRoster,
    currentQuestion,
    selectedAnswer,
    correctAnswer,
    lastFeedback,
    incomingChallenge,
    activeGame,
    myGuestId,
    joinSession,
    joinCasual,
    submitAnswer,
    sendChallenge,
    respondToChallenge,
    makeTicTacToeMove,
    makeConnect4Move,
    closeGame,
  };
}
