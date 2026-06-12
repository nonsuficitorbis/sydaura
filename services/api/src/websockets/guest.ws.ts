import { WebSocket } from 'ws';
import prisma from '../db/prisma';

interface SessionState {
  sessionId: string;
  questions: any[];
  currentQuestionIndex: number;
  isAnswerRevealed: boolean;
  guests: Set<WebSocket>;
  owners: Set<WebSocket>;
}

interface CasualGame {
  gameRoomId: string;
  gameType: 'TIC_TAC_TOE' | 'CONNECT_4' | 'DOTS_AND_BOXES' | 'BATTLESHIP' | 'WORD_HUNT';
  player1: { guestId: string; ws: WebSocket; nickname: string; symbol: string };
  player2: { guestId: string; ws: WebSocket; nickname: string; symbol: string };
  board: (string | null)[];
  currentTurn: string; // guestId
  p1ShipsPlaced?: boolean;
  p2ShipsPlaced?: boolean;
  p1Ships?: number[];
  p2Ships?: number[];
  p1Strikes?: number[];
  p2Strikes?: number[];
  p1Score?: number;
  p2Score?: number;
  p1Words?: string[];
  p2Words?: string[];
}

const sessions: Record<string, SessionState> = {};
const guestSockets: Record<string, { ws: WebSocket; nickname: string; sessionId: string }> = {};
const activeGames: Record<string, CasualGame> = {};

function getOrCreateSession(sessionId: string): SessionState {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      sessionId,
      questions: [],
      currentQuestionIndex: -1,
      isAnswerRevealed: false,
      guests: new Set(),
      owners: new Set(),
    };
  }
  return sessions[sessionId];
}

// Tic-Tac-Toe Win Checker
const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board: (string | null)[]): string | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Connect 4 Win Checker
function checkConnect4Winner(board: (string | null)[]): string | null {
  const ROWS = 6;
  const COLS = 7;

  // 1. Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const val = board[r * COLS + c];
      if (val &&
          val === board[r * COLS + c + 1] &&
          val === board[r * COLS + c + 2] &&
          val === board[r * COLS + c + 3]) {
        return val;
      }
    }
  }

  // 2. Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      const val = board[r * COLS + c];
      if (val &&
          val === board[(r + 1) * COLS + c] &&
          val === board[(r + 2) * COLS + c] &&
          val === board[(r + 3) * COLS + c]) {
        return val;
      }
    }
  }

  // 3. Diagonal Down-Right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const val = board[r * COLS + c];
      if (val &&
          val === board[(r + 1) * COLS + c + 1] &&
          val === board[(r + 2) * COLS + c + 2] &&
          val === board[(r + 3) * COLS + c + 3]) {
        return val;
      }
    }
  }

  // 4. Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const val = board[r * COLS + c];
      if (val &&
          val === board[(r - 1) * COLS + c + 1] &&
          val === board[(r - 2) * COLS + c + 2] &&
          val === board[(r - 3) * COLS + c + 3]) {
        return val;
      }
    }
  }

  return null;
}

export function handleGuestConnection(ws: WebSocket) {
  let currentSessionId: string | null = null;
  let currentGuestId: string | null = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'JOIN_SESSION') {
        const { sessionId, placementId, nickname } = data.payload;

        const guestSession = await prisma.guestSession.create({
          data: {
            sessionId,
            placementId,
            nickname: nickname || 'Anonymous',
          },
        });

        currentSessionId = sessionId;
        currentGuestId = guestSession.id;

        guestSockets[guestSession.id] = {
          ws,
          nickname: guestSession.nickname || 'Anonymous',
          sessionId,
        };

        const sessionState = getOrCreateSession(sessionId);
        sessionState.guests.add(ws);

        ws.send(JSON.stringify({
          type: 'JOINED_SUCCESS',
          payload: { guestId: guestSession.id, nickname: guestSession.nickname }
        }));

        broadcastToRoom(sessionId, {
          type: 'PLAYER_JOINED',
          payload: { guestId: guestSession.id, nickname: guestSession.nickname }
        });

        const activePlayersInLobby = Object.keys(guestSockets)
          .filter(gid => guestSockets[gid].sessionId === sessionId)
          .map(gid => ({ guestId: gid, nickname: guestSockets[gid].nickname }));

        ws.send(JSON.stringify({
          type: 'LOBBY_ROSTER',
          payload: activePlayersInLobby
        }));

        if (sessionState.questions.length > 0 && sessionState.currentQuestionIndex >= 0) {
          const currentQuestion = sessionState.questions[sessionState.currentQuestionIndex];
          ws.send(JSON.stringify({
            type: 'NEXT_QUESTION',
            payload: {
              questionId: currentQuestion.id,
              text: currentQuestion.text,
              options: currentQuestion.options,
              index: sessionState.currentQuestionIndex,
              total: sessionState.questions.length,
            }
          }));
        }
      }

      if (data.type === 'JOIN_CASUAL') {
        const { locationId, nickname } = data.payload;
        const casualRoomId = `casual-${locationId}`;

        const guestId = `guest-${Math.random().toString(36).substring(2, 11)}`;
        currentGuestId = guestId;
        currentSessionId = casualRoomId;

        guestSockets[guestId] = {
          ws,
          nickname: nickname || 'Anonymous',
          sessionId: casualRoomId,
        };

        const sessionState = getOrCreateSession(casualRoomId);
        sessionState.guests.add(ws);

        ws.send(JSON.stringify({
          type: 'JOINED_SUCCESS',
          payload: { guestId, nickname }
        }));

        broadcastToRoom(casualRoomId, {
          type: 'PLAYER_JOINED',
          payload: { guestId, nickname }
        });

        const activePlayersInLobby = Object.keys(guestSockets)
          .filter(gid => guestSockets[gid].sessionId === casualRoomId)
          .map(gid => ({ guestId: gid, nickname: guestSockets[gid].nickname }));

        ws.send(JSON.stringify({
          type: 'LOBBY_ROSTER',
          payload: activePlayersInLobby
        }));
      }

      if (data.type === 'SUBMIT_ANSWER') {
        const { questionId, answer } = data.payload;
        if (!currentGuestId || !currentSessionId) return;

        const question = await prisma.question.findUnique({
          where: { id: questionId },
        });

        const isCorrect = question?.correctOption === answer;

        await prisma.response.create({
          data: {
            answer,
            isCorrect,
            guestSessionId: currentGuestId,
            questionId,
          },
        });

        ws.send(JSON.stringify({
          type: 'ANSWER_RECEIVED',
          payload: { isCorrect, selectedAnswer: answer }
        }));

        broadcastToOwners(currentSessionId, {
          type: 'RESPONSE_SUBMITTED',
          payload: { guestId: currentGuestId, isCorrect }
        });
      }

      // --- 2-PLAYER MATCHMAKING & GAMEPLAY ---

      if (data.type === 'SEND_CHALLENGE') {
        const { targetGuestId, gameType } = data.payload;
        console.log(`[WS Challenge] ${currentGuestId} sending challenge (${gameType}) to ${targetGuestId}`);
        if (!currentGuestId || !guestSockets[targetGuestId]) return;

        const challenger = guestSockets[currentGuestId];
        const target = guestSockets[targetGuestId];

        target.ws.send(JSON.stringify({
          type: 'CHALLENGE_RECEIVED',
          payload: {
            challengerId: currentGuestId,
            challengerNickname: challenger.nickname,
            gameType: gameType || 'TIC_TAC_TOE'
          }
        }));
      }

      if (data.type === 'CHALLENGE_RESPONSE') {
        const { challengerId, accepted, gameType } = data.payload;
        console.log(`[WS Challenge] ${currentGuestId} responded to ${challengerId} with accepted=${accepted}`);
        if (!currentGuestId || !guestSockets[challengerId]) return;

        const challenger = guestSockets[challengerId];
        const responder = guestSockets[currentGuestId];

        if (accepted) {
          const gameRoomId = `game-${challengerId}-${currentGuestId}`;
          const gType = gameType || 'TIC_TAC_TOE';
          
          let p1Symbol = 'X';
          let p2Symbol = 'O';
          let boardSize = 9;

          if (gType === 'CONNECT_4') {
            p1Symbol = 'R';
            p2Symbol = 'Y';
            boardSize = 42;
          } else if (gType === 'DOTS_AND_BOXES') {
            p1Symbol = 'R';
            p2Symbol = 'Y';
            boardSize = 56;
          } else if (gType === 'BATTLESHIP') {
            p1Symbol = 'B';
            p2Symbol = 'B';
            boardSize = 72;
          } else if (gType === 'WORD_HUNT') {
            p1Symbol = 'W';
            p2Symbol = 'W';
            boardSize = 16;
          }

          const boardArray = Array(boardSize).fill(null);
          if (gType === 'WORD_HUNT') {
            const vowels = 'AEIOU';
            const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
            for (let i = 0; i < 16; i++) {
              const letters = (i % 3 === 0) ? vowels : consonants;
              boardArray[i] = letters[Math.floor(Math.random() * letters.length)];
            }
          }

          activeGames[gameRoomId] = {
            gameRoomId,
            gameType: gType,
            player1: { guestId: challengerId, ws: challenger.ws, nickname: challenger.nickname, symbol: p1Symbol },
            player2: { guestId: currentGuestId, ws: responder.ws, nickname: responder.nickname, symbol: p2Symbol },
            board: boardArray,
            currentTurn: challengerId,
            p1Score: gType === 'WORD_HUNT' ? 0 : undefined,
            p2Score: gType === 'WORD_HUNT' ? 0 : undefined,
            p1Words: gType === 'WORD_HUNT' ? [] : undefined,
            p2Words: gType === 'WORD_HUNT' ? [] : undefined,
          };

          if (gType === 'WORD_HUNT') {
            setTimeout(() => {
              if (activeGames[gameRoomId]) {
                const g = activeGames[gameRoomId];
                const p1 = g.p1Score || 0;
                const p2 = g.p2Score || 0;
                let winnerId: string | null = null;
                let winnerName: string | null = null;
                let draw = false;

                if (p1 > p2) {
                  winnerId = g.player1.guestId;
                  winnerName = g.player1.nickname;
                } else if (p2 > p1) {
                  winnerId = g.player2.guestId;
                  winnerName = g.player2.nickname;
                } else {
                  draw = true;
                }

                const gameOverMsg = {
                  type: 'GAME_OVER',
                  payload: {
                    board: g.board,
                    winnerId,
                    winnerName,
                    draw,
                    scores: { p1Score: p1, p2Score: p2 }
                  }
                };

                g.player1.ws.send(JSON.stringify(gameOverMsg));
                g.player2.ws.send(JSON.stringify(gameOverMsg));
                delete activeGames[gameRoomId];
              }
            }, 60000);
          }

          challenger.ws.send(JSON.stringify({
            type: 'GAME_START',
            payload: {
              gameRoomId,
              gameType: gType,
              opponentNickname: responder.nickname,
              symbol: p1Symbol,
              myTurn: true,
              isPlayer1: true,
              board: activeGames[gameRoomId].board
            }
          }));

          responder.ws.send(JSON.stringify({
            type: 'GAME_START',
            payload: {
              gameRoomId,
              gameType: gType,
              opponentNickname: challenger.nickname,
              symbol: p2Symbol,
              myTurn: false,
              isPlayer1: false,
              board: activeGames[gameRoomId].board
            }
          }));
          console.log(`[WS Challenge] ${gType} game started room=${gameRoomId}`);
        } else {
          challenger.ws.send(JSON.stringify({
            type: 'CHALLENGE_DECLINED',
            payload: { opponentNickname: responder.nickname }
          }));
        }
      }

      if (data.type === 'TIC_TAC_TOE_MOVE') {
        const { gameRoomId, cellIndex } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        if (game.currentTurn !== currentGuestId) return;
        if (game.board[cellIndex] !== null) return;

        const isPlayer1 = game.player1.guestId === currentGuestId;
        const playerSymbol = isPlayer1 ? 'X' : 'O';
        const opponentId = isPlayer1 ? game.player2.guestId : game.player1.guestId;

        game.board[cellIndex] = playerSymbol;

        const winnerSymbol = checkWinner(game.board);
        const isDraw = !winnerSymbol && game.board.every(cell => cell !== null);

        if (winnerSymbol) {
          const winnerName = isPlayer1 ? game.player1.nickname : game.player2.nickname;
          const winnerId = isPlayer1 ? game.player1.guestId : game.player2.guestId;

          const gameOverMsg = {
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId,
              winnerName,
              draw: false
            }
          };

          game.player1.ws.send(JSON.stringify(gameOverMsg));
          game.player2.ws.send(JSON.stringify(gameOverMsg));
          delete activeGames[gameRoomId];
        } else if (isDraw) {
          const gameOverMsg = {
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId: null,
              winnerName: null,
              draw: true
            }
          };

          game.player1.ws.send(JSON.stringify(gameOverMsg));
          game.player2.ws.send(JSON.stringify(gameOverMsg));
          delete activeGames[gameRoomId];
        } else {
          game.currentTurn = opponentId;

          const updateMsg = (targetId: string) => ({
            type: 'GAME_UPDATE',
            payload: {
              board: game.board,
              myTurn: game.currentTurn === targetId
            }
          });

          game.player1.ws.send(JSON.stringify(updateMsg(game.player1.guestId)));
          game.player2.ws.send(JSON.stringify(updateMsg(game.player2.guestId)));
        }
      }

      if (data.type === 'CONNECT_4_MOVE') {
        const { gameRoomId, column } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        if (game.currentTurn !== currentGuestId) return;

        const COLS = 7;
        const ROWS = 6;
        let targetRow = -1;

        // Gravity drop check: find lowest empty row in column
        for (let r = ROWS - 1; r >= 0; r--) {
          if (game.board[r * COLS + column] === null) {
            targetRow = r;
            break;
          }
        }

        if (targetRow === -1) return; // Column is full

        const targetIndex = targetRow * COLS + column;
        const isPlayer1 = game.player1.guestId === currentGuestId;
        const playerSymbol = isPlayer1 ? 'R' : 'Y'; // Red vs Yellow
        const opponentId = isPlayer1 ? game.player2.guestId : game.player1.guestId;

        game.board[targetIndex] = playerSymbol;

        const winnerSymbol = checkConnect4Winner(game.board);
        const isDraw = !winnerSymbol && game.board.every(cell => cell !== null);

        if (winnerSymbol) {
          const winnerName = isPlayer1 ? game.player1.nickname : game.player2.nickname;
          const winnerId = isPlayer1 ? game.player1.guestId : game.player2.guestId;

          const gameOverMsg = {
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId,
              winnerName,
              draw: false
            }
          };

          game.player1.ws.send(JSON.stringify(gameOverMsg));
          game.player2.ws.send(JSON.stringify(gameOverMsg));
          delete activeGames[gameRoomId];
        } else if (isDraw) {
          const gameOverMsg = {
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId: null,
              winnerName: null,
              draw: true
            }
          };

          game.player1.ws.send(JSON.stringify(gameOverMsg));
          game.player2.ws.send(JSON.stringify(gameOverMsg));
          delete activeGames[gameRoomId];
        } else {
          game.currentTurn = opponentId;

          const updateMsg = (targetId: string) => ({
            type: 'GAME_UPDATE',
            payload: {
              board: game.board,
              myTurn: game.currentTurn === targetId
            }
          });

          game.player1.ws.send(JSON.stringify(updateMsg(game.player1.guestId)));
          game.player2.ws.send(JSON.stringify(updateMsg(game.player2.guestId)));
        }
      }

      if (data.type === 'DOTS_AND_BOXES_MOVE') {
        const { gameRoomId, lineIndex } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        if (game.currentTurn !== currentGuestId) return;
        if (lineIndex < 0 || lineIndex >= 40 || game.board[lineIndex] !== null) return;

        const isPlayer1 = game.player1.guestId === currentGuestId;
        const playerSymbol = isPlayer1 ? 'R' : 'Y';
        const opponentId = isPlayer1 ? game.player2.guestId : game.player1.guestId;

        // Place line
        game.board[lineIndex] = playerSymbol;

        // Check completed boxes
        let boxCompletedThisTurn = false;

        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const boxIndex = 40 + (r * 4 + c);
            if (game.board[boxIndex] !== null) continue;

            const top = r * 4 + c;
            const bottom = (r + 1) * 4 + c;
            const left = 20 + (r * 5 + c);
            const right = 20 + (r * 5 + c + 1);

            if (
              game.board[top] !== null &&
              game.board[bottom] !== null &&
              game.board[left] !== null &&
              game.board[right] !== null
            ) {
              game.board[boxIndex] = playerSymbol;
              boxCompletedThisTurn = true;
            }
          }
        }

        let allBoxesClaimed = true;
        let rCount = 0;
        let yCount = 0;

        for (let i = 40; i < 56; i++) {
          if (game.board[i] === null) {
            allBoxesClaimed = false;
          } else if (game.board[i] === 'R') {
            rCount++;
          } else if (game.board[i] === 'Y') {
            yCount++;
          }
        }

        if (allBoxesClaimed) {
          let winnerId: string | null = null;
          let winnerName: string | null = null;
          let draw = false;

          if (rCount > yCount) {
            winnerId = game.player1.guestId;
            winnerName = game.player1.nickname;
          } else if (yCount > rCount) {
            winnerId = game.player2.guestId;
            winnerName = game.player2.nickname;
          } else {
            draw = true;
          }

          const gameOverMsg = {
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId,
              winnerName,
              draw
            }
          };

          game.player1.ws.send(JSON.stringify(gameOverMsg));
          game.player2.ws.send(JSON.stringify(gameOverMsg));
          delete activeGames[gameRoomId];
        } else {
          if (!boxCompletedThisTurn) {
            game.currentTurn = opponentId;
          }

          const updateMsg = (targetId: string) => ({
            type: 'GAME_UPDATE',
            payload: {
              board: game.board,
              myTurn: game.currentTurn === targetId
            }
          });

          game.player1.ws.send(JSON.stringify(updateMsg(game.player1.guestId)));
          game.player2.ws.send(JSON.stringify(updateMsg(game.player2.guestId)));
        }
      }

      if (data.type === 'BATTLESHIP_PLACE') {
        const { gameRoomId, shipCoordinates } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        const isPlayer1 = game.player1.guestId === currentGuestId;

        if (isPlayer1) {
          game.p1Ships = shipCoordinates;
          game.p1ShipsPlaced = true;
        } else {
          game.p2Ships = shipCoordinates;
          game.p2ShipsPlaced = true;
        }

        const placementDone = !!(game.p1ShipsPlaced && game.p2ShipsPlaced);

        const updateMsg = (targetId: string) => ({
          type: 'GAME_UPDATE',
          payload: {
            board: game.board,
            myTurn: game.currentTurn === targetId,
            placementDone,
            p1Placed: game.p1ShipsPlaced,
            p2Placed: game.p2ShipsPlaced
          }
        });

        game.player1.ws.send(JSON.stringify(updateMsg(game.player1.guestId)));
        game.player2.ws.send(JSON.stringify(updateMsg(game.player2.guestId)));
      }

      if (data.type === 'BATTLESHIP_STRIKE') {
        const { gameRoomId, coordinateIndex } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        if (game.currentTurn !== currentGuestId) return;
        if (!game.p1ShipsPlaced || !game.p2ShipsPlaced) return; // Wait for placement

        const isPlayer1 = game.player1.guestId === currentGuestId;
        const opponentId = isPlayer1 ? game.player2.guestId : game.player1.guestId;

        if (isPlayer1) {
          // Striking Player 2's board (mapped at indices 36 to 71)
          const targetIndex = 36 + coordinateIndex;
          if (game.board[targetIndex] !== null) return; // Already struck

          const isHit = game.p2Ships?.includes(coordinateIndex);
          game.board[targetIndex] = isHit ? 'H' : 'M';

          // Check Win Condition
          const isWin = game.p2Ships?.every(cell => game.board[36 + cell] === 'H');
          if (isWin) {
            const gameOverMsg = {
              type: 'GAME_OVER',
              payload: {
                board: game.board,
                winnerId: game.player1.guestId,
                winnerName: game.player1.nickname,
                draw: false
              }
            };
            game.player1.ws.send(JSON.stringify(gameOverMsg));
            game.player2.ws.send(JSON.stringify(gameOverMsg));
            delete activeGames[gameRoomId];
            return;
          }
        } else {
          // Striking Player 1's board (mapped at indices 0 to 35)
          const targetIndex = coordinateIndex;
          if (game.board[targetIndex] !== null) return; // Already struck

          const isHit = game.p1Ships?.includes(coordinateIndex);
          game.board[targetIndex] = isHit ? 'H' : 'M';

          // Check Win Condition
          const isWin = game.p1Ships?.every(cell => game.board[cell] === 'H');
          if (isWin) {
            const gameOverMsg = {
              type: 'GAME_OVER',
              payload: {
                board: game.board,
                winnerId: game.player2.guestId,
                winnerName: game.player2.nickname,
                draw: false
              }
            };
            game.player1.ws.send(JSON.stringify(gameOverMsg));
            game.player2.ws.send(JSON.stringify(gameOverMsg));
            delete activeGames[gameRoomId];
            return;
          }
        }

        // Alternate Turn
        game.currentTurn = opponentId;

        const updateMsg = (targetId: string) => ({
          type: 'GAME_UPDATE',
          payload: {
            board: game.board,
            myTurn: game.currentTurn === targetId,
            placementDone: true
          }
        });

        game.player1.ws.send(JSON.stringify(updateMsg(game.player1.guestId)));
        game.player2.ws.send(JSON.stringify(updateMsg(game.player2.guestId)));
      }

      if (data.type === 'WORD_HUNT_SUBMIT_WORD') {
        const { gameRoomId, word } = data.payload;
        if (!currentGuestId || !activeGames[gameRoomId]) return;

        const game = activeGames[gameRoomId];
        const isPlayer1 = game.player1.guestId === currentGuestId;
        const cleanWord = word.trim().toUpperCase();

        if (cleanWord.length < 3) return;

        const wordList = isPlayer1 ? game.p1Words : game.p2Words;
        if (!wordList || wordList.includes(cleanWord)) return;

        const boardPool = [...game.board];
        let isValid = true;
        for (const char of cleanWord) {
          const charIndex = boardPool.indexOf(char);
          if (charIndex === -1) {
            isValid = false;
            break;
          }
          boardPool[charIndex] = null;
        }

        if (!isValid) return;

        let points = 100;
        if (cleanWord.length === 4) points = 400;
        else if (cleanWord.length === 5) points = 800;
        else if (cleanWord.length >= 6) points = 1400;

        if (isPlayer1) {
          game.p1Score = (game.p1Score || 0) + points;
          game.p1Words?.push(cleanWord);
        } else {
          game.p2Score = (game.p2Score || 0) + points;
          game.p2Words?.push(cleanWord);
        }

        const scoreUpdate = {
          type: 'WORD_HUNT_UPDATE',
          payload: {
            p1Score: game.p1Score,
            p2Score: game.p2Score,
            p1Words: game.p1Words,
            p2Words: game.p2Words
          }
        };

        game.player1.ws.send(JSON.stringify(scoreUpdate));
        game.player2.ws.send(JSON.stringify(scoreUpdate));
      }

    } catch (err) {
      console.error('WS Guest Error:', err);
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    if (currentGuestId) {
      delete guestSockets[currentGuestId];

      for (const roomId in activeGames) {
        const game = activeGames[roomId];
        if (game.player1.guestId === currentGuestId || game.player2.guestId === currentGuestId) {
          const opponentWs = game.player1.guestId === currentGuestId ? game.player2.ws : game.player1.ws;
          opponentWs.send(JSON.stringify({
            type: 'GAME_OVER',
            payload: {
              board: game.board,
              winnerId: null,
              winnerName: null,
              draw: false,
              disconnected: true
            }
          }));
          delete activeGames[roomId];
        }
      }
    }

    if (currentSessionId && sessions[currentSessionId]) {
      sessions[currentSessionId].guests.delete(ws);
      
      broadcastToOwners(currentSessionId, {
        type: 'PLAYER_LEFT',
        payload: { guestId: currentGuestId }
      });
      
      cleanSessionIfEmpty(currentSessionId);
    }
  });
}

export function handleOwnerConnection(ws: WebSocket, reqUrl: string) {
  const urlObj = new URL(reqUrl, 'http://localhost');
  const sessionId = urlObj.searchParams.get('sessionId');

  if (!sessionId) {
    console.error('Owner connection missing sessionId');
    ws.close();
    return;
  }

  const sessionState = getOrCreateSession(sessionId);
  sessionState.owners.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'START_GAME') {
        const { questionPackId } = data.payload;

        const questions = await prisma.question.findMany({
          where: { questionPackId },
        });

        if (questions.length === 0) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: 'Selected pack has no questions' }));
          return;
        }

        sessionState.questions = questions;
        sessionState.currentQuestionIndex = 0;
        sessionState.isAnswerRevealed = false;

        broadcastToRoom(sessionId, {
          type: 'GAME_STARTED',
          payload: { totalQuestions: questions.length }
        });

        const firstQuestion = questions[0];
        broadcastToRoom(sessionId, {
          type: 'NEXT_QUESTION',
          payload: {
            questionId: firstQuestion.id,
            text: firstQuestion.text,
            options: firstQuestion.options,
            index: 0,
            total: questions.length,
          }
        });
      }

      if (data.type === 'NEXT_QUESTION') {
        if (sessionState.questions.length === 0) return;

        const nextIndex = sessionState.currentQuestionIndex + 1;
        if (nextIndex >= sessionState.questions.length) {
          broadcastToRoom(sessionId, { type: 'GAME_ENDED' });
          sessionState.questions = [];
          sessionState.currentQuestionIndex = -1;
        } else {
          sessionState.currentQuestionIndex = nextIndex;
          sessionState.isAnswerRevealed = false;

          const question = sessionState.questions[nextIndex];
          broadcastToRoom(sessionId, {
            type: 'NEXT_QUESTION',
            payload: {
              questionId: question.id,
              text: question.text,
              options: question.options,
              index: nextIndex,
              total: sessionState.questions.length,
            }
          });
        }
      }

      if (data.type === 'REVEAL_ANSWER') {
        if (sessionState.questions.length === 0 || sessionState.currentQuestionIndex < 0) return;

        const currentQuestion = sessionState.questions[sessionState.currentQuestionIndex];
        sessionState.isAnswerRevealed = true;

        broadcastToRoom(sessionId, {
          type: 'ANSWER_REVEALED',
          payload: {
            questionId: currentQuestion.id,
            correctOption: currentQuestion.correctOption,
          }
        });
      }

      if (data.type === 'END_GAME') {
        broadcastToRoom(sessionId, { type: 'GAME_ENDED' });
        sessionState.questions = [];
        sessionState.currentQuestionIndex = -1;
      }

    } catch (err) {
      console.error('WS Owner Error:', err);
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Invalid owner action' }));
    }
  });

  ws.on('close', () => {
    if (sessions[sessionId]) {
      sessions[sessionId].owners.delete(ws);
      cleanSessionIfEmpty(sessionId);
    }
  });
}

function broadcastToRoom(sessionId: string, message: any) {
  const sessionState = sessions[sessionId];
  if (sessionState) {
    const msgString = JSON.stringify(message);
    for (const client of sessionState.guests) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    }
    for (const client of sessionState.owners) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    }
  }
}

function broadcastToOwners(sessionId: string, message: any) {
  const sessionState = sessions[sessionId];
  if (sessionState) {
    const msgString = JSON.stringify(message);
    for (const client of sessionState.owners) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    }
  }
}

function cleanSessionIfEmpty(sessionId: string) {
  const state = sessions[sessionId];
  if (state && state.guests.size === 0 && state.owners.size === 0) {
    delete sessions[sessionId];
  }
}
