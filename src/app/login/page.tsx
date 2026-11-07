"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { monetizeConfig } from "@/../monetize.config";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const planParam = searchParams.get("plan");
  const selectedPlan = planParam
    ? monetizeConfig.plans.find((p) => p.id === planParam)
    : null;

  const { login, loginAsDemo, register, user, isAuthenticated, isAdmin } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" || (pathname && pathname.includes("sign-up")) ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg("Signed in successfully! Redirecting...");
          const target = email.toLowerCase().includes("admin") ? "/admin" : redirectUrl;
          setTimeout(() => router.push(target), 400);
        } else {
          setError(res.error || "Failed to sign in. Please verify your credentials.");
        }
      } else {
        const res = await register(email, name, password);
        if (res.success) {
          setSuccessMsg("Account created successfully! Welcome aboard.");
          setTimeout(() => router.push(redirectUrl), 400);
        } else {
          setError(res.error || "Failed to create account.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: "admin" | "user") => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginAsDemo(role);
      if (res.success) {
        setSuccessMsg(`Switched to ${role === "admin" ? "Admin Founder" : "Pro Developer"}! Redirecting...`);
        const target = role === "admin" ? "/admin" : redirectUrl;
        setTimeout(() => router.push(target), 400);
      } else {
        setError(res.error || "Quick switch failed.");
      }
    } catch (err: any) {
      setError(err.message || "Quick switch failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand & Title */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)] group-hover:scale-105 transition-all">
            <Terminal className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            {monetizeConfig.tool.name}
          </span>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {mode === "signin" ? "Welcome Back" : "Create Developer Account"}
        </h1>
        <p className="text-xs text-zinc-400 mt-1.5">
          {mode === "signin"
            ? "Sign in to access API keys, manage telemetry, and launch developer tools"
            : "Get started with 150 free credits and instant API sandbox keys"}
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Already Logged In Banner */}
        {isAuthenticated && user && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.name || user.email}</span>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono text-blue-400 uppercase">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">{user.email}</div>
                </div>
              </div>
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                Go to {isAdmin ? "Admin" : "Dashboard"}
              </Link>
            </div>
          </div>
        )}

        {/* Selected Plan Callout when redirected from Pricing */}
        {selectedPlan && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Subscription Selected
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {selectedPlan.name} Tier
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedPlan.price === 0
                    ? "Free account"
                    : `$${selectedPlan.price}${selectedPlan.interval === "one-time" ? " one-time" : "/month"}`}{" "}
                  • {selectedPlan.creditsPerMonth.toLocaleString()} credits / mo
                </div>
              </div>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-1 text-xs font-semibold text-blue-300">
                Ready to Activate
              </span>
            </div>
          </div>
        )}

        {/* 1-Click Fast Sandbox Accounts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              1-Click Fast Access (No Password)
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              Instant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              disabled={loading}
              className="flex flex-col items-start p-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/50 text-left transition group active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
                <Shield className="h-3.5 w-3.5 fill-current text-purple-400" />
                <span>Admin / Founder</span>
              </div>
              <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300">
                Full telemetry & user account control
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("user")}
              disabled={loading}
              className="flex flex-col items-start p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/50 text-left transition group active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                <Zap className="h-3.5 w-3.5 fill-current text-blue-400" />
                <span>Pro Developer</span>
              </div>
              <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300">
                1,420 credits, API keys & sandbox
              </span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-[#0c0e14] px-3 text-[11px] font-mono uppercase text-zinc-500">
            Or Use Custom Credentials
          </span>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-white/[0.06] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                Full Name / Handle
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@company.com"
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono text-zinc-400">
                Password
              </label>
              {mode === "signin" && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  (Optional in local sandbox mode)
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition active:scale-95"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Console" : "Create My Account"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-blue-200" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition">
          ← Return to Home
        </Link>
        <span className="mx-2">•</span>
        <Link href="/docs" className="hover:text-zinc-300 transition">
          Developer Docs
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex items-center justify-center p-4 bg-grid-pattern selection:bg-blue-600 selection:text-white">
      <Suspense
        fallback={
          <div className="text-xs text-zinc-500 font-mono">Loading authentication...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
