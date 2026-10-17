import { PrismaClient } from "@prisma/client";

/**
 * Production-Optimized Prisma Client Singleton
 *
 * Prevents multiple instances of PrismaClient in development caused by
 * Next.js hot module reloading (HMR), avoiding database connection pool exhaustion.
 */

const databaseUrl = process.env.DATABASE_URL || "";

export const isPrismaConfigured = Boolean(
  databaseUrl &&
  !databaseUrl.includes("placeholder") &&
  !databaseUrl.includes("example.com")
);

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = isPrismaConfigured
  ? globalThis.prismaGlobal ?? prismaClientSingleton()
  : (null as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production" && isPrismaConfigured) {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
