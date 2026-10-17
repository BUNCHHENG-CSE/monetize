"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  CreditCard,
  Zap,
  Clock,
  Trash2,
  Copy,
  Check,
  Plus,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Activity,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InteractivePlayground } from "@/components/InteractivePlayground";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface UsageLogItem {
  id: string;
  endpoint: string;
  credits_deducted: number;
  duration_ms: number;
  status_code: number;
  created_at: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "playground" | "logs" | "sdk">("keys");
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [creditsBalance, setCreditsBalance] = useState<number>(1420);
  const [userPlan, setUserPlan] = useState<string>("pro");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Key Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Billing portal loading state
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch keys
      const keysRes = await fetch("/api/keys");
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData.keys || []);
      }

      // 2. Mock usage logs for simulation
      setLogs([
        {
          id: "log_1",
          endpoint: "/api/v1/tool/execute",
          credits_deducted: 1,
          duration_ms: 38,
          status_code: 200,
          created_at: new Date(Date.now() - 12 * 60000).toISOString(),
        },
        {
          id: "log_2",
          endpoint: "/api/v1/tool/execute",
          credits_deducted: 1,
          duration_ms: 54,
          status_code: 200,
          created_at: new Date(Date.now() - 84 * 60000).toISOString(),
        },
        {
          id: "log_3",
          endpoint: "/api/v1/tool/execute",
          credits_deducted: 1,
          duration_ms: 41,
          status_code: 200,
          created_at: new Date(Date.now() - 240 * 60000).toISOString(),
        },
      ]);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        setKeys((prev) => [data.key, ...prev]);
        setNewKeyName("");
      } else {
        alert(data.message || data.error || "Failed to create key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
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
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        alert(data.message || data.error || "Billing portal is in simulation mode.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlanConfig =
    monetizeConfig.plans.find((p) => p.id === userPlan) || monetizeConfig.plans[1];

  const primaryApiKey = keys[0]?.key_prefix ? `sk_live_your_active_key` : "sk_live_demo88f29910a7b4c";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col bg-grid-pattern">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top User & Subscription Banner */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xl">
                  JD
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Developer Workspace</h1>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {currentPlanConfig.name} Plan
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    demo@developer.local • ID: <code className="text-zinc-300">user_demo_123</code>
                  </p>
                </div>
              </div>

              {/* Actions & Portal */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
                >
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <span>{portalLoading ? "Loading..." : "Manage Billing & Invoices"}</span>
                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                </button>

                <Link
                  href="/#pricing"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Change Plan</span>
                </Link>
              </div>
            </div>

            {/* Credit Meter & Usage Metric */}
            <div className="mt-8 border-t border-zinc-800/80 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Monthly Credit Balance
                  </span>
                  <span className="font-mono text-white font-bold">
                    {creditsBalance.toLocaleString()} / {currentPlanConfig.creditsPerMonth.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    style={{
                      width: `${Math.min(100, (creditsBalance / currentPlanConfig.creditsPerMonth) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Rate Limit</div>
                <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-blue-400" />
                  {currentPlanConfig.rateLimitPerMin} req / minute
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Active Payment Provider</div>
                <div className="text-base font-bold text-white capitalize flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  {monetizeConfig.providers.payments}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 mb-6">
            <button
              onClick={() => setActiveTab("keys")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "keys"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Key className="h-4 w-4" />
              <span>API Keys ({keys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("playground")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "playground"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>In-Dashboard Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "logs"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Execution Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("sdk")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "sdk"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>SDK Quickstart</span>
            </button>
          </div>

          {/* TAB 1: API KEYS */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Secret API Keys</h2>
                  <p className="text-xs text-zinc-400">
                    Use these keys to authenticate CLI scripts, automated bots, or HTTP requests.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setCreatedRawKey(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New API Key</span>
                </button>
              </div>

              {/* Keys Table */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Key Prefix</th>
                      <th className="py-3 px-4">Requests</th>
                      <th className="py-3 px-4">Last Used</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {keys.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No active API keys found. Create one above to start making programmatic requests.
                        </td>
                      </tr>
                    ) : (
                      keys.map((k) => (
                        <tr key={k.id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">{k.name}</td>
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            <span className="rounded bg-zinc-800 px-2 py-0.5 border border-zinc-700/60">
                              {k.key_prefix}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {k.requests_count.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400">
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400">
                            {new Date(k.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              className="text-zinc-500 hover:text-red-400 transition p-1"
                              title="Revoke Key"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYGROUND */}
          {activeTab === "playground" && (
            <div className="space-y-4">
              <InteractivePlayground />
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === "logs" && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Tool Execution Audit Logs</h3>
                  <p className="text-xs text-zinc-400">Recorded for billing audits and rate tracking.</p>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-mono text-zinc-200">{log.endpoint}</td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
                          {log.status_code} OK
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">-{log.credits_deducted}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{log.duration_ms}ms</td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: SDK QUICKSTART */}
          {activeTab === "sdk" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Integrate Into Your Code</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Copy and paste ready-to-run snippets pre-configured with your API endpoint.
                </p>
              </div>
              <CodeSnippet apiKey={primaryApiKey} />
            </div>
          )}
        </div>
      </main>

      {/* CREATE API KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Create New API Key</h3>

            {!createdRawKey ? (
              <>
                <p className="text-xs text-zinc-400 mb-4">
                  Give your API key a descriptive label to recognize which script or service uses it.
                </p>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Key Label</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production CI/CD Pipeline"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={isCreatingKey || !newKeyName.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    {isCreatingKey ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 mb-4 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Copy this key now! For security reasons, you will never be able to see it again.
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto">
                  <span>{createdRawKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs rounded bg-zinc-800 px-2 py-1 text-zinc-200 hover:text-white"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
