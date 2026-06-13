import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// GET /api/v1/tournament/active/:city
router.get('/active/:city', async (req: Request, res: Response): Promise<any> => {
  const { city } = req.params;

  try {
    const now = new Date();
    const tournaments = await prisma.tournament.findMany({
      where: {
        city: {
          equals: city,
          mode: 'insensitive',
        },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        venues: {
          include: {
            venue: true,
          },
        },
      },
    });

    return res.status(200).json(tournaments);
  } catch (error) {
    console.error('Error fetching active tournaments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/tournament/:id/leaderboard
router.get('/:id/leaderboard', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const sessions = await prisma.session.findMany({
      where: { tournamentId: id },
      include: {
        guestSessions: {
          include: {
            responses: true,
          },
        },
      },
    });

    const playerScores: Record<string, { nickname: string; score: number; totalAnswers: number }> = {};

    for (const session of sessions) {
      for (const gs of session.guestSessions) {
        if (!gs.deviceHash) continue;
        const correctCount = gs.responses.filter((r) => r.isCorrect).length;

        if (!playerScores[gs.deviceHash]) {
          playerScores[gs.deviceHash] = {
            nickname: gs.nickname || 'Anonymous',
            score: 0,
            totalAnswers: 0,
          };
        }
        const ps = playerScores[gs.deviceHash]!;
        ps.score += correctCount;
        ps.totalAnswers += gs.responses.length;
      }
    }

    const leaderboard = Object.keys(playerScores).map((deviceHash) => {
      const data = playerScores[deviceHash]!;
      return {
        deviceHash,
        nickname: data.nickname,
        score: data.score,
        totalAnswers: data.totalAnswers,
      };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({
      tournament,
      leaderboard,
    });
  } catch (error) {
    console.error('Error compiling tournament leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
