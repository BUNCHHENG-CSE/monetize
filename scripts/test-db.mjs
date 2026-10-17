import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/devtool_monetize";

console.log("Connecting to PostgreSQL at:", connectionUrl);

const sql = postgres(connectionUrl, {
  max: 2,
  connect_timeout: 5,
  ssl: false,
});

async function main() {
  const start = Date.now();
  try {
    // 1. Ping version
    const versionResult = await sql`SELECT version();`;
    console.log("✔ Connection successful!");
    console.log("  PostgreSQL Engine:", versionResult[0].version.split(",")[0]);

    // 2. Query seeded profiles
    const profiles = await sql`SELECT id, email, credits_balance FROM public.profiles;`;
    console.log("\n✔ Queried Profiles table:");
    console.table(profiles);

    // 3. Test atomic deduct_credits stored procedure
    console.log("\nTesting atomic stored procedure deduct_credits('user_demo_123', 5)...");
    const deduction = await sql`SELECT public.deduct_credits('user_demo_123', 5);`;
    console.log("✔ Stored Procedure Result:", deduction[0].deduct_credits);

    // 4. Verify new balance
    const updated = await sql`SELECT credits_balance FROM public.profiles WHERE id = 'user_demo_123';`;
    console.log("✔ New Balance in Database:", updated[0].credits_balance);

    const elapsed = Date.now() - start;
    console.log(`\n🎉 All database tests passed in ${elapsed}ms! Production PostgreSQL is fully operational.`);
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
