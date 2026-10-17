import { NextResponse } from "next/server";
import { testDatabaseConnection, isPostgresConfigured, sql } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: any = {
    driver: "in_memory_mock",
    connected: true,
  };

  if (isPostgresConfigured && sql) {
    const testResult = await testDatabaseConnection();
    dbStatus = {
      driver: "direct_postgresql",
      connected: testResult.connected,
      latencyMs: testResult.latencyMs,
      serverVersion: testResult.serverVersion,
      error: testResult.error,
    };
  } else if (isSupabaseConfigured) {
    dbStatus = {
      driver: "supabase_rest",
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
