import Link from "next/link";
import { Terminal, Shield, Zap, Heart, Github, Twitter, ExternalLink, Sparkles } from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#06070a] py-14 text-zinc-400">
      <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">
          {/* Brand & Stack Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Terminal className="h-4 w-4" />
              </div>
              <span>{monetizeConfig.tool.name}</span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              {monetizeConfig.tool.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (99.99%)</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                v{monetizeConfig.tool.version}
              </span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Developer Product
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#playground" className="text-zinc-400 hover:text-white transition">
                  Interactive Sandbox
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-zinc-400 hover:text-white transition">
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
                  Developer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-zinc-400 hover:text-white transition">
                  API Reference & SDKs
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture / Developer Kit */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Infrastructure Kit
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/admin" className="text-zinc-400 hover:text-white transition">
                  Founder Admin Telemetry
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">Business logic: </span>
                <code className="text-xs text-blue-400 font-mono">src/tool-engine/</code>
              </li>
              <li>
                <span className="text-zinc-500">Configuration: </span>
                <code className="text-xs text-emerald-400 font-mono">monetize.config.ts</code>
              </li>
              <li>
                <span className="text-zinc-500">MoR Provider: </span>
                <span className="text-zinc-300 capitalize">{monetizeConfig.providers.payments}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} {monetizeConfig.tool.name}. Built for technical founders shipping fast.</p>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Zero-to-Revenue in 5–7 Days</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">VAT & Sales Tax Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
