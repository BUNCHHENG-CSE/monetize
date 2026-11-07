import { NextResponse } from "next/server";
import {
  prisma,
  isPrismaConfigured,
  databaseProvider,
  isNeonDatabase,
  isSqliteDatabase,
} from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: any = {
    orm: "in_memory_mock",
    provider: "memory",
    connected: true,
  };

  if (isPrismaConfigured && prisma) {
    const pStart = Date.now();
    try {
      let version = "Database";

      if (isSqliteDatabase) {
        const versionResult =
          await prisma.$queryRaw<[{ sqlite_version: string }]>`SELECT sqlite_version() as sqlite_version;`;
        version = `SQLite ${versionResult[0]?.sqlite_version || ""}`.trim();
      } else {
        const versionResult =
          await prisma.$queryRaw<[{ version: string }]>`SELECT version();`;
        version = versionResult[0]?.version?.split(",")[0] || "PostgreSQL";
      }

      const latencyMs = Date.now() - pStart;
      dbStatus = {
        orm: "prisma",
        provider: databaseProvider,
        isNeon: isNeonDatabase,
        connected: true,
        latencyMs,
        serverVersion: version,
      };
    } catch (err: any) {
      dbStatus = {
        orm: "prisma",
        provider: databaseProvider,
        isNeon: isNeonDatabase,
        connected: false,
        error: err.message,
      };
    }
  }

  const durationMs = Date.now() - startTime;
  const isHealthy = dbStatus.connected !== false;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latencyMs: durationMs,
      database: dbStatus,
      environment: process.env.NODE_ENV || "development",
      runtime: "bun",
      uptimeSec: Math.floor(process.uptime()),
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
