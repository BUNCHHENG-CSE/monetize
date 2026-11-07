"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  CreditCard,
  Zap,
  Key,
  Copy,
  Check,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Coins,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { monetizeConfig } from "@/../monetize.config";

export default function AccountPage() {
  const { user, isAuthenticated, isAdmin, logout, refreshUser, isLoading } = useAuth();

  const [copiedId, setCopiedId] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/accounts/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Billing portal is simulated in local development mode.");
      }
    } catch (e) {
      alert("Billing portal is simulated in local development mode.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center rounded-3xl border border-white/[0.08] bg-[#0c0e14]/90 p-8 backdrop-blur-xl">
            <User className="h-10 w-10 text-blue-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-xs text-zinc-400 mb-6">
              You must be signed in to view and manage your developer account.
            </p>
            <Link
              href="/login?redirect=/account"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-2">
                <User className="h-3.5 w-3.5" />
                <span>Account Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Account & Developer Profile
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Manage your credentials, API billing plan, and team role.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Profile Form & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span>Profile Information</span>
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveSuccess && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Profile updated successfully!</span>
                    </div>
                  )}

                  {saveError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}

                  {/* User ID Field (Read-only with Copy) */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                      Account User ID (Unique)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-xl border border-white/[0.06] bg-zinc-950 px-3.5 py-2.5 text-xs font-mono text-zinc-300 select-all">
                        {user.id}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2.5 text-zinc-300 hover:text-white transition"
                        title="Copy User ID"
                      >
                        {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                      Primary Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3.5 py-2.5 text-xs text-zinc-400 cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                      Avatar Image URL
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-blue-600/30 border border-blue-500/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          name?.charAt(0) || user.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-xl border border-white/[0.1] bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* API & Developer Keys Shortcut */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="h-4 w-4 text-emerald-400" />
                    <span>API Credentials & SDK Distribution</span>
                  </h3>
                  <Link
                    href="/dashboard?tab=keys"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <span>Manage Keys</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Generate SHA-256 hashed secret keys to call the tool runtime from your CLI, Python script, or external SaaS platform with atomic credit metering.
                </p>
              </div>
            </div>

            {/* Right 1 Col: Plan, Role & Credits */}
            <div className="space-y-6">
              {/* Credits Balance Card */}
              <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c0e14] to-zinc-950 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                  <span>Available Balance</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {user.creditsBalance}
                  <span className="text-xs font-normal text-zinc-500 ml-1.5">credits</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Automatically deducted atomically per tool invocation.
                </p>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <Link
                    href="/dashboard?tab=billing"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-xs font-bold text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current text-blue-200" />
                    <span>Top-Up Credits</span>
                  </Link>
                </div>
              </div>

              {/* Plan Card */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-3">
                  <span>Current Subscription</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>

                <div className="text-xl font-bold text-white uppercase font-mono">
                  {user.plan} Developer
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">Status: Active</span>
                </div>

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={handleOpenBillingPortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-zinc-900 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Open Billing Portal</span>
                  </button>

                  <Link
                    href="/#pricing"
                    className="w-full block text-center py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    View All Plans & Features
                  </Link>
                </div>
              </div>

              {/* Role & Privileges */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                  <span>Access Tier</span>
                  <Shield className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-sm font-bold text-white capitalize">
                  {user.role} Permissions
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {isAdmin
                    ? "You have full administrative privileges to manage telemetry and control user accounts."
                    : "Standard developer role with access to developer APIs and dashboard."}
                </p>

                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <Link
                      href="/admin"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Launch Admin Console</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
