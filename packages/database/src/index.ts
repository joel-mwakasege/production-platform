import 'dotenv/config';
import { PrismaClient } from '../generated/client/index.js';

const datasourceUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

// Prevent multiple instances of Prisma Client in development/serverless reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const database =
  globalForPrisma.prisma ??
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: {
              url: datasourceUrl,
            },
          },
        }
      : undefined,
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = database;
}

export * from '../generated/client/index.js';
export { PrismaClient };