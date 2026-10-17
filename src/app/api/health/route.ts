import { NextResponse } from "next/server";
import { prisma, isPrismaConfigured } from "@/lib/prisma";
import { isPostgresConfigured, sql } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: any = {
    orm: "in_memory_mock",
    connected: true,
  };

  if (isPrismaConfigured && prisma) {
    const pStart = Date.now();
    try {
      const versionResult = await prisma.$queryRaw<[{ version: string }]>`SELECT version();`;
      const latencyMs = Date.now() - pStart;
      dbStatus = {
        orm: "prisma",
        connected: true,
        latencyMs,
        serverVersion: versionResult[0]?.version?.split(",")[0] || "PostgreSQL",
      };
    } catch (err: any) {
      dbStatus = {
        orm: "prisma",
        connected: false,
        error: err.message,
      };
    }
  } else if (isPostgresConfigured && sql) {
    dbStatus = {
      orm: "direct_postgres",
      connected: true,
    };
  } else if (isSupabaseConfigured) {
    dbStatus = {
      orm: "supabase_rest",
      connected: true,
    };
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
