import postgres from "postgres";

/**
 * Production-Optimized PostgreSQL Connection Pool
 * Supports:
 * 1. Local WSL Docker PostgreSQL (postgres://postgres:postgres@localhost:5432/devtool_monetize)
 * 2. Supabase Transaction / Session Pooler (ports 6543 / 5432)
 * 3. Neon, AWS RDS, GCP Cloud SQL, or Fly.io Postgres
 */

const databaseUrl = process.env.DATABASE_URL || "";

export const isPostgresConfigured = Boolean(
  databaseUrl &&
  !databaseUrl.includes("placeholder") &&
  !databaseUrl.includes("example.com")
);

// Determine SSL requirements: localhost doesn't need SSL, remote production cloud DBs do
const isLocalhost =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1") ||
  databaseUrl.includes("host.docker.internal");

const sslMode = isLocalhost ? false : { rejectUnauthorized: false };

// Global singleton to prevent pool exhaustion in Next.js development and server actions
declare global {
  // eslint-disable-next-line no-var
  var _sqlInstance: ReturnType<typeof postgres> | undefined;
}

function createPostgresClient() {
  if (!isPostgresConfigured) {
    return null;
  }

  return postgres(databaseUrl, {
    max: 10, // Max connections in pool (tuned for serverless / Next.js edge)
    idle_timeout: 20, // Idle connection timeout in seconds
    connect_timeout: 10, // Connection timeout in seconds
    max_lifetime: 60 * 30, // 30 minutes max lifetime
    ssl: sslMode,
    transform: {
      undefined: null,
    },
    onnotice: () => {}, // Suppress notice noise in server logs
  });
}

export const sql = global._sqlInstance ?? createPostgresClient();

if (process.env.NODE_ENV !== "production" && sql) {
  global._sqlInstance = sql;
}

/**
 * Helper to test database connectivity & measure ping latency
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
}> {
  if (!sql) {
    return {
      connected: false,
      error: "DATABASE_URL is not configured in .env.local",
    };
  }

  const start = Date.now();
  try {
    const result = await sql`SELECT version();`;
    const latencyMs = Date.now() - start;
    const serverVersion = result[0]?.version || "PostgreSQL";
    return { connected: true, latencyMs, serverVersion };
  } catch (error: any) {
    return {
      connected: false,
      error: error?.message || "Connection refused",
    };
  }
}
