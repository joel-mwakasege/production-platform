import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  const datasourceUrl =
    process.env.DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL;

  const client = new PrismaClient(
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
    globalForPrisma.prisma = client;
  } else {
    prismaInstance = client;
  }

  return client;
}

export const database = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export * from '@prisma/client';
export { PrismaClient };
