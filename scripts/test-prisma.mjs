import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const isSqlite =
  databaseUrl.startsWith("file:") ||
  databaseUrl.includes(".db") ||
  databaseUrl.includes("sqlite");
const isNeon = databaseUrl.includes("neon.tech");
const dbLabel = isNeon ? "Neon PostgreSQL (Production)" : isSqlite ? "SQLite (Local Dev)" : "PostgreSQL";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", `   Prisma ORM Test (${dbLabel})`);
console.log("\x1b[36m%s\x1b[0m", "=================================================\n");

async function main() {
  const startTime = Date.now();

  try {
    // 0. Ensure demo profile exists
    console.log("0. Ensuring demo test profile exists...");
    const profile = await prisma.profile.upsert({
      where: { id: "user_demo_123" },
      update: {},
      create: {
        id: "user_demo_123",
        email: "demo@developer.local",
        name: "Demo Developer",
        creditsBalance: 100,
      },
    });
    console.log(`✔ Demo profile ready: ${profile.email} (${profile.creditsBalance} credits)`);

    // 1. Test Profile query
    console.log("\n1. Testing Profile query through Prisma...");
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

    // 3. Test Query Execution through Prisma
    console.log("\n3. Testing Atomic Prisma Transaction for Credit Deduction...");
    const txResult = await prisma.$transaction(async (tx) => {
      const u = await tx.profile.findUnique({ where: { id: "user_demo_123" } });
      if (!u || u.creditsBalance < 10) throw new Error("Insufficient balance");
      return await tx.profile.update({
        where: { id: "user_demo_123" },
        data: { creditsBalance: { decrement: 10 } },
      });
    });
    console.log(`✔ Atomic ACID Transaction Success: New balance is ${txResult.creditsBalance} credits.`);

    if (isSqlite) {
      const rawResult = await prisma.$queryRaw`SELECT sqlite_version() as version;`;
      console.log("✔ SQLite Version Result:", rawResult[0]?.version);
    } else {
      const rawResult = await prisma.$queryRaw`SELECT version();`;
      console.log("✔ PostgreSQL Version Result:", (rawResult[0]?.version || "").split(",")[0]);
    }

    // 4. Test UsageLog creation through Prisma Relations
    console.log("\n4. Testing UsageLog creation with Prisma relational foreign keys...");
    const log = await prisma.usageLog.create({
      data: {
        userId: "user_demo_123",
        endpoint: "/api/v1/tool/execute",
        creditsDeducted: 10,
        durationMs: 42,
        statusCode: 200,
        metadata: { engine: "prisma-optimized", runtime: "bun", db: isSqlite ? "sqlite" : "postgres" },
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
