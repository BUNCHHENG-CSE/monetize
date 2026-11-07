import { PrismaClient } from "@prisma/client";

/**
 * Production-Optimized Prisma Client Singleton
 * Supports:
 * - Neon Serverless PostgreSQL (Production)
 * - Standard PostgreSQL (Docker / Cloud SQL)
 * - SQLite (Local Development with zero external dependencies)
 */

const databaseUrl = process.env.DATABASE_URL || "";

export const isPrismaConfigured = Boolean(
  databaseUrl &&
  !databaseUrl.includes("placeholder") &&
  !databaseUrl.includes("example.com")
);

export const isPostgresDatabase = Boolean(
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")
);

export const isNeonDatabase = Boolean(
  isPostgresDatabase && (databaseUrl.includes("neon.tech") || databaseUrl.includes("pooler"))
);

export const isSqliteDatabase = Boolean(
  databaseUrl.startsWith("file:") || databaseUrl.includes(".db") || databaseUrl.includes("sqlite")
);

export const databaseProvider = isNeonDatabase
  ? "neon"
  : isPostgresDatabase
  ? "postgresql"
  : isSqliteDatabase
  ? "sqlite"
  : "in_memory";

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
