import { prisma } from './config/database.js';

async function reset() {
  await prisma.submissionState.upsert({
    where: { id: 'global' },
    update: { currentRound: 0, isOpen: false, startedAt: null, endedAt: null },
    create: { id: 'global', currentRound: 0, isOpen: false, startedAt: null, endedAt: null }
  });
  console.log("Submission state reset successfully.");
  process.exit(0);
}

reset();
