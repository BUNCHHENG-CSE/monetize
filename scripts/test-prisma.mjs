import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5434/devtool_monetize",
    },
  },
});

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", "   Prisma ORM Optimization & Integration Test   ");
console.log("\x1b[36m%s\x1b[0m", "=================================================\n");

async function main() {
  const startTime = Date.now();

  try {
    // 1. Test Profile query
    console.log("1. Testing Profile query through Prisma...");
    const profiles = await prisma.profile.findMany({
      include: {
        subscriptions: true,
        apiKeys: true,
      },
    });
    console.log(`✔ Found ${profiles.length} profiles in database.`);
    if (profiles[0]) {
      console.log(`   User: ${profiles[0].email} (Balance: ${profiles[0].creditsBalance} credits)`);
      console.log(`   Active API Keys: ${profiles[0].apiKeys.length}`);
      console.log(`   Subscriptions: ${profiles[0].subscriptions.length}`);
    }

    // 2. Test Atomic Credit Increment via Prisma
    console.log("\n2. Testing Atomic Credit Increment (+50 credits)...");
    const incremented = await prisma.profile.update({
      where: { id: "user_demo_123" },
      data: {
        creditsBalance: { increment: 50 },
      },
    });
    console.log(`✔ Incremented balance. New balance: ${incremented.creditsBalance} credits.`);

    // 3. Test Raw Query Execution through Prisma (PostgreSQL Stored Procedure)
    console.log("\n3. Testing Atomic Stored Procedure via prisma.$queryRaw...");
    const rawResult = await prisma.$queryRaw`
      SELECT public.deduct_credits('user_demo_123', 10);
    `;
    console.log("✔ Stored Procedure Result:", rawResult[0].deduct_credits);

    // 4. Test UsageLog creation through Prisma Relations
    console.log("\n4. Testing UsageLog creation with Prisma relational foreign keys...");
    const log = await prisma.usageLog.create({
      data: {
        userId: "user_demo_123",
        endpoint: "/api/v1/tool/execute",
        creditsDeducted: 10,
        durationMs: 42,
        statusCode: 200,
        metadata: { engine: "prisma-optimized", runtime: "node24" },
      },
    });
    console.log(`✔ Created UsageLog record ID: ${log.id}`);

    const duration = Date.now() - startTime;
    console.log("\n\x1b[32m%s\x1b[0m", `🎉 All Prisma ORM tests passed successfully in ${duration}ms!`);
  } catch (error) {
    console.error("❌ Prisma test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
