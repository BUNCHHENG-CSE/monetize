# All-in-One "Payments + Auth + Hosting" Wrapper for Developer Tools

> **Turn code into revenue in 5 minutes.** In 2026, writing code is no longer the bottleneck—turning code into a product that can take money still is. This production-ready starter kit wraps your TypeScript or Python developer tool with **Clerk Auth**, **Lemon Squeezy (MoR) / Stripe Payments**, **Production-Optimized PostgreSQL / Supabase Credit Metering**, and **API Key Management** out of the box.

---

## 💡 The Opportunity

In 2019, launching a commercial developer SaaS required an agency or engineering team costing **$5,000/month** across weeks of sprints.

In 2026, an indie developer can replace that entire team with an **$85–200/month stack**:
- **Authentication**: Clerk (zero-maintenance modern auth & session management)
- **Payments**: Lemon Squeezy (Merchant of Record: solves global sales tax & EU VAT compliance) or Stripe
- **Database & Metering**: PostgreSQL / Supabase (compiled direct SQL connection pooling with atomic stored procedures)
- **Hosting & Edge**: Vercel (Next.js 15 App Router)
- **AI / Building**: Cursor + Claude

The gap is not *"can it be built"*, but *"how do I charge for it once built."* This repository is the shortest path from code to first revenue.

---

## ⚡ Architecture & How It Works

```
                     ┌────────────────────────────────────────────────────────┐
                     │                 Customer / Developer                   │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                     ┌──────────────────────────┴─────────────────────────────┐
                     │          Authentication & Access Layer                 │
                     │  • Web: Clerk OAuth / Email Session                    │
                     │  • API / CLI: Bearer sk_live_... (SHA-256 Hashed)      │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                     ┌──────────────────────────┴─────────────────────────────┐
                     │         Middleware & Execution Wrapper                 │
                     │  • Sliding-window rate limiter                         │
                     │  • Active subscription plan verification               │
                     │  • Atomic credit balance check (PostgreSQL RPC)        │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                     ┌──────────────────────────┴─────────────────────────────┐
                     │           YOUR BUSINESS LOGIC DROP-IN                  │
                     │           (src/tool-engine/index.ts)                   │
                     │  SQL Optimizer, AI Agent, Scraper, Parser, API         │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                     ┌──────────────────────────┴─────────────────────────────┐
                     │           Atomic Ledger & Response Headers             │
                     │  • Atomically decrements credit balance                │
                     │  • Asynchronously records usage in audit logs          │
                     │  • Injects X-Credits-Remaining, X-Execution-Time-Ms    │
                     └────────────────────────────────────────────────────────┘
```

---

## 🐘 Production PostgreSQL & Local WSL Docker Optimization

This codebase includes an optimized three-tier database architecture supporting both **local development in WSL2 Docker** and **high-throughput production deployments**.

### 1. High-Performance Direct PostgreSQL Connection Pool (`src/lib/db/index.ts`)
- Powered by `postgres` (porsager's zero-dependency, ultra-fast compiled SQL driver).
- **Singleton Pattern**: Prevents connection pool leaks during Next.js hot-reloads and serverless edge invocations.
- **Auto SSL Detection**: Automatically enforces SSL for remote cloud databases (Supabase, Neon, AWS RDS) while disabling it for local Docker instances.
- **Configurable Pool Size**: `max: 10`, `idle_timeout: 20s`, `connect_timeout: 10s`, tuned for serverless workloads.

### 2. Local WSL Docker PostgreSQL (`docker-compose.yml`)
Run an exact production-replica PostgreSQL 16 engine locally in WSL2 without installing heavy software on Windows:

```bash
# Start production-tuned PostgreSQL in WSL Docker (port 5434)
npm run db:up

# Check container status & health
npm run db:status

# View live PostgreSQL logs
npm run db:logs

# Reset volume & re-apply schema + seed data
npm run db:reset

# Stop database container
npm run db:down
```

#### WSL2 Performance Optimizations Included:
- **Native Named Volume (`pgdata`)**: Placed on the WSL2 native `ext4` virtual disk (`/var/lib/docker/volumes`), bypassing the slow Windows 9p translation layer for full NVMe SSD speed.
- **Production-Tuned `docker/postgres.conf`**:
  - `shared_buffers = 512MB`
  - `effective_cache_size = 1536MB`
  - `work_mem = 16MB`
  - `wal_buffers = 16MB`
  - `checkpoint_completion_target = 0.9`
  - `random_page_cost = 1.1` (SSD / virtual disk optimization)
  - `autovacuum` tuned for high-frequency append tables (`usage_logs`).
- **Automated Schema Provisioning**: Mounts `supabase/schema.sql` and `docker/seed.sql` into `/docker-entrypoint-initdb.d/` to automatically create all tables, indexes, and stored procedures on container creation.

### 3. Production Cloud Connection String (Supabase / Neon / AWS RDS)
In production, point `DATABASE_URL` in your Vercel or production environment to your managed connection pooler:

```env
# Supabase Transaction Pooler (Port 6543 - Recommended for Serverless):
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Session Pooler (Port 5432):
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Database Health & Diagnostics Endpoint (`/api/health`)
Visit `http://localhost:3000/api/health` to view real-time database connection metrics:
```json
{
  "status": "healthy",
  "latencyMs": 2,
  "database": {
    "driver": "direct_postgresql",
    "connected": true,
    "latencyMs": 1,
    "serverVersion": "PostgreSQL 16.15 on x86_64-pc-linux-musl"
  }
}
```

---

## 📦 Features Summary

1. **Drop-in Business Logic Engine (`src/tool-engine/index.ts`)**:
   - Simply export your `executeToolLogic(input, context)` function.
   - The wrapper handles authentication, subscription plan gating, credit deduction, rate limiting, and response headers automatically.
2. **Central Nervous System (`monetize.config.ts`)**:
   - Single configuration file that drives your pricing table, plan names, rate limits, monthly credit allowances, and API schema.
3. **Dual Payment Gateway Support**:
   - **Lemon Squeezy (Default)**: Acts as Merchant of Record. Handles global checkout, VAT, customer portal, and invoice receipts.
   - **Stripe**: Alternative direct billing mode with customer portal.
4. **PostgreSQL Atomic Credit Metering**:
   - PostgreSQL stored procedure (`deduct_credits`) with row-level locking (`FOR UPDATE`) to prevent concurrent race condition overdrafts.
5. **Developer API Key Distribution & Revocation**:
   - Users can generate scoped `sk_live_...` API keys in their dashboard.
   - Keys are displayed once upon creation and stored hashed with SHA-256.
6. **Live Interactive Playground**:
   - Embedded both on the homepage and in the customer dashboard so users can test queries with real-time latency and credit tracking.
7. **Founder Admin & Telemetry (`/admin`)**:
   - Real-time MRR tracking, subscriber health, and an interactive payment webhook simulator.
8. **Interactive CLI Setup Wizard (`npm run setup`)**:
   - Validates environment variables, checks provider keys, and provides next steps.

---

## 🚀 Quickstart in 5 Minutes

### 1. Clone & Install Dependencies
```bash
git clone <your-repo>
cd devtool-monetization-wrapper
npm install
```

### 2. Start Local WSL Docker PostgreSQL
```bash
npm run db:up
```

### 3. Verify Database Connectivity
```bash
node scripts/test-db.mjs
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, interactive playground, and developer dashboard.

---

## 🛠 How to Drop In Your Tool Logic

Open [`src/tool-engine/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/index.ts):

```typescript
export async function executeToolLogic(
  input: ToolInput,
  context: ToolContext
): Promise<ToolOutput> {
  // YOUR CUSTOM LOGIC HERE
  // Examples:
  // - Call Claude / OpenAI API
  // - Parse AST or format SQL
  // - Scrape / enrich web data
  // - Generate images, charts, or PDFs

  return {
    success: true,
    data: {
      result: "Your computed output here",
    },
    costInCredits: 1, // Deduct 1 credit (or dynamic based on tokens)
  };
}
```

---

## 🚢 Production Deployment

Deploy seamlessly to Vercel in 1 click:
```bash
vercel deploy --prod
```
Ensure `DATABASE_URL`, Clerk, and Lemon Squeezy / Stripe keys are configured in your Vercel project environment variables.
