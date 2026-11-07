"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Terminal,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  DollarSign,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Key,
} from "lucide-react";
import { HeroPipelineStudio } from "@/components/HeroPipelineStudio";

export function HeroSection() {
  const [copiedCli, setCopiedCli] = useState(false);
  const cliCommand = "npx devtool-monetize@latest init my-tool";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-24 border-b border-white/[0.06]">
      {/* Ambient Radial Lights - Expansive for Widescreen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[550px] glow-blue pointer-events-none opacity-80" />
      <div className="absolute top-1/4 right-5 w-[600px] h-[600px] glow-cyan pointer-events-none opacity-60" />
      <div className="absolute top-1/3 left-5 w-[600px] h-[600px] glow-purple pointer-events-none opacity-50" />

      {/* Full-width Responsive Container */}
      <div className="relative mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
        {/* Top telemetry pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10 pb-4 border-b border-white/[0.05]">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Sparkles className="h-4 w-4" />
            <span>The Turnkey Developer Monetization Engine</span>
            <span className="hidden sm:inline-block h-3 w-px bg-blue-400/40" />
            <span className="hidden sm:inline-block text-[11px] text-blue-300 font-mono">v1.0 Production-Ready</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">Zero-Latency Fallback</span>
            </div>
            <span className="hidden md:inline-block text-zinc-600">•</span>
            <div className="hidden md:flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Lemon Squeezy & Stripe MoR</span>
            </div>
          </div>
        </div>

        {/* Widescreen 2-Column Split: Value Pitch (Left) + Interactive Architecture Studio (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-14 items-center">
          {/* Left Column (5 Cols on 2XL, 6 on XL) */}
          <div className="xl:col-span-5 2xl:col-span-5 text-left flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Turn Your Code Into Revenue{" "}
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                In Minutes, Not Weeks
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
              Writing technical logic is the fun part. Wiring auth, billing, webhooks, credit metering, and API key management is tedious. This wrapper provides everything pre-configured so you can start charging immediately.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-7 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-current text-blue-200" />
                <span>Open Developer Console</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="#playground"
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-200 transition-all hover:bg-white/[0.08] hover:text-white backdrop-blur-xl active:scale-95 text-center cursor-pointer"
              >
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Explore Live Sandbox</span>
              </Link>

              <Link
                href="/docs"
                className="hidden sm:flex items-center justify-center gap-1.5 rounded-2xl px-4 py-4 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <span>API Reference</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick Terminal Command */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0c0e15]/80 px-4 py-3 font-mono text-xs text-zinc-300 backdrop-blur-md max-w-xl">
              <div className="flex items-center gap-2 truncate">
                <span className="text-blue-400 font-bold">$</span>
                <span className="text-zinc-400 truncate">{cliCommand}</span>
              </div>
              <button
                onClick={handleCopyCli}
                className="ml-3 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer shrink-0"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Developer Primitive Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Pre-wired:</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Clerk Auth</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Lemon Squeezy MoR</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Stripe Billing</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Prisma ACID</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Neon / SQLite</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-zinc-300">Next.js 15</span>
            </div>
          </div>

          {/* Right Column: High-Tech Live Architecture & Pipeline Studio */}
          <div className="xl:col-span-7 2xl:col-span-7 w-full">
            <HeroPipelineStudio />
          </div>
        </div>

        {/* Full-Width Bento Metric Deck (4 Cards) */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1 */}
          <div className="group rounded-2xl border border-white/[0.08] bg-[#0c0e15]/80 p-5 sm:p-6 backdrop-blur-xl hover:border-emerald-500/30 hover:bg-[#10131e] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300 transition">Lean Stack Cost</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-3">$85–200/mo</div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">vs $5,000/mo</span>
              <span>traditional agency stack</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-500">
              Vercel + Neon + Clerk free tier friendly
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-white/[0.08] bg-[#0c0e15]/80 p-5 sm:p-6 backdrop-blur-xl hover:border-blue-500/30 hover:bg-[#10131e] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300 transition">Time to Market</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-3">5–7 Days</div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-blue-400 font-semibold">3+ weeks saved</span>
              <span>on plumbing & billing</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-500">
              From initial clone to first paying user
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-white/[0.08] bg-[#0c0e15]/80 p-5 sm:p-6 backdrop-blur-xl hover:border-purple-500/30 hover:bg-[#10131e] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300 transition">Merchant of Record</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Globe className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-3">100% Legal</div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-purple-400 font-semibold">Global Sales Tax</span>
              <span>& EU VAT handled</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-500">
              135+ countries supported out of the box
            </div>
          </div>

          {/* Card 4 */}
          <div className="group rounded-2xl border border-white/[0.08] bg-[#0c0e15]/80 p-5 sm:p-6 backdrop-blur-xl hover:border-amber-500/30 hover:bg-[#10131e] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300 transition">Developer Simplicity</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-3">1 Entry Point</div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="text-amber-400 font-semibold">Zero boilerplate</span>
              <span>to maintain</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-500">
              Edit <code className="text-zinc-300 font-bold">src/tool-engine/index.ts</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
