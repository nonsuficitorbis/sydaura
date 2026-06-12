import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// GET /api/v1/profile/:deviceHash
router.get('/:deviceHash', async (req: Request, res: Response): Promise<any> => {
  const { deviceHash } = req.params;

  try {
    const profile = await prisma.guestProfile.findUnique({
      where: { deviceHash },
      include: {
        visits: {
          include: {
            venue: true,
          },
          orderBy: {
            visitedAt: 'desc',
          },
        },
      },
    });

    if (!profile) {
      return res.status(200).json({
        deviceHash,
        nickname: null,
        streakCount: 0,
        badges: [],
        visits: [],
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching guest profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
