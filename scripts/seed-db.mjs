#!/usr/bin/env bun

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const isSqlite = dbUrl.startsWith("file:") || dbUrl.includes(".db") || dbUrl.includes("sqlite");
const isNeon = dbUrl.includes("neon.tech");
const dbType = isNeon ? "Neon PostgreSQL (Production)" : isSqlite ? "SQLite (Local Dev)" : "PostgreSQL";

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", `   Database Seeder: ${dbType}`);
console.log("\x1b[36m%s\x1b[0m", "==================================================\n");

async function main() {
  const userId = "user_demo_123";
  const email = "demo@developer.local";

  console.log("1. Seeding Developer Profile...");
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      creditsBalance: 250,
      name: "Demo Developer",
    },
    create: {
      id: userId,
      email: email,
      name: "Demo Developer",
      creditsBalance: 250,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
  });
  console.log(`✔ Profile ready: ${profile.email} (${profile.creditsBalance} credits)`);

  console.log("\n2. Seeding Active Pro Subscription...");
  const sub = await prisma.subscription.upsert({
    where: { id: "sub_demo_pro" },
    update: {
      status: "active",
      planId: "pro",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: "sub_demo_pro",
      userId: userId,
      provider: "lemonsqueezy",
      planId: "pro",
      status: "active",
      customerId: "cust_demo_8821",
      variantId: "variant_pro_monthly",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });
  console.log(`✔ Subscription ready: ${sub.id} (Plan: ${sub.planId}, Status: ${sub.status})`);

  console.log("\n3. Seeding Live API Key...");
  const rawKey = "sk_live_demo88f29910a7b4c";
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.upsert({
    where: { keyHash },
    update: {
      isActive: true,
      name: "CLI & Terminal Key",
    },
    create: {
      id: "key_demo_primary",
      userId: userId,
      name: "CLI & Terminal Key",
      keyPrefix: "sk_live_demo88f2...",
      keyHash: keyHash,
      isActive: true,
      requestsCount: 24,
      lastUsedAt: new Date(),
    },
  });
  console.log(`✔ API Key ready: ${apiKey.name} (${apiKey.keyPrefix})`);

  console.log("\n4. Seeding Sample Usage Logs...");
  const existingLogs = await prisma.usageLog.findMany({ where: { userId }, take: 1 });
  if (existingLogs.length === 0) {
    await prisma.usageLog.create({
      data: {
        userId: userId,
        apiKeyId: apiKey.id,
        endpoint: "/api/v1/tool/execute",
        creditsDeducted: 1,
        durationMs: 38,
        statusCode: 200,
        metadata: { tool: "tct-monetize", dialect: isSqlite ? "sqlite" : "postgres" },
      },
    });
    console.log("✔ Sample usage logs created.");
  } else {
    console.log("✔ Sample usage logs already present.");
  }

  console.log("\n\x1b[32m%s\x1b[0m", `🎉 ${dbType} successfully seeded!`);
  console.log("  • User ID:  \x1b[33muser_demo_123\x1b[0m");
  console.log("  • Email:    \x1b[33mdemo@developer.local\x1b[0m");
  console.log("  • Demo Key: \x1b[33msk_live_demo88f29910a7b4c\x1b[0m");
  console.log("  • Credits:  \x1b[33m250 credits\x1b[0m\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
