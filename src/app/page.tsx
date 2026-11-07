import Link from "next/link";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
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
  Globe,
  Code2,
  Lock,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { PricingTable } from "@/components/PricingTable";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${monetizeConfig.tool.name} — ${monetizeConfig.tool.tagline}`,
  description: monetizeConfig.tool.description,
};

const InteractivePlayground = dynamic(
  () => import("@/components/InteractivePlayground").then((m) => m.InteractivePlayground),
  {
    loading: () => (
      <div className="h-[480px] rounded-2xl border border-white/[0.08] bg-[#0c0e14]/70 animate-pulse p-6 flex items-center justify-center text-xs text-zinc-500 font-mono">
        Loading Interactive Sandbox...
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Interactive Sandbox Section */}
      <section id="playground" className="py-20 border-y border-white/[0.08] bg-[#0a0b10]/80 relative">
        <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
              <Terminal className="h-3.5 w-3.5" />
              <span>Test The Live Endpoint</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test The Live Execution Engine
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400">
              Each execution is authenticated, credit-metered, and rate-protected. Experience exactly how your end-users will interact with your tool.
            </p>
          </div>

          <InteractivePlayground />
        </div>
      </section>

      {/* 3-Step Architecture Pipeline */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-3">
              <Layers className="h-3.5 w-3.5" />
              <span>Architected for Speed</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How You Ship In Under 1 Hour
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Everything complex has been pre-implemented. Simply drop in your logic, configure pricing, and deploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-7 sm:p-8 flex flex-col justify-between hover:border-blue-500/40 hover:bg-[#10131e] transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6 group-hover:scale-105 transition-transform">
                  <Code2 className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Step 01
                </div>
                <h3 className="text-xl font-bold text-white">Drop in Your Logic</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Open <code className="text-xs text-blue-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/[0.06]">src/tool-engine/index.ts</code> and export your TypeScript or Python function. It receives validated inputs and context automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
                <code>export async function executeToolLogic()</code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-7 sm:p-8 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-[#10131e] transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 group-hover:scale-105 transition-transform">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Step 02
                </div>
                <h3 className="text-xl font-bold text-white">Configure Your Prices</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Edit <code className="text-xs text-emerald-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/[0.06]">monetize.config.ts</code> to define your tiers, monthly credits, and rate limits. The pricing table & webhooks update automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
                <code>monetizeConfig.plans = [...]</code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-7 sm:p-8 flex flex-col justify-between hover:border-purple-500/40 hover:bg-[#10131e] transition-all">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6 group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-2">
                  Step 03
                </div>
                <h3 className="text-xl font-bold text-white">Deploy & Monetize</h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  Push to GitHub and connect to Vercel. Run <code className="text-xs text-purple-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/[0.06]">npm run setup</code> to test webhooks and start accepting global payments.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
                <code>vercel deploy --prod</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer API & Integration Showcase */}
      <section className="py-20 border-t border-white/[0.08] bg-[#0a0b10]/60">
        <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
                <Key className="h-3.5 w-3.5" />
                <span>Multi-Language SDK & CLI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Developer-First API & Programmable Access
              </h2>
              <p className="mt-4 text-base text-zinc-400 leading-relaxed">
                Developer tools succeed because they can be invoked programmatically. Your subscribers generate <code className="text-blue-400 bg-zinc-900 px-1.5 py-0.5 rounded">sk_live_...</code> keys directly from their dashboard and embed your tool into CI/CD pipelines, cron jobs, and microservices.
              </p>

              <div className="mt-8 space-y-3.5 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Atomic credit deduction per API call via Prisma ACID transactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Sliding-window rate limiting per minute</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>SHA-256 hashed secret keys for zero-plaintext storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Auto-generated documentation with ready-to-run snippets</span>
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
      <section className="py-20 border-t border-white/[0.08] bg-[#0c0e14]/50">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-zinc-400 mb-3">
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>Answers to Common Questions</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0f1118] p-6 hover:border-white/[0.12] transition">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Why Lemon Squeezy over direct Stripe?
              </h4>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Lemon Squeezy acts as the <strong>Merchant of Record</strong> (MoR). They handle global sales tax, EU VAT, compliance, and currency conversions so you don’t have to register tax entities across 50 countries. Stripe direct is also supported if you prefer direct payouts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0f1118] p-6 hover:border-white/[0.12] transition">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                How does atomic credit metering work?
              </h4>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Credits are tracked with Prisma ORM using atomic interactive transactions. In production, it connects seamlessly to Neon serverless PostgreSQL; locally, it uses zero-dependency SQLite. When balance drops below execution cost, a clean HTTP 402 with top-up link is returned.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0f1118] p-6 hover:border-white/[0.12] transition">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Can I test locally without third-party API keys?
              </h4>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Yes! The wrapper includes local SQLite and an automatic mock fallback store. You can run <code className="text-zinc-200 font-mono">bun run dev</code> right away to preview the dashboard, test API keys, and run the playground without creating Clerk or Neon accounts first.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0f1118] p-6 hover:border-white/[0.12] transition">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                What can I build with this?
              </h4>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
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
