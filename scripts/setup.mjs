#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\x1b[36m%s\x1b[0m", `
========================================================================
   __  __                  _   _            ____             
  |  \\/  | ___  _ __   ___| |_(_)_______   |  _ \\  _____   __
  | |\\/| |/ _ \\| '_ \\ / _ \\ __| |_  / _ \\  | | | |/ _ \\ \\ / /
  | |  | | (_) | | | |  __/ |_| |/ /  __/  | |_| |  __/\\ V / 
  |_|  |_|\\___/|_| |_|\\___|\\__|_/___\\___|  |____/ \\___| \\_/  
  Turn Your Code Into Revenue in Minutes (2026 Developer Blueprint)
========================================================================
`);

const envPath = path.join(rootDir, ".env.local");
const envExamplePath = path.join(rootDir, ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log("\x1b[32m%s\x1b[0m", "✔ Created .env.local from .env.example");
  } else {
    console.log("\x1b[33m%s\x1b[0m", "⚠ .env.example not found.");
  }
} else {
  console.log("\x1b[32m%s\x1b[0m", "✔ .env.local detected");
}

const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

function checkVar(name, placeholder) {
  const match = envContent.match(new RegExp(`${name}=["']?([^"'\\r\\n]+)["']?`));
  const val = match ? match[1].trim() : "";
  const isSet = val && !val.includes(placeholder) && !val.includes("sample_");
  return { isSet, val };
}

console.log("\n\x1b[1mChecking Commercialization Integrations:\x1b[0m");

// 1. Clerk
const clerkCheck = checkVar("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "sample_clerk_key");
if (clerkCheck.isSet) {
  console.log("\x1b[32m%s\x1b[0m", "  ✔ Clerk Auth: Configured");
} else {
  console.log("\x1b[33m%s\x1b[0m", "  ⚠ Clerk Auth: Using local simulation fallback (Add live keys from https://dashboard.clerk.com)");
}

// 2. Supabase
const supabaseCheck = checkVar("NEXT_PUBLIC_SUPABASE_URL", "example.supabase.co");
if (supabaseCheck.isSet) {
  console.log("\x1b[32m%s\x1b[0m", "  ✔ Supabase Database: Configured");
} else {
  console.log("\x1b[33m%s\x1b[0m", "  ⚠ Supabase Database: Using in-memory mock store (Add credentials from https://supabase.com)");
}

// 3. Lemon Squeezy / Stripe
const lemonCheck = checkVar("LEMONSQUEEZY_API_KEY", "placeholder");
const stripeCheck = checkVar("STRIPE_SECRET_KEY", "placeholder");

if (lemonCheck.isSet) {
  console.log("\x1b[32m%s\x1b[0m", "  ✔ Lemon Squeezy: Configured (Merchant of Record ready)");
} else if (stripeCheck.isSet) {
  console.log("\x1b[32m%s\x1b[0m", "  ✔ Stripe: Configured (Direct payments ready)");
} else {
  console.log("\x1b[33m%s\x1b[0m", "  ⚠ Payments: Running in local sandbox simulation mode");
}

console.log("\n\x1b[1mNext Steps To Launch:\x1b[0m");
console.log("  1. Drop your custom code into \x1b[34msrc/tool-engine/index.ts\x1b[0m");
console.log("  2. Set your pricing tiers in \x1b[34mmonetize.config.ts\x1b[0m");
console.log("  3. Run \x1b[32mnpm run dev\x1b[0m to test the playground and developer dashboard");
console.log("  4. Apply DB schema: copy \x1b[34msupabase/schema.sql\x1b[0m into your Supabase SQL Editor");
console.log("  5. Deploy to Vercel: \x1b[32mvercel deploy\x1b[0m\n");
