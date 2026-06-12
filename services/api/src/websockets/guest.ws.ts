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

const sessions: Record<string, SessionState> = {};

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

export function handleGuestConnection(ws: WebSocket) {
  let currentSessionId: string | null = null;
  let currentGuestId: string | null = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'JOIN_SESSION') {
        const { sessionId, placementId, nickname } = data.payload;

        // Create the guest session in DB
        const guestSession = await prisma.guestSession.create({
          data: {
            sessionId,
            placementId,
            nickname: nickname || 'Anonymous',
          },
        });

        currentSessionId = sessionId;
        currentGuestId = guestSession.id;

        const sessionState = getOrCreateSession(sessionId);
        sessionState.guests.add(ws);

        // Send confirmation to guest
        ws.send(JSON.stringify({
          type: 'JOINED_SUCCESS',
          payload: { guestId: guestSession.id, nickname: guestSession.nickname }
        }));

        // Broadcast player joined to room (guests & owners)
        broadcastToRoom(sessionId, {
          type: 'PLAYER_JOINED',
          payload: { guestId: guestSession.id, nickname: guestSession.nickname }
        });

        // If a game is already active, send the current question to this late-joining guest
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

      if (data.type === 'SUBMIT_ANSWER') {
        const { questionId, answer } = data.payload;
        if (!currentGuestId || !currentSessionId) return;

        const sessionState = sessions[currentSessionId];
        if (!sessionState) return;

        // Fetch question to check answer
        const question = await prisma.question.findUnique({
          where: { id: questionId },
        });

        const isCorrect = question?.correctOption === answer;

        // Record response in DB
        await prisma.response.create({
          data: {
            answer,
            isCorrect,
            guestSessionId: currentGuestId,
            questionId,
          },
        });

        // Acknowledge answer submission
        ws.send(JSON.stringify({
          type: 'ANSWER_RECEIVED',
          payload: { isCorrect, selectedAnswer: answer }
        }));

        // Broadcast to owner that someone submitted an answer to update the metrics
        broadcastToOwners(currentSessionId, {
          type: 'RESPONSE_SUBMITTED',
          payload: { guestId: currentGuestId, isCorrect }
        });
      }

    } catch (err) {
      console.error('WS Guest Error:', err);
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    if (currentSessionId && sessions[currentSessionId]) {
      sessions[currentSessionId].guests.delete(ws);
      
      // Notify owner of disconnect
      broadcastToOwners(currentSessionId, {
        type: 'PLAYER_LEFT',
        payload: { guestId: currentGuestId }
      });
      
      cleanSessionIfEmpty(currentSessionId);
    }
  });
}

export function handleOwnerConnection(ws: WebSocket, reqUrl: string) {
  // Extract sessionId from query string /owner?sessionId=xxx
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

        // Load questions for the selected pack
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

        // Send first question
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
          // End of game
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
    // Send to guests
    for (const client of sessionState.guests) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    }
    // Send to owners
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
