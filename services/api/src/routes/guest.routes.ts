import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';

const router = Router();

// GET /api/v1/guest/scan/:token
router.get('/scan/:token', async (req: Request, res: Response): Promise<any> => {
  const { token } = req.params;

  try {
    // Look up the QR Code
    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
      include: {
        placement: {
          include: {
            location: {
              include: {
                venue: true,
              }
            },
          },
        },
      },
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found or invalid' });
    }

    // Find the active session for this venue location
    const session = await prisma.session.findFirst({
      where: {
        venueLocationId: qrCode.placement.location.id,
        status: 'active',
      },
    });
    
    return res.status(200).json({
      placement: {
        id: qrCode.placement.id,
        name: qrCode.placement.name,
      },
      venue: {
        id: qrCode.placement.location.venue.id,
        name: qrCode.placement.location.venue.name,
        locationName: qrCode.placement.location.name,
      },
      session: session ? {
        id: session.id,
        status: session.status,
        prizeType: session.prizeType,
      } : null,
    });
  } catch (error) {
    console.error('Error scanning QR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
