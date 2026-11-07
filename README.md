# TCT Monetize (`tct-monetize`) — All-in-One Wrapper for Developer Tools

> **Turn your CLI, script, or API into a metered SaaS in 5 minutes.** A full-stack starter built on **Next.js 16.4.3 App Router (Turbopack)**, **Bun**, and **Prisma ORM** (zero-dependency **SQLite** locally, **Neon Serverless PostgreSQL** in production). Pre-wired with **Clerk Auth**, **Lemon Squeezy (Merchant of Record) / Stripe Billing**, **3-Phase Atomic Credit Reservation & Refund**, and **SHA-256 Hashed API Keys**.

---

## ⚡ 60-Second Quick Start

```bash
# 1. Install dependencies (works with bun or npm)
bun install

# 2. Push Prisma schema to local SQLite (prisma/dev.db — zero Docker/external services)
bun run db:push

# 3. Seed demo developer profile, API key, and active Pro subscription
bun run db:seed

# 4. Run diagnostics & start Next.js dev server
bun run doctor
bun run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to test the interactive playground, **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** for the customer console, and **[http://localhost:3000/admin](http://localhost:3000/admin)** for founder telemetry.

---

## 🚀 Ship Your Own Tool in 3 Steps

### Step 1 — Drop in Your Business Logic (`src/tool-engine/index.ts`)
Export `executeToolLogic(input, context)` in [`src/tool-engine/index.ts`](src/tool-engine/index.ts) or select one of the 5 built-in presets:

```typescript
export async function executeToolLogic(
  input: ToolInput,
  context: ToolContext
): Promise<ToolOutput> {
  // Call your LLM, AST parser, SQL optimizer, scraper, or internal API
  return {
    success: true,
    data: { result: "Your computed output" },
    costInCredits: 1, // If execution throws or returns success: false, 0 credits are charged!
  };
}
```

### Step 2 — Configure Plans & Credit Costs (`monetize.config.ts`)
Edit [`monetize.config.ts`](monetize.config.ts) to set your tool name, pricing tiers, monthly credit quotas, per-minute sliding-window rate limits, and one-time credit packs. The landing page, dashboard, OpenAPI spec, and billing routes read from this single file.

### Step 3 — Deploy to Production
```bash
bun run check        # Runs system doctor + TypeScript typecheck
vercel deploy --prod
```

---

## 🛡️ Execution Wrapper & Billing Semantics (`src/tool-engine/wrapper.ts`)

Every call to `POST /api/v1/tool/execute` goes through a hardened pipeline in [`src/tool-engine/wrapper.ts`](src/tool-engine/wrapper.ts):

1. **Authentication (`401 unauthorized`)**: Verifies `Authorization: Bearer sk_live_...` (SHA-256 hashed lookup) or active Clerk web session.
2. **Pre-Flight Input Validation (`400 invalid_input` / `413 payload_too_large`)**: Validates JSON syntax, payload size (≤ 1 MB), preset existence (`400 unknown_preset`), and preset-specific required fields **before** touching the user's credit balance.
3. **Parallel Profile & Subscription Lookup**: Fetches user profile and active subscription concurrently via `Promise.all`.
4. **Bounded Sliding-Window Rate Limiter (`429 rate_limited`)**: Approximates a true 60-second sliding window per user with bounded memory (`MAX_TRACKED_KEYS = 10,000`) and returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.
5. **Atomic Credit Reservation & Automatic Refund**:
   - Reserves the preset's exact credit cost inside a Prisma ACID transaction (`prisma.$transaction`) **before** executing your tool.
   - If your tool throws an exception (`500 internal_error`) or returns `{ success: false }` (`422 tool_failed`), the reserved credits are **automatically refunded** and the audit log records `0` credits charged.
6. **Correlation & Telemetry Headers**: Every response includes `X-Request-Id`, `X-Credits-Used`, `X-Credits-Remaining`, and `X-Execution-Time-Ms`.

### Uniform Error Envelope (v1.1)
All `4xx` and `5xx` responses return a consistent JSON structure:
```json
{
  "success": false,
  "requestId": "req_7f83b20c19e4a12b9012",
  "error": {
    "code": "insufficient_credits",
    "message": "This request costs 2 credit(s) but your balance is 1.",
    "hint": "Buy a credit pack or upgrade your plan in the Billing tab.",
    "docsUrl": "/docs#errors"
  }
}
```

| HTTP | `error.code` | Description | Credits Charged |
| :--- | :--- | :--- | :--- |
| `400` | `invalid_input` | Missing required field, malformed JSON, or invalid field type | `0` |
| `400` | `unknown_preset` | Unrecognized `preset` key (returns `availablePresets[]`) | `0` |
| `401` | `unauthorized` | Missing, inactive, or revoked API key | `0` |
| `402` | `insufficient_credits` | Balance lower than required preset cost (includes `topUpUrl`) | `0` |
| `403` | `plan_required` | Endpoint requires a higher subscription tier | `0` |
| `413` | `payload_too_large` | Request body exceeds 1 MB | `0` |
| `422` | `tool_failed` | Tool returned `success: false` (reserved credits refunded) | `0` |
| `429` | `rate_limited` | Per-minute rate limit exceeded (includes `retryAfterSeconds`) | `0` |
| `500` | `internal_error` | Unhandled exception (reserved credits refunded) | `0` |

---

## 🧩 5 Built-In Tool Archetype Presets (`src/tool-engine/presets/`)

Query `GET /api/v1/tool/presets` or pass `{"preset": "<key>"}` in your `POST /api/v1/tool/execute` body:

| Preset Key | Archetype | Cost | Required Input Field |
| :--- | :--- | :--- | :--- |
| `sql-optimizer` | **SQL Query Optimizer & Index Advisor** | 1 credit | `prompt` or `code` |
| `ai-agent` | **AI Prompt & Structured Extractor** | 2 credits | `prompt` |
| `web-scraper` | **Web Scraper & Metadata Extractor** | 1 credit | `url` or `prompt` (`http`/`https`) |
| `code-security` | **Code Security & Secret Scanner** | 1 credit | `code` or `prompt` |
| `media-generator` | **Dynamic SVG / OpenGraph Card Generator** | 1 credit | `title` or `prompt` |

---

## 🧪 Zero-Config Sandbox / Demo Mode

You can run the entire platform locally **without** creating Clerk, Neon, Lemon Squeezy, or Stripe accounts first:
- When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is omitted or left as `pk_test_sample_clerk_key`, authentication automatically resolves to the demo developer (`user_demo_123`).
- Use `Authorization: Bearer sk_test_demo` (or `sk_live_demo88f29910a7b4c`) to test authenticated CLI / cURL requests immediately.
- If `prisma/dev.db` is not yet initialized, [`src/lib/db/service.ts`](src/lib/db/service.ts) transparently falls back to an in-memory store.

---

## 💾 Database Commands (`package.json`)

All commands work with either `bun run <script>` or `npm run <script>`:

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start Next.js 16 development server (Turbopack) on `http://localhost:3000` |
| `bun run build` | Auto-sync Prisma schema (`sqlite` vs `postgresql`) and build for production |
| `bun run check` | Run system health doctor (`scripts/doctor.mjs`) + `tsc --noEmit` |
| `bun run doctor` | Inspect runtime, `.env.local`, SQLite/Postgres status, and API routes |
| `bun run setup` | Create `.env.local` from `.env.example` (non-destructive) and print status |
| `bun run db:push` | Sync Prisma schema to active database (`prisma/dev.db` or `DATABASE_URL`) |
| `bun run db:seed` | Seed demo profile (`user_demo_123`), API key, and Pro subscription |
| `bun run db:studio` | Launch Prisma Studio visual database browser |
| `bun run db:switch sqlite` | Switch `prisma/schema.prisma` to local SQLite mode |
| `bun run db:switch neon` | Switch `prisma/schema.prisma` to Neon Serverless PostgreSQL mode |
| `bun run db:up` / `db:down` | Start / stop optional local Docker PostgreSQL container (`scripts/wsl-docker.mjs`) |

---

## ⚙️ Environment Variables Reference (`.env.example`)

Copy `.env.example` to `.env.local` (or run `bun run setup`):

| Variable | Required? | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** (defaults to `file:./dev.db`) | SQLite path (`file:./dev.db`) locally or Neon/PostgreSQL connection string in production |
| `DIRECT_URL` | Prod (Neon) | Direct non-pooled PostgreSQL URL for Prisma schema migrations |
| `NEXT_PUBLIC_APP_URL` | Optional | Base URL for billing checkout/portal return links (`http://localhost:3000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional in dev | Clerk publishable key (omit in dev to use `user_demo_123` sandbox mode) |
| `CLERK_SECRET_KEY` | Optional in dev | Clerk backend secret key |
| `CLERK_WEBHOOK_SECRET` | Optional | Svix webhook secret for `/api/webhooks/clerk` |
| `LEMONSQUEEZY_API_KEY` | Optional in dev | Lemon Squeezy Merchant of Record API key |
| `LEMONSQUEEZY_STORE_ID` | Optional in dev | Lemon Squeezy Store ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Optional | HMAC signing secret for `/api/webhooks/lemonsqueezy` |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key (when `providers.payments = "stripe"`) |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe signing secret for `/api/webhooks/stripe` |

For deep architecture diagrams, webhook testing instructions, and database schema internals, see **[DOCUMENTATION.md](DOCUMENTATION.md)**.
