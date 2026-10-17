# All-in-One "Payments + Auth + Hosting" Wrapper for Developer Tools

> **Turn code into revenue in 5 minutes.** In 2026, writing code is no longer the bottleneck—turning code into a product that can take money still is. This production-ready starter kit wraps your TypeScript or Python developer tool with **Clerk Auth**, **Lemon Squeezy (MoR) / Stripe Payments**, **Supabase Credit Metering**, and **API Key Management** out of the box.

---

## 💡 The Opportunity

In 2019, launching a commercial developer SaaS required an agency or engineering team costing **$5,000/month** across weeks of sprints.

In 2026, an indie developer can replace that entire team with an **$85–200/month stack**:
- **Authentication**: Clerk (zero-maintenance modern auth & session management)
- **Payments**: Lemon Squeezy (Merchant of Record: solves global sales tax & EU VAT compliance) or Stripe
- **Database & Metering**: Supabase (PostgreSQL with atomic credit deduction stored procedures)
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
                     │  • Atomic credit balance check (Supabase RPC)          │
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

## 📦 MVP Features Included

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
9. **Zero-Setup Local Simulation Mode**:
   - Runs out of the box with `npm run dev` using an in-memory mock store before you even configure Clerk or Supabase keys!

---

## 🚀 Quickstart in 5 Minutes

### 1. Clone & Install Dependencies
```bash
git clone <your-repo>
cd devtool-monetization-wrapper
npm install
```

### 2. Run Setup Wizard
```bash
npm run setup
```

### 3. Start Development Server
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

## ⚙ Configuration (`monetize.config.ts`)

Open [`monetize.config.ts`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/monetize.config.ts) to define your pricing tiers:

```typescript
export const monetizeConfig = {
  tool: {
    name: "DevTool Monetize Engine",
    tagline: "Turn code into revenue in 5 minutes",
    badge: "v1.0 Live",
  },
  providers: {
    payments: "lemonsqueezy", // or 'stripe'
    auth: "clerk",
    database: "supabase",
  },
  plans: [
    {
      id: "free",
      name: "Hobby",
      price: 0,
      creditsPerMonth: 50,
      rateLimitPerMin: 5,
    },
    {
      id: "pro",
      name: "Pro Developer",
      price: 29,
      popular: true,
      creditsPerMonth: 2500,
      rateLimitPerMin: 60,
    },
  ],
};
```

---

## 🗄 Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of [`supabase/schema.sql`](file:///d:/Program/Developer%20Monetization%20&%20Growth/All-in-One%20Payments%20+%20Auth%20+%20Hosting%20Wrapper%20for%20Developer%20Tools/supabase/schema.sql) and click **Run**.
4. Copy your project URL and keys into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

---

## 💳 Payments Setup (Lemon Squeezy)

1. Create an account at [lemonsqueezy.com](https://lemonsqueezy.com) and create a Store.
2. Under **Products**, create subscription variants matching your plans (e.g. Pro $29/mo).
3. Copy your API Key, Store ID, and Variant IDs to `.env.local`:
   ```env
   LEMONSQUEEZY_API_KEY="your_api_key"
   LEMONSQUEEZY_STORE_ID="your_store_id"
   LEMONSQUEEZY_WEBHOOK_SECRET="your_webhook_secret"
   NEXT_PUBLIC_LEMON_PRO_VARIANT_ID="variant_123456"
   ```
4. Set Webhook URL in Lemon Squeezy settings:
   `https://yourdomain.com/api/webhooks/lemonsqueezy`
   Listening for: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `order_created`.

---

## 📋 Indie Developer Validation Script

Before spending weeks on extra features, validate with 5 indie developers who shipped code but have not yet charged:

> *"Hey [Name], loved your tool [Project]. Question: How long did it take from having a functional product to taking your first payment, and where did you get stuck the most?"*

- If they say: *"Setting up Stripe/taxes, figuring out webhooks, or gating API keys took 3 weeks"* ➔ You have immediate validation to sell this template for **$99–299 one-time** or **$29–49/month**.

---

## 🚢 Production Deployment

Deploy seamlessly to Vercel in 1 click:
```bash
vercel deploy --prod
```
Ensure your environment variables are configured in the Vercel project settings.
