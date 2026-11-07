# TCT Monetize (`tct-monetize`) — All-in-One Payments + Auth + Hosting Wrapper for Developer Tools
## Comprehensive Architectural, Operational, and Implementation Guide

---

## 1. Executive Summary & Overview

### What is this Project?
**TCT Monetize** (**All-in-One Payments + Auth + Hosting Wrapper for Developer Tools**) is a production-ready, full-stack micro-SaaS starter kit built on **Next.js 16.4.3 (App Router with Turbopack)**, **React 19**, and **TypeScript**. 

It is designed to solve the single largest hurdle facing software engineers, indie hackers, and AI builders in 2026: **the monetization bottleneck**. In the modern era of coding assistants and automated workflows, writing technical algorithms, AI pipelines, scrapers, linters, or transformation scripts takes hours—yet turning that code into a commercially viable product with billing, user accounts, API key generation, rate limits, credit metering, and global tax compliance usually takes **weeks of repetitive, non-differentiated engineering**.

This project provides an out-of-the-box commercialization framework. Developers drop their custom function into a single file ([`src/tool-engine/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/index.ts)), and the wrapper automatically wraps it with:
- **Clerk Authentication** (OAuth, email sessions, user management).
- **Dual Developer Authentication** (CLI/cURL Bearer tokens with SHA-256 hashed API keys).
- **Merchant of Record (MoR) / Direct Payments** (Lemon Squeezy for zero-headache global VAT/sales tax compliance, or Stripe).
- **Atomic Credit Ledger & Metering** (Row-level locked transactions preventing concurrent race-condition overdrafts).
- **Dual Database Architecture** (Zero-dependency local SQLite via Prisma, and high-throughput production serverless PostgreSQL via Neon with automatic schema synchronization).
- **Sliding-Window Rate Limiting** configured per subscription tier.
- **Developer Experience Assets**: A public marketing landing page, an interactive live testing playground, a developer self-service dashboard, an interactive API documentation reference ([`/docs`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/app/docs/page.tsx)), and a founder telemetry/webhook simulator console ([`/admin`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/app/admin/page.tsx)).

---

## 2. Why It Exists & How Useful It Is

### The Problem It Solves
Building a developer tool or AI API traditionally required assembling a fragile mosaic of third-party tools and custom backends:
1. **Sales Tax & Compliance Burden**: Selling software globally involves registering for EU VAT, UK VAT, and state-by-state US sales tax. Lemon Squeezy integration acts as the Merchant of Record, removing legal liability and bookkeeping overhead.
2. **Race Conditions in API Metering**: If a user fires 50 concurrent requests with only 1 credit remaining, naive database queries (`SELECT credits` -> `UPDATE credits = credits - 1`) result in overdrafts. This wrapper includes row-level locking (`FOR UPDATE`) and atomic SQL transactions.
3. **Dual Auth Disconnect**: Most SaaS templates only support web cookies. Developer tools require both web session cookies for the dashboard AND stateless `sk_live_...` Bearer API keys for terminals, SDKs, GitHub Actions, and external code.
4. **Local Dev Friction**: Requiring Docker or external cloud databases just to test a feature slows development. This template defaults to zero-dependency SQLite for instant `bun run dev` productivity, while providing single-command switching (`bun run db:switch neon` or `bun run db:switch sqlite`) with auto-detection for Neon Serverless PostgreSQL in production.

### Value Matrix

| Feature Dimension | Traditional SaaS Development | With This Starter Kit |
| :--- | :--- | :--- |
| **Time to Market** | 3 to 6 weeks | **Under 5 minutes** |
| **Initial Capital Required** | $3,000 – $10,000 (agency/dev time) | **$0** (Free tiers of Clerk, Lemon Squeezy, Supabase/Vercel) |
| **Tax & VAT Overhead** | High (Requires TaxJar, Quaderno, or tax filings) | **Zero** (Lemon Squeezy Merchant of Record handles remit) |
| **API Key Architecture** | Days spent implementing hashing & counters | **Included** (SHA-256 hashed, instant revocation, prefix-masked) |
| **Usage Metering** | Prone to concurrent race conditions | **Atomic Stored Procedure / Transaction with Row-Level Lock** |
| **Documentation & Sandbox** | Must build custom UI and docs | **Included** (`/docs` & Interactive Sandbox Playground) |

---

## 3. High-Level Architecture & Request Lifecycle

```
                             [ Customer / Developer Client ]
                                   │              │
                     (Web Browser / Dashboard)   (cURL / SDK / CLI / Terminal)
                                   │              │
                         Clerk Session Cookie    Bearer sk_live_...
                                   │              │
                                   ▼              ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Authentication & Verification Layer           │
                     │  • Web: Verified via Clerk SDK                         │
                     │  • API: Hashed with SHA-256 & checked against DB       │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Execution Wrapper & Policy Gatekeeper         │
                     │  1. Check plan permissions (Free vs. Pro vs. Scale)    │
                     │  2. Sliding-window rate limiter per minute             │
                     │  3. Pre-flight credit solvency check                   │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                     ┌────────────────────────────────────────────────────────┐
                     │        YOUR CORE BUSINESS LOGIC (Drop-In Engine)       │
                     │              (src/tool-engine/index.ts)                │
                     │  • AI generation, SQL analysis, scraper, transformation│
                     │  • Returns result data + dynamic credit cost           │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Atomic Ledger & Telemetry Recording           │
                     │  • Atomically decrements credit balance (Postgres/tx)  │
                     │  • Appends record to usage_logs asynchronously        │
                     │  • Injects audit headers: X-Credits-Remaining,         │
                     │    X-Credits-Used, X-Execution-Time-Ms, X-RateLimit    │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                                    [ JSON Response to Client ]
```

---

## 4. Key Architectural Components

### 4.1 The Central Nervous System (`monetize.config.ts`)
The entire application is controlled from a single configuration file: [`monetize.config.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/monetize.config.ts). 
Modifying this file automatically updates:
- **Tool Metadata**: Brand name, tagline, description, author info, documentation URLs.
- **Provider Settings**: Seamless toggling between `lemonsqueezy` and `stripe`.
- **Subscription & Lifetime Tiers**: Defines plan names (`Hobby`, `Pro Developer`, `Scale / Team`, `Lifetime Deal`), pricing (monthly, annual, or one-time lifetime), credits awarded per month, rate limits per minute, and gateway variant/price IDs.
- **One-Time Credit Packs**: Add-on credit bundles for users who exhaust their monthly quota.
- **API Schema**: Input fields, validation types, default parameters, and sample request/response payloads rendered across the playground and documentation.

### 4.2 The Business Logic Drop-In (`src/tool-engine/index.ts`)
Developers only need to modify [`src/tool-engine/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/index.ts):
```typescript
export async function executeToolLogic(
  input: ToolInput,
  context: ToolContext
): Promise<ToolOutput> {
  // 1. Read input payload (e.g. input.prompt, input.code)
  // 2. Perform compute, AI call, database query, or transformation
  // 3. Return structured data and credit cost
  return {
    success: true,
    data: { result: "Computed output" },
    costInCredits: 1, // Override default credit charge dynamically
  };
}
```
All surrounding infrastructure (authentication, rate-limiting, credit deduction, headers, and error handling) is handled by [`src/tool-engine/wrapper.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/wrapper.ts).

### 4.3 Database Architecture (Dual Engine)
The project provides complete database flexibility via Prisma ORM and direct SQL drivers:
1. **Local SQLite (`prisma/dev.db`)**:
   - Zero installation, zero external processes.
   - Ideal for instant prototyping and running unit tests.
2. **Production PostgreSQL (Supabase / Neon / AWS RDS / WSL2 Docker)**:
   - Optimized connection pooling via `postgres.js` in [`src/lib/db/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/lib/db/index.ts).
   - Singleton pattern prevents connection exhaustion during Next.js hot reload and serverless edge functions.
   - Auto-SSL detection: automatically disables SSL on `localhost` and enables it on managed cloud providers.
   - Atomic Stored Procedure:
     ```sql
     CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id TEXT, p_amount INT)
     RETURNS JSONB LANGUAGE plpgsql AS $$
     DECLARE
       v_current INT;
     BEGIN
       SELECT credits_balance INTO v_current FROM public.profiles WHERE id = p_user_id FOR UPDATE;
       IF v_current < p_amount THEN
         RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'balance', v_current);
       END IF;
       UPDATE public.profiles SET credits_balance = credits_balance - p_amount WHERE id = p_user_id;
       RETURN jsonb_build_object('success', true, 'balance', v_current - p_amount);
     END;
     $$;
     ```

### 4.4 Payment Integration & Webhook Automation
- **Unified Billing Layer ([`src/lib/payments/unified.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/lib/payments/unified.ts))**: Exposes identical `createBillingCheckout` and `getBillingPortalUrl` signatures regardless of whether Stripe or Lemon Squeezy is active.
- **Webhook Handlers ([`src/app/api/webhooks/lemonsqueezy/route.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/app/api/webhooks/lemonsqueezy/route.ts))**:
  - `subscription_created`: Updates profile subscription status to active and automatically deposits monthly credits.
  - `subscription_updated`: Adjusts plan tiers if the user upgrades/downgrades.
  - `subscription_cancelled`: Reverts user account to the Free/Hobby tier upon period expiration.
  - `order_created`: Detects one-time top-up pack purchases and immediately increments the user's balance.

### 4.5 Developer Dashboard & API Key Management
Located at [`/dashboard`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/app/dashboard/page.tsx), users can:
- Generate secret API keys prefixed with `sk_live_...`.
- View masked key prefixes (`sk_live_abc123...`). Full raw keys are displayed only once upon generation.
- Monitor real-time request counts and last used timestamps.
- Instantly revoke compromised keys.
- Inspect live request logs with duration, endpoint, credits deducted, and HTTP status codes.
- Access the customer billing portal to manage payment methods or invoices.

### 4.6 Founder Admin & Webhook Simulator
Located at [`/admin`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/app/admin/page.tsx):
- Founder telemetry tracking MRR, active subscribers, and credit burn rate.
- **Interactive Webhook Simulator**: Triggers simulated `subscription_created`, `order_created`, and `subscription_cancelled` payloads against the local webhook listener without requiring external tunneling (ngrok).

### 4.7 5 Drop-In Tool Archetype Presets (`src/tool-engine/presets/`)
- **SQL Optimizer & Index Advisor**: Rewrites slow queries, evaluates joins, projects explicit columns.
- **AI Agent & Prompt Engine**: Autonomous prompt execution, structured entity extraction, and summary generation.
- **Web Scraper & Metadata Extractor**: Clean Markdown extraction, OpenGraph, and canonical tag reader.
- **AST Code Security Scanner**: Scans submitted code for SQL injection, hardcoded secrets, and dangerous eval statements.
- **Dynamic SVG / OpenGraph Card**: Generates responsive social share cards with custom badge themes.

### 4.8 Outbound Alerts & Telemetry Dispatcher (`src/lib/alerts/dispatcher.ts`)
- Automatically dispatches alerts to Discord Webhooks, Slack channels, or custom endpoints when user credit balances drop below threshold (< 15% quota) or when rate limits are exceeded (HTTP 429).
- Includes live test ping capability in the developer dashboard.

### 4.9 OpenAPI 3.1 & Postman Specification Generator (`/api/openapi`)
- Dynamically outputs machine-readable OpenAPI 3.1 JSON or Postman Collection v2.1 format.
- Enables instant 1-click import into Postman/Insomnia and automated SDK generation.

### 4.10 Embeddable Documentation Sandbox Widget (`/embed`)
- Lightweight, headless embed route (`/embed?view=playground` & `/embed?view=pricing`) designed for zero-friction iframe embedding into Mintlify, VitePress, Docusaurus, and GitBook docs.

---

## 5. Directory Structure & File Map

```
├── docker/
│   ├── postgres.conf          # WSL2/Production-tuned PostgreSQL configuration
│   └── seed.sql               # Automated database initialization script
├── prisma/
│   ├── schema.prisma          # Unified Prisma schema for Profiles, Subscriptions, Keys, Logs
│   └── dev.db                 # Local SQLite database (zero external dependencies)
├── scripts/
│   ├── doctor.mjs             # Automated health & monetization diagnostics runner
│   ├── test-api.mjs           # Automated API verification test script
│   ├── setup.mjs              # Interactive environment verification wizard
│   ├── switch-db.mjs          # Database provider toggle (sqlite <-> postgres)
│   ├── seed-sqlite.mjs        # Seeds demo user (user_demo_123), Pro sub, and API key
│   ├── test-db.mjs            # Tests direct PostgreSQL driver connectivity
│   ├── test-prisma.mjs        # Tests Prisma queries and transactions
│   └── wsl-docker.mjs         # Helper script for Docker PostgreSQL container management
├── src/
│   ├── app/
│   │   ├── admin/page.tsx     # Founder control tower & webhook simulator
│   │   ├── api/
│   │   │   ├── alerts/        # Developer outbound webhook alert settings & ping test
│   │   │   ├── billing/       # Checkout & Customer Portal redirection routes
│   │   │   ├── health/        # Real-time latency & DB diagnostics endpoint
│   │   │   ├── keys/          # API key generation, listing, and revocation
│   │   │   ├── logs/          # Telemetry audit logs & CSV/JSON export
│   │   │   ├── openapi/       # OpenAPI 3.1 & Postman Collection generation endpoint
│   │   │   ├── v1/tool/       # Core monetized business logic endpoint
│   │   │   └── webhooks/      # Clerk, Lemon Squeezy, and Stripe webhook listeners
│   │   ├── dashboard/page.tsx # Customer console: keys, logs, sandbox, alerts, SDK, embed
│   │   ├── docs/page.tsx      # Interactive API reference and SDK code snippets
│   │   ├── embed/page.tsx     # Standalone embeddable iframe widget
│   │   ├── globals.css        # Tailwind styling & dark glassmorphic themes
│   │   ├── layout.tsx         # Root layout with Clerk Auth Provider
│   │   └── page.tsx           # Public marketing landing page & pricing table
│   ├── components/
│   │   ├── InteractivePlayground.tsx # Real-time sandbox with latency tracking & presets
│   │   ├── PricingTable.tsx          # Dynamic pricing cards driven by config
│   │   ├── CodeSnippet.tsx           # Multi-language copyable snippets & SDK downloader
│   │   ├── Navbar.tsx                # Adaptive navigation with session detection
│   │   └── Footer.tsx                # Global footer
│   ├── lib/
│   │   ├── alerts/                   # Outbound Slack, Discord, and Webhook dispatcher
│   │   ├── auth/clerk.ts             # Clerk authentication session helpers
│   │   ├── db/index.ts               # Direct PostgreSQL singleton connection pool
│   │   ├── payments/                 # Lemon Squeezy, Stripe, and Unified billing
│   │   ├── prisma.ts                 # Prisma Client singleton
│   │   └── supabase/service.ts       # Unified data access layer & mock fallbacks
│   └── tool-engine/
│       ├── index.ts                  # Drop-in business logic function & preset selector
│       ├── presets/                  # 5 ready-to-run developer tool archetypes
│       └── wrapper.ts                # Middleware: auth, plan check, rate limit, credits, alerts
│       ├── index.ts                  # Drop-in business logic function
│       └── wrapper.ts                # Middleware: auth, plan check, rate limit, credits
├── docker-compose.yml         # Local Docker PostgreSQL 16 service
├── monetize.config.ts         # Central configuration for pricing, branding, and schema
├── package.json               # Dependencies and execution scripts
├── README.md                  # Quickstart and overview readme
└── tsconfig.json              # TypeScript configuration
```

---

## 6. How It Works Step-by-Step (Operational Walkthrough)

### Scenario: An external developer calls your API via cURL
1. **Request Submission**:
   ```bash
   curl -X POST https://yourdomain.com/api/v1/tool/execute \
     -H "Authorization: Bearer sk_live_98ab71c2..." \
     -H "Content-Type: application/json" \
     -d '{"prompt": "SELECT * FROM users;"}'
   ```
2. **Authentication Verification**:
   - [`src/tool-engine/wrapper.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/wrapper.ts) extracts the Bearer token.
   - It computes the SHA-256 hash of the token and checks the `api_keys` table.
   - If invalid or revoked, it returns `HTTP 401 Unauthorized`.
3. **Plan & Rate Limiting**:
   - The wrapper looks up the user's subscription (`Pro` tier = 60 requests/min).
   - An in-memory sliding-window counter checks current throughput. If exceeded, returns `HTTP 429 Too Many Requests`.
4. **Pre-flight Credit Balance Check**:
   - The user's balance is verified against the operation's default cost. If insufficient, returns `HTTP 402 Payment Required`.
5. **Logic Execution**:
   - The engine forwards the payload to `executeToolLogic(input, context)` in [`src/tool-engine/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/index.ts).
   - The business logic executes and calculates dynamic credit costs if applicable.
6. **Atomic Settlement & Response**:
   - The credit balance is decremented using an atomic stored procedure with row-level locks.
   - An execution audit record is inserted into `usage_logs`.
   - The result is returned with custom developer response headers (`X-Credits-Used`, `X-Credits-Remaining`, `X-Execution-Time-Ms`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`).

---

## 7. Developer Onboarding: From 0 to First Dollar

### Step 1: Install & Initialize Environment
```bash
git clone <your-repo-url>
cd tct-monetize
bun install
bun run setup
```

### Step 2: Choose Your Database
- **For instant local development (SQLite - Zero Dependencies)**:
  ```bash
  bun run db:push
  bun run db:seed
  ```
- **For production PostgreSQL (Neon Serverless)**:
  ```bash
  bun run db:switch neon
  # Add your Neon connection string in .env.local
  bun run db:push
  bun run db:seed
  ```

### Step 3: Configure Your Brand and Pricing
Edit [`monetize.config.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/monetize.config.ts) to match your tool's name, description, plan pricing, credit limits, and input schema.

### Step 4: Drop In Your Logic
Open [`src/tool-engine/index.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/src/tool-engine/index.ts) and insert your custom TypeScript or Python logic.

### Step 5: Test & Verify
Start the local Next.js server with Bun:
```bash
bun run dev
```
- Open `http://localhost:3000` to test the landing page and sandbox.
- Open `http://localhost:3000/dashboard` to test API key creation.
- Open `http://localhost:3000/admin` to simulate webhook events.
- Run `bun run doctor` for automated diagnostics.

### Step 6: Deploy to Production
Deploy to Vercel with Neon Serverless PostgreSQL:
```bash
vercel deploy --prod
```
Add your production environment variables (`DATABASE_URL`, Clerk keys, and Lemon Squeezy / Stripe secrets) in your Vercel project settings.

---

## 8. Summary of Benefits & Real-World Use Cases

### Ideal Use Cases
1. **AI Agents & Prompt Engineering Micro-SaaS**:
   - Wrap proprietary Claude, OpenAI, or DeepSeek prompt chains behind paid subscriptions and per-call token credits.
2. **Developer & DevOps Utilities**:
   - SQL query optimizers, AST code refactoring engines, container vulnerability scanners, OpenAPI-to-SDK generators.
3. **Data Extraction & Enrichment APIs**:
   - Web scrapers, screenshot engines, email validators, domain WHOIS & DNS analyzers.
4. **Media & Document Generation**:
   - Programmatic PDF generation, dynamic OpenGraph image generators, audio transcription APIs.

### Conclusion
This project bridges the gap between **"having working code"** and **"running a profitable software business"**. By packaging auth, billing, credits, rate limits, and documentation into a reusable wrapper, developers can test product-market fit, launch commercial developer tools, and collect their first subscription revenue in minutes rather than weeks.
