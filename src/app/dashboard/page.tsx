"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Key,
  CreditCard,
  Zap,
  Clock,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Activity,
  Sparkles,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Bell,
  Code2,
  Share2,
  BarChart3,
  AlertTriangle,
  User,
  LogOut,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";
import { useAuth } from "@/components/AuthProvider";
import {
  ApiKeyItem,
  UsageLogItem,
  WebhookAlertSettings,
  AccountInfo,
} from "@/components/dashboard/types";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { ApiKeysTab } from "@/components/dashboard/ApiKeysTab";
import { UsageLogsTab } from "@/components/dashboard/UsageLogsTab";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { BillingPacksTab } from "@/components/dashboard/BillingPacksTab";
import { EmbedSpecsTab } from "@/components/dashboard/EmbedSpecsTab";

const InteractivePlayground = dynamic(
  () => import("@/components/InteractivePlayground").then((m) => m.InteractivePlayground),
  {
    loading: () => (
      <div className="h-[460px] rounded-2xl border border-white/[0.08] bg-[#0c0e14]/70 animate-pulse p-6 flex items-center justify-center text-xs text-zinc-500 font-mono">
        Loading Interactive Sandbox...
      </div>
    ),
  }
);

type DashboardTabId =
  | "keys"
  | "playground"
  | "logs"
  | "alerts"
  | "sdk"
  | "embed"
  | "billing"
  | "account";

function DashboardContent() {
  const searchParams = useSearchParams();
  const { user: authUser, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTabId>("keys");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [creditsBalance, setCreditsBalance] = useState<number>(1420);
  const [userPlan, setUserPlan] = useState<string>("pro");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullBleed, setIsFullBleed] = useState(false);

  // Synchronize fullscreen state from document
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dashboard_full_bleed");
      if (stored === "true") setIsFullBleed(true);

      const handleFsChange = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
      };
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      setIsFullBleed(true);
      try {
        localStorage.setItem("dashboard_full_bleed", "true");
      } catch {}
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
      setIsFullBleed(false);
      try {
        localStorage.setItem("dashboard_full_bleed", "false");
      } catch {}
    }
  }, []);

  const toggleFullBleed = useCallback(() => {
    setIsFullBleed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("dashboard_full_bleed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const [alertSettings, setAlertSettings] = useState<WebhookAlertSettings>({
    endpointUrl: "https://httpbin.org/post",
    lowCreditThreshold: 200,
    notifyOnRateLimit: true,
    notifyOnLowCredits: true,
    format: "raw_json",
    isActive: true,
  });

  // Sync ?tab= query parameter (supports ?tab=billing or ?tab=packs, ?tab=keys, etc.)
  useEffect(() => {
    const param = searchParams?.get("tab");
    if (!param) return;
    if (param === "packs" || param === "billing") setActiveTab("billing");
    else if (
      ["keys", "playground", "logs", "alerts", "sdk", "embed", "account"].includes(param)
    ) {
      setActiveTab(param as DashboardTabId);
    }
  }, [searchParams]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [acctRes, keysRes, logsRes, alertsRes] = await Promise.all([
        fetch("/api/account").catch(() => null),
        fetch("/api/keys").catch(() => null),
        fetch("/api/logs?limit=50").catch(() => null),
        fetch("/api/alerts").catch(() => null),
      ]);

      if (acctRes?.ok) {
        const acctData = await acctRes.json();
        if (acctData.success) {
          setAccount(acctData);
          setCreditsBalance(acctData.creditsBalance ?? 1420);
          setUserPlan(acctData.plan || "pro");
        }
      }

      if (keysRes?.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData.keys || []);
      }

      if (logsRes?.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs && logsData.logs.length > 0) {
          setLogs(logsData.logs);
        }
      }

      if (alertsRes?.ok) {
        const alertData = await alertsRes.json();
        if (alertData.config) {
          setAlertSettings(alertData.config);
        }
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateKey = useCallback(
    async (name: string): Promise<{ rawKey?: string; error?: string }> => {
      try {
        const res = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (data.success && data.rawKey) {
          setKeys((prev) => [data.key, ...prev]);
          return { rawKey: data.rawKey };
        }
        const errMsg =
          typeof data.error === "object"
            ? data.error.message
            : data.message || data.error || "Failed to create key";
        return { error: errMsg };
      } catch (err: any) {
        return { error: err?.message || "Failed to create key" };
      }
    },
    []
  );

  const handleRevokeKey = useCallback(async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        alert("Failed to revoke key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }, []);

  const handleOpenPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        alert(
          data.message ||
            data.error ||
            "Billing portal simulation: Active subscription managed via Lemon Squeezy / Stripe."
        );
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const currentPlanConfig = useMemo(
    () =>
      monetizeConfig.plans.find((p) => p.id === userPlan) ||
      monetizeConfig.plans[1],
    [userPlan]
  );

  const monthlyQuota =
    account?.planDetails?.creditsPerMonth || currentPlanConfig.creditsPerMonth;
  const remainingCreditsPercent = Math.min(
    100,
    Math.round((creditsBalance / Math.max(1, monthlyQuota)) * 100)
  );
  const isLowBalance = remainingCreditsPercent <= 15 || creditsBalance < 50;

  const telemetrySummary = useMemo(() => {
    const total = logs.length;
    const okCount = logs.filter((l) => l.status_code === 200).length;
    const successRate = total > 0 ? Math.round((okCount / total) * 100) : 100;
    const avgLatency =
      total > 0
        ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms ?? 0), 0) / total)
        : 38;

    // Estimate burn rate (credits/day across recent logs, minimum 1/day)
    const creditsSpent = logs.reduce((acc, l) => acc + (l.credits_deducted ?? 0), 0);
    const estDailyBurn = Math.max(5, creditsSpent);
    const estDaysRemaining = Math.max(0, Math.round(creditsBalance / estDailyBurn));

    return { total, successRate, avgLatency, estDaysRemaining };
  }, [logs, creditsBalance]);

  const primaryApiKey = keys[0]?.key_prefix || "sk_test_demo";
  const displayEmail = account?.email || "demo@developer.local";
  const displayUserId = account?.userId || "user_demo_123";
  const initials = (account?.name || "Demo Developer")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!isLoading && !account?.email && !authUser) {
    return (
      <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center rounded-3xl border border-white/[0.08] bg-[#0c0e14]/90 p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Sign in or select a developer account to access your API keys and runtime sandbox.
            </p>
            <Link
              href="/login?redirect=/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg"
            >
              <span>Sign In to Continue</span>
              <ChevronRight className="h-3.5 w-3.5" />
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

      <main className="flex-1 py-8 sm:py-10">
        <div
          className={`mx-auto w-full transition-all duration-300 ${
            isFullBleed
              ? "max-w-none px-4 sm:px-6 lg:px-8 2xl:px-12"
              : "max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14"
          }`}
        >
          {/* Header Workspace Banner */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              {/* Profile details */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl sm:text-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {initials}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-4 ring-[#0c0e14]" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {account?.name || "Developer Workspace"}
                    </h1>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      {currentPlanConfig.name} Plan
                    </span>
                    {account?.demoMode !== false && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-mono text-amber-300 border border-amber-500/20">
                        Sandbox Mode
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                    <span>{displayEmail}</span>
                    <span className="text-zinc-600">•</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(displayUserId);
                        setCopiedUserId(true);
                        setTimeout(() => setCopiedUserId(false), 2000);
                      }}
                      className="flex items-center gap-1 hover:text-white transition font-mono"
                      title="Copy User ID"
                    >
                      <span>ID: {displayUserId}</span>
                      {copiedUserId ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-zinc-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-blue-400" />
                  )}
                  <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
                </button>

                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white active:scale-95"
                >
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <span>{portalLoading ? "Connecting..." : "Manage Billing & Tax Invoices"}</span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </button>

                <Link
                  href="/#pricing"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition hover:from-blue-500 hover:to-indigo-500 active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                  <span>Upgrade Tier</span>
                </Link>
              </div>
            </div>

            {/* 4 Telemetry Metrics Grid */}
            <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Metric 1: Credit Balance */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                      <Zap className="h-3.5 w-3.5 text-amber-400 fill-current" />
                      Available Credits
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isLowBalance ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {remainingCreditsPercent}% left
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                    {creditsBalance.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-zinc-400">
                      / {monthlyQuota.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLowBalance
                          ? "bg-gradient-to-r from-rose-500 to-amber-500"
                          : "bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400"
                      }`}
                      style={{ width: `${remainingCreditsPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">
                      ~{telemetrySummary.estDaysRemaining}d runway
                    </span>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      {isLowBalance && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                      <span>+ Top up credits</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric 2: Rate Limit */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  <span>Rate Limit Capacity</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  {account?.planDetails?.rateLimitPerMin ?? currentPlanConfig.rateLimitPerMin}{" "}
                  <span className="text-xs font-normal text-zinc-400">req / min</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Sliding window active • Failed calls free</span>
                </div>
              </div>

              {/* Metric 3: Payment Provider */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-purple-400" />
                  <span>Merchant of Record</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white capitalize">
                  {account?.subscription?.provider || monetizeConfig.providers.payments}
                </div>
                <div className="mt-3 text-xs text-zinc-400">
                  {account?.subscription?.currentPeriodEnd
                    ? `Renews ${new Date(account.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "Auto-renews next cycle • Tax receipts verified"}
                </div>
              </div>

              {/* Metric 4: Recent Invocations */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Recent Tool Calls</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  {telemetrySummary.total.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-zinc-400">logged calls</span>
                </div>
                <div className="mt-3 text-xs text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    {telemetrySummary.successRate}% success (avg {telemetrySummary.avgLatency}ms)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Onboarding Checklist */}
          <OnboardingChecklist
            keys={keys}
            logs={logs}
            alerts={alertSettings}
            userPlan={userPlan}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenNewKeyModal={() => setActiveTab("keys")}
          />

          {/* Segmented Pill Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto pb-px">
            {[
              { id: "keys", label: "Secret API Keys", icon: Key, count: keys.length },
              { id: "playground", label: "Sandbox Workbench", icon: Terminal },
              { id: "logs", label: "Telemetry & Logs", icon: BarChart3, count: logs.length },
              { id: "alerts", label: "Outbound Webhook Alerts", icon: Bell },
              { id: "sdk", label: "Client SDK Generator", icon: Code2 },
              { id: "embed", label: "Embed Widget & OpenAPI", icon: Share2 },
              { id: "billing", label: "Billing & Credit Packs", icon: Coins },
              { id: "account", label: "Account Control", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTabId)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? "border-blue-500 text-blue-400 bg-blue-500/10 font-bold"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: API KEYS */}
          {activeTab === "keys" && (
            <ApiKeysTab
              keys={keys}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
              onCreateKey={handleCreateKey}
              onRevokeKey={handleRevokeKey}
            />
          )}

          {/* TAB 2: PLAYGROUND WORKBENCH */}
          {activeTab === "playground" && (
            <div className="space-y-6">
              <InteractivePlayground />
            </div>
          )}

          {/* TAB 3: TELEMETRY & AUDIT LOGS */}
          {activeTab === "logs" && (
            <UsageLogsTab
              logs={logs}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* TAB 4: OUTBOUND WEBHOOK ALERTS */}
          {activeTab === "alerts" && (
            <AlertsTab
              alertSettings={alertSettings}
              onChange={setAlertSettings}
            />
          )}

          {/* TAB 5: SDK QUICKSTART */}
          {activeTab === "sdk" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Zero-Friction Integration
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Integrate Into Your Client Application
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Authenticate your requests using the standard{" "}
                  <code className="text-blue-300 font-mono">Authorization: Bearer &lt;key&gt;</code>{" "}
                  header. Choose your preferred language below or download the standalone client SDK.
                </p>

                <div className="mt-6">
                  <CodeSnippet apiKey={primaryApiKey} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EMBED WIDGET & OPENAPI */}
          {activeTab === "embed" && <EmbedSpecsTab />}

          {/* TAB 7: BILLING & CREDIT PACKS */}
          {activeTab === "billing" && (
            <BillingPacksTab
              account={account}
              creditsBalance={creditsBalance}
              onCreditsAdded={(added) => setCreditsBalance((prev) => prev + added)}
              onOpenPortal={handleOpenPortal}
              portalLoading={portalLoading}
            />
          )}

          {/* TAB 8: ACCOUNT CONTROL */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      <span>Developer Account & Identity</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Active session details, role permissions, and credentials control.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/account"
                      className="rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                    >
                      Full Profile Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/[0.06] bg-zinc-950 p-5 space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">Identity Details</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Account ID</span>
                        <span className="font-mono text-white select-all">{displayUserId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Email</span>
                        <span className="font-mono text-white">{displayEmail}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Display Name</span>
                        <span className="text-white">{account?.name || authUser?.name || "Developer"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Role</span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[11px] text-blue-300 uppercase">
                          {authUser?.role || (displayEmail.includes("admin") ? "admin" : "user")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-zinc-950 p-5 space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">Plan & Access</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Subscription Tier</span>
                        <span className="font-bold text-white capitalize">{currentPlanConfig.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Active API Keys</span>
                        <span className="font-mono text-emerald-400">{keys.length} keys</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.04]">
                        <span className="text-zinc-500">Credits Remaining</span>
                        <span className="font-mono font-bold text-amber-400">{creditsBalance} credits</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Admin Console</span>
                        {isAdmin ? (
                          <Link href="/admin" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                            <span>Open Admin</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-zinc-500">Standard Access</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090c] text-zinc-400 flex items-center justify-center font-mono text-xs">
          Loading Developer Workspace...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
