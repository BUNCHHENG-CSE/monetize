import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

console.log("\x1b[36m%s\x1b[0m", "========================================");
console.log("\x1b[36m%s\x1b[0m", "   Database Seeder (Local Development)  ");
console.log("\x1b[36m%s\x1b[0m", "========================================\n");

async function main() {
  const userId = "user_demo_123";
  const email = "demo@example.com";

  console.log("1. Seeding Developer Profile...");
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {
      creditsBalance: 150,
    },
    create: {
      id: userId,
      email: email,
      name: "Demo Developer",
      creditsBalance: 150,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    },
  });
  console.log(`✔ Profile ready: ${profile.email} (${profile.creditsBalance} credits)`);

  console.log("\n2. Seeding Active Subscription...");
  const sub = await prisma.subscription.upsert({
    where: { id: "sub_demo_pro" },
    update: {
      status: "active",
      planId: "pro",
    },
    create: {
      id: "sub_demo_pro",
      userId: userId,
      provider: "lemonsqueezy",
      planId: "pro",
      status: "active",
      customerId: "cust_demo_123",
      variantId: "var_pro_123",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });
  console.log(`✔ Subscription ready: ${sub.id} (Plan: ${sub.planId}, Status: ${sub.status})`);

  console.log("\n3. Seeding Live API Key...");
  const rawKey = "sk_live_demo_key_998877";
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.upsert({
    where: { keyHash },
    update: {
      isActive: true,
    },
    create: {
      id: "key_demo_active_1",
      userId: userId,
      name: "Default Dev Key",
      keyPrefix: "sk_live_demo...",
      keyHash: keyHash,
      isActive: true,
      requestsCount: 12,
      lastUsedAt: new Date(),
    },
  });
  console.log(`✔ API Key ready: ${apiKey.name} (Prefix: ${apiKey.keyPrefix})`);

  console.log("\n4. Seeding Sample Usage Logs...");
  await prisma.usageLog.create({
    data: {
      userId: userId,
      apiKeyId: apiKey.id,
      endpoint: "/api/v1/tool/execute",
      creditsDeducted: 1,
      durationMs: 45,
      statusCode: 200,
      metadata: { tool: "formatter", status: "success" },
    },
  });
  console.log("✔ Sample usage logs populated.");

  console.log("\n\x1b[32m%s\x1b[0m", "🎉 Local database seeded successfully!");
  console.log("  • User ID:  \x1b[33muser_demo_123\x1b[0m");
  console.log("  • Email:    \x1b[33mdemo@example.com\x1b[0m");
  console.log("  • Demo Key: \x1b[33msk_live_demo_key_998877\x1b[0m\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
