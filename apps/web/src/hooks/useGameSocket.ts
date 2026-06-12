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
  gameType: 'TIC_TAC_TOE' | 'CONNECT_4' | 'DOTS_AND_BOXES' | 'BATTLESHIP' | 'WORD_HUNT';
  opponentNickname: string;
  symbol: 'X' | 'O' | 'R' | 'Y' | string;
  myTurn: boolean;
  board: (string | null)[];
  isPlayer1: boolean;
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
  const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: string; challengerNickname: string; gameType: 'TIC_TAC_TOE' | 'CONNECT_4' | 'DOTS_AND_BOXES' | 'BATTLESHIP' | 'WORD_HUNT' } | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [battleshipState, setBattleshipState] = useState<{ placementDone: boolean; p1Placed: boolean; p2Placed: boolean }>({ placementDone: false, p1Placed: false, p2Placed: false });
  const [wordHuntState, setWordHuntState] = useState<{ p1Score: number; p2Score: number; p1Words: string[]; p2Words: string[] }>({ p1Score: 0, p2Score: 0, p1Words: [], p2Words: [] });

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
          setBattleshipState({ placementDone: false, p1Placed: false, p2Placed: false });
          setWordHuntState({ p1Score: 0, p2Score: 0, p1Words: [], p2Words: [] });
          setActiveGame({
            gameRoomId: data.payload.gameRoomId,
            gameType: data.payload.gameType,
            opponentNickname: data.payload.opponentNickname,
            symbol: data.payload.symbol,
            myTurn: data.payload.myTurn,
            board: data.payload.board,
            isPlayer1: data.payload.isPlayer1,
            gameOver: null,
          });
        } else if (data.type === 'GAME_UPDATE') {
          if (data.payload.placementDone !== undefined) {
            setBattleshipState({
              placementDone: data.payload.placementDone,
              p1Placed: data.payload.p1Placed,
              p2Placed: data.payload.p2Placed
            });
          }
          setActiveGame((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              board: data.payload.board,
              myTurn: data.payload.myTurn,
            };
          });
        } else if (data.type === 'WORD_HUNT_UPDATE') {
          setWordHuntState(data.payload);
        } else if (data.type === 'GAME_OVER') {
          if (data.payload.scores) {
            setWordHuntState({
              p1Score: data.payload.scores.p1Score,
              p2Score: data.payload.scores.p2Score,
              p1Words: wordHuntState.p1Words,
              p2Words: wordHuntState.p2Words
            });
          }
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

  const sendChallenge = (targetGuestId: string, gameType: 'TIC_TAC_TOE' | 'CONNECT_4' | 'DOTS_AND_BOXES' | 'BATTLESHIP' | 'WORD_HUNT') => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SEND_CHALLENGE',
        payload: { targetGuestId, gameType }
      }));
    }
  };

  const respondToChallenge = (challengerId: string, accepted: boolean, gameType?: 'TIC_TAC_TOE' | 'CONNECT_4' | 'DOTS_AND_BOXES' | 'BATTLESHIP' | 'WORD_HUNT') => {
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

  const makeDotsAndBoxesMove = (gameRoomId: string, lineIndex: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'DOTS_AND_BOXES_MOVE',
        payload: { gameRoomId, lineIndex }
      }));
    }
  };

  const placeBattleshipShips = (gameRoomId: string, shipCoordinates: number[]) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'BATTLESHIP_PLACE',
        payload: { gameRoomId, shipCoordinates }
      }));
    }
  };

  const strikeBattleshipCoordinate = (gameRoomId: string, coordinateIndex: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'BATTLESHIP_STRIKE',
        payload: { gameRoomId, coordinateIndex }
      }));
    }
  };

  const submitWordHuntWord = (gameRoomId: string, word: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'WORD_HUNT_SUBMIT_WORD',
        payload: { gameRoomId, word }
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
    battleshipState,
    wordHuntState,
    myGuestId,
    joinSession,
    joinCasual,
    submitAnswer,
    sendChallenge,
    respondToChallenge,
    makeTicTacToeMove,
    makeConnect4Move,
    makeDotsAndBoxesMove,
    placeBattleshipShips,
    strikeBattleshipCoordinate,
    submitWordHuntWord,
    closeGame,
  };
}
