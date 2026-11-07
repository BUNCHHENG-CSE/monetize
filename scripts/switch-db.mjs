#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const target = (process.argv[2] || "").toLowerCase().trim();

if (!["sqlite", "postgres", "postgresql", "neon"].includes(target)) {
  console.log("\x1b[33m%s\x1b[0m", "Usage: bun run db:switch [sqlite | neon | postgres]");
  console.log("  Example: bun run db:switch sqlite   (Local development, zero dependencies)");
  console.log("  Example: bun run db:switch neon     (Production serverless PostgreSQL on Neon)");
  console.log("  Example: bun run db:switch postgres (Docker / self-hosted PostgreSQL)\n");
  process.exit(1);
}

const isSqlite = target === "sqlite";
const isNeon = target === "neon";
const isPostgres = target === "postgres" || target === "postgresql" || isNeon;

console.log("\x1b[36m%s\x1b[0m", "========================================================");
console.log("\x1b[36m%s\x1b[0m", `   Database Mode Switch: ${isNeon ? "Neon PostgreSQL (Production)" : isSqlite ? "SQLite (Local Dev)" : "PostgreSQL"}`);
console.log("\x1b[36m%s\x1b[0m", "========================================================\n");

function updateEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf-8");

  if (isSqlite) {
    if (content.match(/DATABASE_URL=["'][^"'\r\n]+["']/)) {
      content = content.replace(
        /DATABASE_URL=["'][^"'\r\n]+["']/,
        'DATABASE_URL="file:./dev.db"'
      );
    } else {
      content += '\nDATABASE_URL="file:./dev.db"\n';
    }
  } else if (isNeon) {
    const hasNeon = content.includes("neon.tech");
    if (!hasNeon) {
      // Put Neon template if not present
      if (content.match(/DATABASE_URL=["'][^"'\r\n]+["']/)) {
        content = content.replace(
          /DATABASE_URL=["'][^"'\r\n]+["']/,
          'DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"'
        );
      } else {
        content += '\nDATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"\n';
      }

      if (content.match(/DIRECT_URL=["'][^"'\r\n]+["']/)) {
        content = content.replace(
          /DIRECT_URL=["'][^"'\r\n]+["']/,
          'DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"'
        );
      } else {
        content += 'DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"\n';
      }
    }
  } else {
    // Local / standard postgres
    if (content.match(/DATABASE_URL=["'][^"'\r\n]+["']/)) {
      content = content.replace(
        /DATABASE_URL=["'][^"'\r\n]+["']/,
        'DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5434/tct_monetize"'
      );
    }
    if (content.match(/DIRECT_URL=["'][^"'\r\n]+["']/)) {
      content = content.replace(
        /DIRECT_URL=["'][^"'\r\n]+["']/,
        'DIRECT_URL="postgres://postgres:postgres@127.0.0.1:5434/tct_monetize"'
      );
    }
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("\x1b[32m%s\x1b[0m", `✔ Configured ${path.basename(filePath)} for ${isNeon ? "Neon" : isSqlite ? "SQLite" : "PostgreSQL"}`);
}

updateEnvFile(path.join(rootDir, ".env"));
updateEnvFile(path.join(rootDir, ".env.local"));

// Run schema synchronization
const syncScript = path.join(rootDir, "scripts", "sync-schema.mjs");
try {
  execSync(`bun ${syncScript}`, { cwd: rootDir, stdio: "inherit" });
} catch (e) {
  console.error("Schema sync warning:", e.message);
}

// Re-generate Prisma Client
console.log("\nRe-generating Prisma Client...");
try {
  execSync("bunx prisma generate", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("\x1b[32m%s\x1b[0m", "\n✔ Prisma Client successfully re-generated!");
} catch (e) {
  console.error("Prisma generate failed:", e.message);
}

console.log("\n\x1b[32m%s\x1b[0m", `🎉 Successfully switched to ${isNeon ? "Neon PostgreSQL" : isSqlite ? "SQLite" : "PostgreSQL"}!`);
if (isSqlite) {
  console.log("  • Run 'bun run db:push' to sync local SQLite schema (creates prisma/dev.db)");
  console.log("  • Run 'bun run db:seed' to seed test user, subscriptions, and demo API key");
} else if (isNeon) {
  console.log("  • Add your actual Neon connection string in .env.local:");
  console.log("    DATABASE_URL=\"postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require\"");
  console.log("    DIRECT_URL=\"postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require\"");
  console.log("  • Run 'bun run db:push' to push tables directly to Neon");
  console.log("  • Run 'bun run db:seed' to populate initial seed data in Neon");
} else {
  console.log("  • Ensure PostgreSQL is running locally or in Docker");
  console.log("  • Run 'bun run db:push' to sync schema");
}
console.log();
