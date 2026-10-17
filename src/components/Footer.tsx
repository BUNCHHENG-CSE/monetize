import Link from "next/link";
import { Terminal, Shield, Zap, Heart } from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Terminal className="h-5 w-5 text-blue-400" />
              <span>{monetizeConfig.tool.name}</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              {monetizeConfig.tool.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stack: Clerk Auth + Lemon Squeezy / Stripe + Supabase PostgreSQL</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#playground" className="hover:text-white transition">
                  Interactive Playground
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white transition">
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Developer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Developer Kit
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin" className="hover:text-white transition">
                  Founder Admin Portal
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">Drop-in file: </span>
                <code className="text-xs text-blue-400 bg-zinc-900 px-1 py-0.5 rounded">src/tool-engine/</code>
              </li>
              <li>
                <span className="text-zinc-500">Config: </span>
                <code className="text-xs text-blue-400 bg-zinc-900 px-1 py-0.5 rounded">monetize.config.ts</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} {monetizeConfig.tool.name}. Built for technical indie founders.</p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Zero-to-Revenue in 5–7 Days</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
