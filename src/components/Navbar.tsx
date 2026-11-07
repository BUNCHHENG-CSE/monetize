"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  Zap,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Coins,
  ExternalLink,
} from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";
import { useAuth } from "@/components/AuthProvider";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, isAdmin, logout, loginAsDemo, isLoading } = useAuth();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary navigation links
  const baseNavItems = [
    { label: "Features", href: "/#features" },
    { label: "Playground", href: "/#playground" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
  ];

  // If authenticated, add Dashboard
  const navItems = isAuthenticated
    ? [...baseNavItems, { label: "Dashboard", href: "/dashboard" }]
    : baseNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 w-full max-w-[1760px] 2xl:max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14">
        
        {/* Brand (Clean, compact, no overcrowding) */}
        <Link href="/" className="group flex items-center gap-2.5 transition shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)] group-hover:border-blue-400 group-hover:scale-105 transition-all">
            <Terminal className="h-4.5 w-4.5 transition-transform group-hover:rotate-6" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#08090c]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-sm sm:text-base">
              {monetizeConfig.tool.name}
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
              v{monetizeConfig.tool.version}
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Pill */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "text-white bg-white/[0.08] shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAuthenticated && isAdmin && (
            <Link
              href="/admin"
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === "/admin"
                  ? "text-purple-300 bg-purple-500/20 font-semibold"
                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right Section: Auth State & Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Credits Pill (Clickable shortcut to top-up) */}
              <Link
                href="/dashboard?tab=billing"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/50 hover:bg-zinc-800/80 px-2.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white transition"
                title="Available credits balance - Click to top up"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-white">{user.creditsBalance}</span>
                <span className="text-[10px] text-zinc-500 hidden xl:inline">credits</span>
              </Link>

              {/* User Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800 hover:border-white/[0.15] pl-1.5 pr-2.5 py-1.5 transition text-left"
                >
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                      user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                    )}
                  </div>

                  <span className="text-xs font-medium text-white max-w-[120px] truncate">
                    {user.name || user.email.split("@")[0]}
                  </span>

                  {isAdmin && (
                    <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[9px] font-mono text-purple-300 border border-purple-500/30">
                      Admin
                    </span>
                  )}

                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#0c0e14] p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
                    {/* User info card */}
                    <div className="p-3 border-b border-white/[0.06] mb-1">
                      <div className="text-xs font-bold text-white truncate">{user.name || "Developer"}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{user.email}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-400 border border-blue-500/20 uppercase">
                          {user.plan} Plan
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition"
                    >
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Developer Dashboard</span>
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition"
                    >
                      <User className="h-4 w-4 text-emerald-400" />
                      <span>Account Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 font-semibold"
                      >
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    {/* Quick Role Switcher - Only visible for admin in sandbox mode */}
                    {isAdmin && (
                      <div className="my-1.5 pt-1.5 border-t border-white/[0.06]">
                        <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Fast Sandbox Switch
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await loginAsDemo("user");
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition"
                        >
                          <span>Switch to Developer</span>
                          <RefreshCw className="h-3 w-3 text-zinc-500" />
                        </button>
                      </div>
                    )}

                    {/* Sign Out */}
                    <div className="pt-1 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Console Action */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
              >
                <span>Console</span>
                <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition active:scale-95"
              >
                <span>Get Started</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              <span>Console</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/60 text-zinc-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0c0e14] px-4 pt-3 pb-5 space-y-2 animate-in fade-in">
          {isAuthenticated && user && (
            <div className="p-3 mb-2 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-white">{user.name || user.email}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{user.email}</div>
                </div>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  ⚡ {user.creditsBalance}
                </span>
              </div>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-zinc-300 hover:bg-white/[0.05]"
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
            );
          })}

          {isAuthenticated && isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-purple-300 bg-purple-500/10 border border-purple-500/20 font-semibold"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>Admin Control</span>
              </span>
              <ChevronRight className="h-4 w-4 text-purple-400" />
            </Link>
          )}

          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span>Account Settings</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl border border-white/[0.1] bg-zinc-900 text-xs font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
