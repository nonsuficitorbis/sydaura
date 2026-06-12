import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// POST /api/v1/owner/login
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    let account = await prisma.account.findUnique({
      where: { email },
      include: {
        venues: {
          include: {
            locations: true,
          },
        },
      },
    });

    if (!account) {
      // Create new account if it doesn't exist (magic-signup onboarding)
      account = await prisma.account.create({
        data: {
          email,
          password: password || 'default_password',
        },
        include: {
          venues: {
            include: {
              locations: true,
            },
          },
        },
      });
    } else if (password && account.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Return the account along with whether onboarding is needed
    const needsOnboarding = account.venues.length === 0;
    return res.status(200).json({
      accountId: account.id,
      email: account.email,
      needsOnboarding,
      venue: account.venues[0] || null,
      location: account.venues[0]?.locations[0] || null,
    });
  } catch (error) {
    console.error('Error in owner login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/owner/onboarding
router.post('/onboarding', async (req: Request, res: Response): Promise<any> => {
  const { accountId, venueName, locationName, placements } = req.body;

  try {
    // Check if account already has venue
    const existingVenues = await prisma.venue.findMany({
      where: { accountId },
    });

    if (existingVenues.length > 0) {
      return res.status(400).json({ error: 'Account already onboarded' });
    }

    // Create Venue, Location, and Placements in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          name: venueName,
          accountId,
        },
      });

      const location = await tx.venueLocation.create({
        data: {
          name: locationName,
          venueId: venue.id,
        },
      });

      const createdPlacements = [];
      if (placements && Array.isArray(placements)) {
        for (const pName of placements) {
          const placement = await tx.placement.create({
            data: {
              name: pName,
              venueLocationId: location.id,
            },
          });

          const qrCode = await tx.qrCode.create({
            data: {
              token: `qr-${placement.id.slice(0, 8)}`,
              placementId: placement.id,
            },
          });

          createdPlacements.push({
            ...placement,
            qrCode: {
              token: qrCode.token,
            },
          });
        }
      }

      return { venue, location, placements: createdPlacements };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error during onboarding:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/owner/placements
router.get('/placements', async (req: Request, res: Response): Promise<any> => {
  const { locationId } = req.query;

  if (!locationId || typeof locationId !== 'string') {
    return res.status(400).json({ error: 'locationId query parameter is required' });
  }

  try {
    const placements = await prisma.placement.findMany({
      where: { venueLocationId: locationId },
      include: {
        qrCodes: true,
      },
    });

    return res.status(200).json(placements);
  } catch (error) {
    console.error('Error fetching placements:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/owner/placements
router.post('/placements', async (req: Request, res: Response): Promise<any> => {
  const { locationId, name } = req.body;

  if (!locationId || !name) {
    return res.status(400).json({ error: 'locationId and name are required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const placement = await tx.placement.create({
        data: {
          name,
          venueLocationId: locationId,
        },
      });

      const qrCode = await tx.qrCode.create({
        data: {
          token: `qr-${placement.id.slice(0, 8)}`,
          placementId: placement.id,
        },
      });

      return {
        ...placement,
        qrCodes: [qrCode],
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error creating placement:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/owner/placements/:id
router.delete('/placements/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Delete QR codes first (relation constraint)
    await prisma.qrCode.deleteMany({
      where: { placementId: id },
    });

    await prisma.placement.delete({
      where: { id },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting placement:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/owner/sessions
router.get('/sessions', async (req: Request, res: Response): Promise<any> => {
  const { locationId } = req.query;

  if (!locationId || typeof locationId !== 'string') {
    return res.status(400).json({ error: 'locationId is required' });
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { venueLocationId: locationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/owner/sessions
router.post('/sessions', async (req: Request, res: Response): Promise<any> => {
  const { locationId, prizeType } = req.body;

  if (!locationId) {
    return res.status(400).json({ error: 'locationId is required' });
  }

  try {
    // Deactivate any active sessions first
    await prisma.session.updateMany({
      where: { venueLocationId: locationId, status: 'active' },
      data: { status: 'ended' },
    });

    // Create new active session
    const session = await prisma.session.create({
      data: {
        venueLocationId: locationId,
        prizeType: prizeType || 'Free Drink',
        status: 'active',
      },
    });

    return res.status(200).json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/owner/sessions/end
router.post('/sessions/end', async (req: Request, res: Response): Promise<any> => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ended' },
    });

    return res.status(200).json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/owner/dashboard
router.get('/dashboard', async (req: Request, res: Response): Promise<any> => {
  const { locationId } = req.query;

  if (!locationId || typeof locationId !== 'string') {
    return res.status(400).json({ error: 'locationId is required' });
  }

  try {
    // 1. Get current active session
    const activeSession = await prisma.session.findFirst({
      where: { venueLocationId: locationId, status: 'active' },
      include: {
        guestSessions: {
          include: {
            responses: true,
            placement: true,
          },
        },
      },
    });

    // 2. Fetch dashboard metrics for active session
    const totalScansEvent = await prisma.analyticsEvent.count({
      where: {
        eventName: 'qr_scanned',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
        },
      },
    });

    const activePlayersCount = activeSession ? activeSession.guestSessions.length : 0;
    
    // Calculate leaderboard for the active session
    const leaderboard = activeSession 
      ? activeSession.guestSessions.map((gs) => {
          const score = gs.responses.filter(r => r.isCorrect).length;
          return {
            id: gs.id,
            nickname: gs.nickname || 'Anonymous',
            tableName: gs.placement.name,
            score,
          };
        }).sort((a, b) => b.score - a.score).slice(0, 5)
      : [];

    return res.status(200).json({
      activeSession: activeSession ? {
        id: activeSession.id,
        prizeType: activeSession.prizeType,
        createdAt: activeSession.createdAt,
      } : null,
      metrics: {
        scansLast24h: totalScansEvent,
        activePlayers: activePlayersCount,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/owner/packs
router.get('/packs', async (req: Request, res: Response): Promise<any> => {
  try {
    const packs = await prisma.questionPack.findMany({
      include: { questions: true },
    });
    return res.status(200).json(packs);
  } catch (error) {
    console.error('Error fetching packs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/owner/packs
router.post('/packs', async (req: Request, res: Response): Promise<any> => {
  const { name, questions } = req.body;
  if (!name) return res.status(400).json({ error: 'Pack name is required' });

  try {
    const pack = await prisma.questionPack.create({
      data: {
        name,
        questions: {
          create: (questions || []).map((q: any) => ({
            text: q.text,
            options: q.options,
            correctOption: q.correctOption,
          })),
        },
      },
      include: { questions: true },
    });
    return res.status(200).json(pack);
  } catch (error) {
    console.error('Error creating pack:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/owner/packs/:id
router.delete('/packs/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    await prisma.question.deleteMany({ where: { questionPackId: id } });
    await prisma.questionPack.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting pack:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
