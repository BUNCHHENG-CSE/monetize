#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function readEnvVar(name) {
  if (process.env[name]) return process.env[name];

  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const match = content.match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, "m"));
      if (match) return match[1].trim();
    }
  }
  return null;
}

const dbUrl = readEnvVar("DATABASE_URL") || "file:./dev.db";
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
const isNeon = dbUrl.includes("neon.tech");

const schemaDest = path.join(rootDir, "prisma", "schema.prisma");
const sourceName = isPostgres ? "schema.postgresql.prisma" : "schema.sqlite.prisma";
const schemaSource = path.join(rootDir, "prisma", sourceName);

if (!fs.existsSync(schemaSource)) {
  console.error(`[Prisma Auto-Sync] Error: Schema template not found at ${schemaSource}`);
  process.exit(1);
}

const currentContent = fs.existsSync(schemaDest) ? fs.readFileSync(schemaDest, "utf-8") : "";
const targetContent = fs.readFileSync(schemaSource, "utf-8");

const currentProvider = currentContent.match(/provider\s*=\s*["']([^"']+)["']/)?.[1];
const targetProvider = isPostgres ? "postgresql" : "sqlite";

if (currentProvider !== targetProvider || currentContent !== targetContent) {
  fs.writeFileSync(schemaDest, targetContent, "utf-8");
  const providerLabel = isPostgres ? (isNeon ? "Neon PostgreSQL (Production)" : "PostgreSQL") : "SQLite (Local Dev)";
  console.log(`\x1b[36m[Prisma Auto-Sync]\x1b[0m Synchronized prisma/schema.prisma -> \x1b[32m${providerLabel}\x1b[0m`);
} else {
  // Already in sync
}

// Ensure DIRECT_URL is present in process.env if in Postgres/Neon mode
if (isPostgres && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = readEnvVar("DIRECT_URL") || dbUrl;
}
