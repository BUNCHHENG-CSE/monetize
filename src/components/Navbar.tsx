"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Shield, Zap, Sparkles, BookOpen, Layers } from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Features", href: "/#features" },
    { label: "Playground", href: "/#playground" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Admin", href: "/admin" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-base text-sm">
                {monetizeConfig.tool.name}
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                {monetizeConfig.tool.badge}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Payments + Auth + Hosting Wrapper
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA / Auth */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98]"
          >
            <Zap className="h-4 w-4" />
            <span>Developer Console</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
