import Link from "next/link";
import {
  Terminal,
  Zap,
  Shield,
  CreditCard,
  Key,
  Database,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InteractivePlayground } from "@/components/InteractivePlayground";
import { PricingTable } from "@/components/PricingTable";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 glow-blue pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            <span>The 2026 Developer Monetization Blueprint</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight sm:leading-none">
            Turn Code Into Revenue{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              In Minutes, Not Weeks
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Writing code is no longer the bottleneck. Charging for it is.
            This turnkey wrapper provides pre-wired <strong className="text-zinc-200">Clerk Auth</strong>,{" "}
            <strong className="text-zinc-200">Lemon Squeezy MoR & Stripe Payments</strong>,{" "}
            <strong className="text-zinc-200">Supabase Credit Metering</strong>, and{" "}
            <strong className="text-zinc-200">API Key Issuance</strong>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 hover:shadow-blue-500/35 active:scale-95"
            >
              <Zap className="h-4 w-4" />
              <span>Open Developer Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="#playground"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <Terminal className="h-4 w-4" />
              <span>Try Live Playground</span>
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-zinc-800/80 pt-10 text-left">
            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
              <div className="text-2xl font-bold text-emerald-400">$85–200/mo</div>
              <div className="text-xs text-zinc-400 mt-1">Stack Cost vs $5,000/mo Agency</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
              <div className="text-2xl font-bold text-blue-400">5–7 Days</div>
              <div className="text-xs text-zinc-400 mt-1">MVP Launch to First Paying User</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
              <div className="text-2xl font-bold text-purple-400">Merchant of Record</div>
              <div className="text-xs text-zinc-400 mt-1">Global VAT & Tax Compliance Solved</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
              <div className="text-2xl font-bold text-amber-400">1 File Logic</div>
              <div className="text-xs text-zinc-400 mt-1">Drop code into <code className="text-zinc-200">src/tool-engine/</code></div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Playground Section */}
      <section id="playground" className="py-12 bg-zinc-950/60 border-y border-zinc-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Test The Live Tool Engine
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Every request is authenticated, credit-metered, and rate-limited. Experience how your end-users will interact with your tool.
            </p>
          </div>

          <InteractivePlayground />
        </div>
      </section>

      {/* The 3-Step Developer Workflow */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How You Ship In Under 1 Hour
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Forget writing authentication flows, webhook listeners, or database migrations from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6">
                  <Terminal className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Step 01
                </div>
                <h3 className="text-xl font-bold text-white">Drop in Your Logic</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Open <code className="text-xs text-blue-300 bg-zinc-800 px-1 py-0.5 rounded">src/tool-engine/index.ts</code> and export your TypeScript or Python function. It receives validated inputs and context automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                <code>export async function executeToolLogic()</code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Step 02
                </div>
                <h3 className="text-xl font-bold text-white">Configure Your Prices</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Edit <code className="text-xs text-emerald-300 bg-zinc-800 px-1 py-0.5 rounded">monetize.config.ts</code> to define your tiers, monthly credits, and rate limits. The pricing table & webhooks update automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                <code>monetizeConfig.plans = [...]</code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
                  Step 03
                </div>
                <h3 className="text-xl font-bold text-white">Deploy & Monetize</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Push to GitHub and connect to Vercel. Run <code className="text-xs text-purple-300 bg-zinc-800 px-1 py-0.5 rounded">npm run setup</code> to test webhooks and start accepting global payments.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                <code>vercel deploy --prod</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Integration Section */}
      <section className="py-16 bg-zinc-950/80 border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
                <Key className="h-3.5 w-3.5" />
                <span>Developer-First API</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
                Ready for CLI, SDK, and Web Clients
              </h2>
              <p className="mt-4 text-base text-zinc-400 leading-relaxed">
                Developer tools thrive on programmatic access. Your users can generate <code className="text-blue-400 bg-zinc-900 px-1.5 py-0.5 rounded">sk_live_...</code> API keys directly from their dashboard and invoke your tool from terminal scripts, GitHub Actions, or microservices.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Atomic credit deduction per API call in Supabase</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Sliding-window rate limiting per minute</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Auto-generated documentation with live code snippets</span>
                </div>
              </div>
            </div>

            <div>
              <CodeSnippet />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingTable />

      {/* FAQ Section */}
      <section className="py-16 border-t border-zinc-800 bg-zinc-950/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h4 className="text-base font-bold text-white">Why Lemon Squeezy over raw Stripe?</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Lemon Squeezy acts as the <strong>Merchant of Record</strong> (MoR). They handle global sales tax, EU VAT, compliance, and currency conversions so you don’t have to register tax entities across 50 countries. Stripe direct is also supported if you prefer direct payouts.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h4 className="text-base font-bold text-white">How does credit metering work?</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Credits are tracked in Supabase with an atomic PostgreSQL stored procedure (<code className="text-blue-400">deduct_credits</code>) that locks the row to eliminate race conditions. When balance drops below the execution cost, a clean HTTP 402 with top-up link is returned.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h4 className="text-base font-bold text-white">Can I test locally without third-party API keys?</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Yes! The wrapper includes an automatic mock fallback store. You can run <code className="text-zinc-200">npm run dev</code> right away to preview the dashboard, test API keys, and run the playground without creating Clerk or Supabase accounts first.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h4 className="text-base font-bold text-white">What can I build with this?</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Any developer tool: SQL optimizers, AI agent wrappers, web scrapers, AST transformers, image/PDF converters, SEO auditors, or code generation APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
