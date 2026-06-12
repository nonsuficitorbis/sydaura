import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create a Dev Account (Owner)
  const owner = await prisma.account.create({
    data: {
      email: 'owner@sydaura.com',
      password: 'hashedpassword123', // Just a mock for now
    },
  });

  // 2. Create a Venue
  const venue = await prisma.venue.create({
    data: {
      name: 'The Sydaura Lounge',
      accountId: owner.id,
    },
  });

  // 3. Create a Location
  const location = await prisma.venueLocation.create({
    data: {
      name: 'Downtown Main Branch',
      venueId: venue.id,
    },
  });

  // 4. Create Placements & QR Codes
  const placements = ['Table 1', 'Table 2', 'Bar Seat A'];
  for (const pName of placements) {
    const placement = await prisma.placement.create({
      data: {
        name: pName,
        venueLocationId: location.id,
      },
    });

    // Create a QR Code for this placement
    await prisma.qrCode.create({
      data: {
        token: `qr-${placement.id.slice(0, 8)}`,
        placementId: placement.id,
      },
    });
  }

  // 5. Create a Question Pack & Questions
  const pack = await prisma.questionPack.create({
    data: {
      name: 'General Trivia Night',
      questions: {
        create: [
          {
            text: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctOption: 'Paris',
          },
          {
            text: 'Which planet is known as the Red Planet?',
            options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
            correctOption: 'Mars',
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
  console.log(`Created Owner: ${owner.email}`);
  console.log(`Created Venue: ${venue.name} (${location.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
