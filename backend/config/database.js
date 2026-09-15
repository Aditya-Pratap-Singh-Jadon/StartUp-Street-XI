import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Database connection skipped.');
    return;
  }
  try {
    await prisma.$connect();
    console.log('Successfully connected to MongoDB through Prisma.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}
