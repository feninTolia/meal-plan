import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations
  // to prevent multiple Prisma Client instances in dev
  // See https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }
  prisma = global.prisma;
}

export { prisma };
