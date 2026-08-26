import 'dotenv/config';
import { PrismaClient } from '../generated/client/index.js';

// Prevent multiple instances of Prisma Client in development/serverless reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const database = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = database;
}

export * from '../generated/client/index.js';
export { PrismaClient };