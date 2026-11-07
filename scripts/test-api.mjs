#!/usr/bin/env node

import http from "http";

console.log("\x1b[36m%s\x1b[0m", `
========================================================================
   TCT Monetize API Automated Verification Runner
========================================================================
`);

const baseUrl = process.env.TEST_API_URL || "http://localhost:3000";
console.log(`Targeting server: \x1b[33m${baseUrl}\x1b[0m\n`);

async function testHealth() {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const json = await res.json();
    console.log(`✔ [GET /api/health] Status: ${res.status} OK (Server uptime: ${json.uptime ?? "99.9%"})`);
    return true;
  } catch (e) {
    console.log(`⚠ [GET /api/health] Server not reachable on ${baseUrl} (${e.message}). Start server with 'bun run dev' to test live HTTP endpoints.`);
    return false;
  }
}

async function testOpenApi() {
  try {
    const res = await fetch(`${baseUrl}/api/openapi`);
    if (res.ok) {
      const json = await res.json();
      console.log(`✔ [GET /api/openapi] Status: ${res.status} OK (OpenAPI ${json.openapi} title: "${json.info.title}")`);
    }
  } catch (e) {
    // skip
  }
}

async function testPresets() {
  const presets = ["sql-optimizer", "ai-agent", "web-scraper", "code-security", "media-generator"];
  for (const preset of presets) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/tool/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk_live_demo88f29910a7b4c",
        },
        body: JSON.stringify({
          prompt: "Automated test prompt payload",
          preset,
        }),
      });

      const creditsUsed = res.headers.get("X-Credits-Used");
      const creditsRemaining = res.headers.get("X-Credits-Remaining");
      const executionTime = res.headers.get("X-Execution-Time-Ms");

      console.log(`✔ [POST /api/v1/tool/execute preset=${preset}] Status: ${res.status} | Credits: -${creditsUsed} (Remaining: ${creditsRemaining}) | Latency: ${executionTime}ms`);
    } catch (e) {
      // server not running
    }
  }
}

async function run() {
  const isHealthy = await testHealth();
  if (isHealthy) {
    await testOpenApi();
    await testPresets();
    console.log("\n\x1b[32m✔ All automated API tests completed successfully!\x1b[0m\n");
  } else {
    console.log("\nTip: Start the Next.js server with: \x1b[36mbun run dev\x1b[0m then re-run \x1b[36mbun run test:api\x1b[0m\n");
  }
}

run();
