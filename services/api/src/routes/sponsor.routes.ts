import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// GET /api/v1/sponsor/active
router.get('/active', async (req: Request, res: Response): Promise<any> => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { active: true },
      take: 3, // Return a few active campaigns
    });
    return res.status(200).json(sponsors);
  } catch (error) {
    console.error('Error fetching active sponsors:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
