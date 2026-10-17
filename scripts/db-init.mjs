#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const schemaPath = path.join(rootDir, "supabase", "schema.sql");

console.log("\x1b[36m%s\x1b[0m", "========================================");
console.log("\x1b[36m%s\x1b[0m", "   Supabase Database Schema Installer   ");
console.log("\x1b[36m%s\x1b[0m", "========================================\n");

if (!fs.existsSync(schemaPath)) {
  console.error("\x1b[31m%s\x1b[0m", "Error: supabase/schema.sql not found!");
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, "utf-8");

console.log("\x1b[32m%s\x1b[0m", "✔ Located schema.sql (Profiles, Subscriptions, API Keys, Usage Logs, Atomic Procedures)");
console.log("\nTo deploy this schema to your Supabase PostgreSQL database:");
console.log("  1. Open your Supabase Dashboard: https://supabase.com/dashboard");
console.log("  2. Navigate to your project -> \x1b[1mSQL Editor\x1b[0m");
console.log("  3. Create a new query, paste the contents of \x1b[34msupabase/schema.sql\x1b[0m, and click \x1b[32mRun\x1b[0m");
console.log("\nAll tables, indexes, row-level-security policies, and atomic credit functions will be configured automatically.\n");
