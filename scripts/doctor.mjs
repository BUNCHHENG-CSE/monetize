#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log(
  "\x1b[36m%s\x1b[0m",
  `
========================================================================
   ____             _____           _   ____             _             
  |  _ \\  _____   _|_   _|__   ___ | | |  _ \\  ___   ___| |_ ___  _ __ 
  | | | |/ _ \\ \\ / / | |/ _ \\ / _ \\| | | | | |/ _ \\ / __| __/ _ \\| '__|
  | |_| |  __/\\ V /  | | (_) | (_) | | | |_| | (_) | (__| || (_) | |   
  |____/ \\___| \\_/   |_|\\___/ \\___/|_| |____/ \\___/ \\___|\\__\\___/|_|   
  TCT Monetize — Automated System & Monetization Diagnostics Utility
========================================================================
`
);

let passes = 0;
let warnings = 0;
let errors = 0;

function pass(msg) {
  console.log("\x1b[32m%s\x1b[0m", `  ✔ [PASS] ${msg}`);
  passes++;
}

function warn(msg, fixCmd) {
  console.log("\x1b[33m%s\x1b[0m", `  ⚠ [WARN] ${msg}`);
  if (fixCmd) {
    console.log("\x1b[90m%s\x1b[0m", `           ↳ Fix: ${fixCmd}`);
  }
  warnings++;
}

function fail(msg, fixCmd) {
  console.log("\x1b[31m%s\x1b[0m", `  ✖ [FAIL] ${msg}`);
  if (fixCmd) {
    console.log("\x1b[33m%s\x1b[0m", `           ↳ Fix: ${fixCmd}`);
  }
  errors++;
}

console.log("\x1b[1m1. Runtime & Package Manager:\x1b[0m");
const isBun = typeof Bun !== "undefined";
if (isBun) {
  pass(`Bun Runtime active: v${Bun.version}`);
} else {
  const nodeMajor = parseInt(process.version.replace("v", "").split(".")[0], 10);
  if (nodeMajor >= 18) {
    pass(`Node.js Runtime: ${process.version}`);
  } else {
    fail(`Node.js ${process.version} is older than v18.`, "Install Node.js 20+ or Bun 1.1+");
  }
}
try {
  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.dependencies?.next) {
      pass(`Next.js Framework: v${pkg.dependencies.next} (Turbopack Engine)`);
    }
  }
} catch {}

console.log("\n\x1b[1m2. Environment Files & Configuration:\x1b[0m");
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");
const activeEnvPath = fs.existsSync(envLocalPath)
  ? envLocalPath
  : fs.existsSync(envPath)
  ? envPath
  : null;

if (activeEnvPath) {
  pass(`Detected environment file: ${path.basename(activeEnvPath)}`);
} else {
  warn(
    "No .env or .env.local found. Using built-in local simulation fallback.",
    "bun run setup"
  );
}

const envContent = activeEnvPath ? fs.readFileSync(activeEnvPath, "utf-8") : "";

function getVar(name) {
  const match = envContent.match(new RegExp(`^\\s*${name}=["']?([^"'\\r\\n]+)["']?`, "m"));
  return match ? match[1].trim() : process.env[name] || "";
}

console.log("\n\x1b[1m3. Database & Prisma Client:\x1b[0m");
const prismaClientPath = path.join(rootDir, "node_modules", ".prisma", "client");
if (fs.existsSync(prismaClientPath)) {
  pass("Prisma Client generated in node_modules/.prisma/client");
} else {
  warn(
    "Prisma Client not yet generated (in-memory fallback will be used).",
    "bun run prisma:generate"
  );
}

const dbUrl = getVar("DATABASE_URL") || "file:./dev.db";
const isNeon = dbUrl.includes("neon.tech");
if (dbUrl.startsWith("file:") || dbUrl.includes(".db") || dbUrl.includes("sqlite")) {
  pass(`Database mode: SQLite (${dbUrl})`);
  const dbFile = path.join(rootDir, "prisma", "dev.db");
  if (fs.existsSync(dbFile)) {
    pass(
      `SQLite database file exists: prisma/dev.db (${(
        fs.statSync(dbFile).size / 1024
      ).toFixed(1)} KB)`
    );
  } else {
    warn(
      "prisma/dev.db not yet initialized.",
      "bun run db:push && bun run db:seed"
    );
  }
} else if (isNeon) {
  pass(`Database mode: Neon Serverless PostgreSQL`);
  const directUrl = getVar("DIRECT_URL");
  if (directUrl) {
    pass("Neon DIRECT_URL configured for schema migrations");
  } else {
    warn(
      "Neon DIRECT_URL not set in environment.",
      "Add DIRECT_URL to .env.local for migrations bypassing PgBouncer"
    );
  }
} else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  pass("Database mode: PostgreSQL configured");
} else {
  warn(
    `Unrecognized DATABASE_URL '${dbUrl}'. In-memory fallback store active.`,
    "bun run db:switch sqlite"
  );
}

console.log("\n\x1b[1m4. Authentication Services (Clerk):\x1b[0m");
const clerkPubKey = getVar("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
const clerkSecKey = getVar("CLERK_SECRET_KEY");
if (clerkPubKey && clerkSecKey && !clerkPubKey.includes("sample_")) {
  pass("Clerk Authentication: Live/test keys configured");
} else {
  warn(
    "Clerk Auth running in local demo mode (user_demo_123, key: sk_test_demo).",
    "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY & CLERK_SECRET_KEY in .env.local for production"
  );
}

console.log("\n\x1b[1m5. Merchant of Record & Payment Providers:\x1b[0m");
const lemonKey = getVar("LEMONSQUEEZY_API_KEY");
const stripeKey = getVar("STRIPE_SECRET_KEY");

if (lemonKey && !lemonKey.includes("your_") && !lemonKey.includes("placeholder")) {
  pass("Lemon Squeezy: API key configured (Merchant of Record active)");
} else if (stripeKey && !stripeKey.includes("sample_") && !stripeKey.includes("placeholder")) {
  pass("Stripe: Secret key configured (Direct billing active)");
} else {
  warn(
    "Payments running in local sandbox simulation mode.",
    "Set LEMONSQUEEZY_API_KEY or STRIPE_SECRET_KEY in .env.local when ready to charge"
  );
}

console.log("\n\x1b[1m6. Tool Engine Presets Verification:\x1b[0m");
try {
  const presetsDir = path.join(rootDir, "src", "tool-engine", "presets");
  if (fs.existsSync(presetsDir)) {
    const files = fs.readdirSync(presetsDir);
    pass(`Tool Engine Presets Directory: ${files.length} modules (${files.join(", ")})`);
  } else {
    fail("Presets directory missing at src/tool-engine/presets");
  }
} catch (e) {
  fail("Error inspecting presets: " + e.message);
}

console.log("\n\x1b[1m7. API Endpoints Health Check:\x1b[0m");
const routesToCheck = [
  "src/app/api/v1/tool/execute/route.ts",
  "src/app/api/v1/tool/presets/route.ts",
  "src/app/api/account/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/keys/route.ts",
  "src/app/api/logs/route.ts",
  "src/app/api/alerts/route.ts",
  "src/app/api/openapi/route.ts",
  "src/app/api/billing/checkout/route.ts",
  "src/app/api/billing/portal/route.ts",
  "src/app/embed/page.tsx",
];

let allRoutesPresent = true;
for (const r of routesToCheck) {
  if (!fs.existsSync(path.join(rootDir, r))) {
    fail(`Missing route: ${r}`);
    allRoutesPresent = false;
  }
}
if (allRoutesPresent) {
  pass(`All ${routesToCheck.length} Next.js App Router API & Embed endpoints verified`);
}

console.log("\n" + "=".repeat(72));
console.log(
  `\x1b[1mDIAGNOSTICS SUMMARY: ${passes} Passed, ${warnings} Warnings, ${errors} Errors\x1b[0m`
);

if (errors === 0) {
  console.log("\x1b[32m%s\x1b[0m", "\n🎉 SYSTEM HEALTHY & READY TO RUN!");
  console.log("Run the dev server:  \x1b[36mbun run dev\x1b[0m");
  console.log("Open Dashboard:      \x1b[36mhttp://localhost:3000/dashboard\x1b[0m");
  console.log("Open API Docs:       \x1b[36mhttp://localhost:3000/docs\x1b[0m");
  console.log("=".repeat(72) + "\n");
  process.exit(0);
} else {
  console.log(
    "\x1b[31m%s\x1b[0m",
    "\n⚠ Critical errors require your attention before starting."
  );
  console.log("=".repeat(72) + "\n");
  process.exit(1);
}
