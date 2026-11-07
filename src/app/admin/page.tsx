"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Database,
  CreditCard,
  Sparkles,
  Server,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Terminal,
  FileCode,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Edit3,
  Shield,
  Key,
  Coins,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  UserX,
  UserCheck,
  LogIn,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { monetizeConfig } from "@/../monetize.config";
import { useAuth } from "@/components/AuthProvider";
import { CustomSelect, SelectOption } from "@/components/ui/CustomSelect";

interface SimulationHistoryItem {
  id: string;
  eventType: string;
  status: "success" | "error";
  statusCode: number;
  message: string;
  timestamp: string;
}

interface AccountItem {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  creditsBalance: number;
  plan: string;
  subscriptionStatus: string;
  apiKeysCount: number;
  usageLogsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminTelemetryData {
  totalUsers: number;
  activeSubscribers: number;
  totalApiKeys: number;
  totalUsageLogs: number;
  totalCreditsDistributed: number;
  monthlyRecurringRevenue: number;
  databaseType: string;
}

type AdminTab = "accounts" | "simulator" | "logs" | "checklist";

export default function AdminPage() {
  const { user, isAdmin, loginAsDemo } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("accounts");
  const [telemetry, setTelemetry] = useState<AdminTelemetryData | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Account Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createPlan, setCreatePlan] = useState("pro");
  const [createCredits, setCreateCredits] = useState(500);
  const [isCreating, setIsCreating] = useState(false);

  // Quick Credit Adjustment Modal/Inline state
  const [creditModalAccount, setCreditModalAccount] = useState<AccountItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(250);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Copied Account ID
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Updating Plan Loader state
  const [updatingPlanAccountId, setUpdatingPlanAccountId] = useState<string | null>(null);

  // Formatted Dropdown Options for Plans
  const planSelectOptions: SelectOption[] = useMemo(() => {
    return monetizeConfig.plans.map((p) => {
      const badgeColor: "blue" | "purple" | "amber" | "zinc" =
        p.id === "pro"
          ? "blue"
          : p.id === "scale"
          ? "purple"
          : p.id === "lifetime"
          ? "amber"
          : "zinc";

      const dotColor =
        p.id === "pro"
          ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]"
          : p.id === "scale"
          ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]"
          : p.id === "lifetime"
          ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
          : "bg-zinc-400";

      const sublabel =
        p.price === 0
          ? "Free"
          : `$${p.price}${p.interval === "one-time" ? " once" : "/mo"}`;

      return {
        value: p.id,
        label: p.name,
        sublabel,
        badgeColor,
        dotColor,
      };
    });
  }, []);

  const planFilterOptions: SelectOption[] = useMemo(
    () => [{ value: "all", label: "All Plans" }, ...planSelectOptions],
    [planSelectOptions]
  );

  const roleFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "All Roles" },
      { value: "admin", label: "Admin", dotColor: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]", badgeColor: "purple" },
      { value: "user", label: "User", dotColor: "bg-zinc-400", badgeColor: "zinc" },
    ],
    []
  );

  const statusFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "All Statuses" },
      { value: "active", label: "Active", dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]", badgeColor: "emerald" },
      { value: "suspended", label: "Suspended", dotColor: "bg-rose-400", badgeColor: "rose" },
    ],
    []
  );

  // Webhook Simulator state (preserved)
  const [selectedEvent, setSelectedEvent] = useState<string>("subscription_created");
  const [simulatedStatus, setSimulatedStatus] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [history, setHistory] = useState<SimulationHistoryItem[]>([
    {
      id: "sim_1",
      eventType: "subscription_created",
      status: "success",
      statusCode: 200,
      message: "Pro Developer plan activated. Allocated 2,500 credits.",
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
    },
    {
      id: "sim_2",
      eventType: "order_created",
      status: "success",
      statusCode: 200,
      message: "Credit Top-Up Pack purchased: +500 credits.",
      timestamp: new Date(Date.now() - 75 * 60000).toLocaleTimeString(),
    },
  ]);

  // Fetch Telemetry & Accounts from database
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [telRes, acctRes, logsRes] = await Promise.all([
        fetch("/api/admin/telemetry", { cache: "no-store" }),
        fetch("/api/admin/accounts", { cache: "no-store" }),
        fetch("/api/admin/logs?limit=30", { cache: "no-store" }),
      ]);

      if (telRes.ok) {
        const telData = await telRes.json();
        if (telData.telemetry) setTelemetry(telData.telemetry);
      }

      if (acctRes.ok) {
        const acctData = await acctRes.json();
        if (acctData.accounts) setAccounts(acctData.accounts);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) setGlobalLogs(logsData.logs);
      }
    } catch (e: any) {
      console.warn("Error fetching admin telemetry:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, loadAdminData]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.email.toLowerCase().includes(q) ||
        (acc.name && acc.name.toLowerCase().includes(q)) ||
        acc.id.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || acc.role === roleFilter;
      const matchesPlan = planFilter === "all" || acc.plan === planFilter;
      const matchesStatus = statusFilter === "all" || acc.status === statusFilter;

      return matchesSearch && matchesRole && matchesPlan && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, planFilter, statusFilter]);

  const copyAccountId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionMessage(msg);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // 1. Adjust User Credits
  const handleAdjustCredits = async (account: AccountItem, amount: number) => {
    setIsAdjusting(true);
    try {
      const newBalance = Math.max(0, account.creditsBalance + amount);
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsBalance: newBalance }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, creditsBalance: newBalance } : a))
        );
        showNotification(
          `Updated credits for ${account.email}: ${amount > 0 ? "+" : ""}${amount} (New balance: ${newBalance})`
        );
        setCreditModalAccount(null);
      } else {
        showNotification(data.error || "Failed to update credits", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to update credits", true);
    } finally {
      setIsAdjusting(false);
    }
  };

  // 2. Change User Plan
  const handleChangePlan = async (account: AccountItem, newPlan: string) => {
    if (account.plan === newPlan) return;
    setUpdatingPlanAccountId(account.id);
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: newPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, plan: newPlan, subscriptionStatus: "active" } : a))
        );
        showNotification(`Plan for ${account.email} changed to ${newPlan.toUpperCase()}`);
      } else {
        showNotification(data.error || "Failed to change plan", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to change plan", true);
    } finally {
      setUpdatingPlanAccountId(null);
    }
  };

  // 3. Toggle Role (User <-> Admin)
  const handleToggleRole = async (account: AccountItem) => {
    const newRole = account.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, role: newRole } : a))
        );
        showNotification(`Role for ${account.email} updated to ${newRole.toUpperCase()}`);
      } else {
        showNotification(data.error || "Failed to toggle role", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to toggle role", true);
    }
  };

  // 4. Toggle Status (Active <-> Suspended)
  const handleToggleStatus = async (account: AccountItem) => {
    const newStatus = account.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, status: newStatus } : a))
        );
        showNotification(
          `Account ${account.email} is now ${newStatus === "active" ? "ACTIVATED" : "SUSPENDED"}`
        );
      } else {
        showNotification(data.error || "Failed to toggle status", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to toggle status", true);
    }
  };

  // 5. Impersonate / 1-Click Login As User
  const handleImpersonate = async (account: AccountItem) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        showNotification(data.error || "Failed to switch session", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to switch session", true);
    }
  };

  // 6. Delete Account
  const handleDeleteAccount = async (account: AccountItem) => {
    if (!confirm(`Are you sure you want to permanently delete account ${account.email}? All API keys and usage logs will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        showNotification(`Account ${account.email} deleted successfully.`);
      } else {
        showNotification(data.error || "Failed to delete account", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to delete account", true);
    }
  };

  // 7. Create New Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail,
          name: createName,
          role: createRole,
          planId: createPlan,
          creditsBalance: createCredits,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Created account for ${createEmail}!`);
        setShowCreateModal(false);
        setCreateEmail("");
        setCreateName("");
        await loadAdminData();
      } else {
        showNotification(data.error || "Failed to create account", true);
      }
    } catch (e: any) {
      showNotification(e.message || "Failed to create account", true);
    } finally {
      setIsCreating(false);
    }
  };

  // Webhook Simulator handler
  const simulateWebhook = async (eventType: string) => {
    setIsSimulating(true);
    setSimulatedStatus(null);
    try {
      const mockPayload = {
        meta: {
          event_name: eventType,
          custom_data: { user_id: accounts[0]?.id || "user_demo_123" },
        },
        data: {
          id: `sim_sub_${Date.now()}`,
          attributes: {
            customer_id: "cust_demo_8821",
            variant_id: "variant_pro_monthly",
            status: "active",
            renews_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            cancelled: false,
          },
        },
      };

      const res = await fetch("/api/webhooks/lemonsqueezy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": "simulated_local_signature",
        },
        body: JSON.stringify(mockPayload),
      });

      const newItem: SimulationHistoryItem = {
        id: `sim_${Date.now()}`,
        eventType,
        status: res.ok ? "success" : "error",
        statusCode: res.status,
        message: res.ok
          ? `Event '${eventType}' processed. Database and balance updated.`
          : `Webhook responded with HTTP ${res.status}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setHistory((prev) => [newItem, ...prev]);
      if (res.ok) {
        setSimulatedStatus(`Successfully processed '${eventType}'! Webhook verified.`);
        loadAdminData();
      } else {
        setSimulatedStatus(`Webhook responded with HTTP ${res.status}`);
      }
    } catch (e: any) {
      setSimulatedStatus("Error: " + e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 py-24 flex items-center justify-center">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-500/10">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              You do not have administrative privileges to access the Admin Control Center.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
            >
              Return to Developer Dashboard
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
        <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12">

          {/* Action Notifications */}
          {actionMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-300 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-300 flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Founder Commercialization Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Admin Control & Account Management
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Real-time user accounts, credit allocation, telemetry, and payment infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadAdminData}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
                <span>Refresh</span>
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{telemetry?.databaseType || "Prisma SQLite"}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Monthly Recurring Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-white font-mono">
                ${telemetry ? telemetry.monthlyRecurringRevenue.toLocaleString() : "2,842"}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+24.5% vs last month</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Total Registered Accounts</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {telemetry ? telemetry.totalUsers : accounts.length}
              </div>
              <div className="mt-2.5 text-xs text-zinc-400">
                {telemetry ? telemetry.activeSubscribers : 1} active paying subscribers
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Total Tool Invocations</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {telemetry ? telemetry.totalUsageLogs.toLocaleString() : "128,490"}
              </div>
              <div className="mt-2.5 text-xs text-zinc-400">
                Across {telemetry ? telemetry.totalApiKeys : 2} live API keys
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Total Credits Distributed</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {telemetry ? telemetry.totalCreditsDistributed.toLocaleString() : "11,420"}
              </div>
              <div className="mt-2.5 text-xs text-emerald-400 font-medium">
                Atomic Postgres / SQLite metering
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-white/[0.08] pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "accounts"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Accounts & Users Control</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
                {accounts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "simulator"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment & Webhook Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Global API Invocation Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "checklist"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Production Checklist</span>
            </button>
          </div>

          {/* TAB 1: ACCOUNTS CONTROL CENTER */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              {/* Filter & Action Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search accounts by email, name, or ID..."
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Role Filter */}
                  <CustomSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roleFilterOptions}
                    size="sm"
                    menuWidth={160}
                  />

                  {/* Plan Filter */}
                  <CustomSelect
                    value={planFilter}
                    onChange={setPlanFilter}
                    options={planFilterOptions}
                    size="sm"
                    menuWidth={230}
                  />

                  {/* Status Filter */}
                  <CustomSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusFilterOptions}
                    size="sm"
                    menuWidth={170}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Accounts Table */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/[0.08] bg-zinc-950/60 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Account / Developer</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4">Keys / Logs</th>
                        <th className="px-6 py-4 text-right">Quick Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono">
                            No user accounts match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-white/[0.02] transition">
                            {/* User details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 overflow-hidden shrink-0">
                                  {acc.avatarUrl ? (
                                    <img src={acc.avatarUrl} alt={acc.name || "User"} className="h-full w-full object-cover" />
                                  ) : (
                                    acc.name?.charAt(0) || acc.email.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>{acc.name || "Developer"}</span>
                                    {acc.id === user?.id && (
                                      <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-mono text-blue-300">
                                        Current You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>{acc.email}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyAccountId(acc.id)}
                                      className="text-zinc-500 hover:text-zinc-300 transition"
                                      title="Copy ID"
                                    >
                                      {copiedId === acc.id ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role Toggle */}
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleToggleRole(acc)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition border ${
                                  acc.role === "admin"
                                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                                    : "bg-zinc-900 text-zinc-300 border-white/[0.08] hover:bg-zinc-800"
                                }`}
                                title="Click to toggle Role"
                              >
                                {acc.role === "admin" ? "🛡️ Admin" : "User"}
                              </button>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(acc)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition border ${
                                  acc.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                }`}
                                title="Click to toggle Status"
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    acc.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                                  }`}
                                />
                                <span>{acc.status}</span>
                              </button>
                            </td>

                            {/* Plan Dropdown */}
                            <td className="px-6 py-4">
                              <CustomSelect
                                value={acc.plan}
                                onChange={(newPlan) => handleChangePlan(acc, newPlan)}
                                options={planSelectOptions}
                                size="sm"
                                variant="badge"
                                isLoading={updatingPlanAccountId === acc.id}
                                menuWidth={230}
                              />
                            </td>

                            {/* Balance & Adjust */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs">
                                  {acc.creditsBalance}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCreditModalAccount(acc)}
                                  className="p-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                  title="Adjust Credits"
                                >
                                  <Coins className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Keys / Logs */}
                            <td className="px-6 py-4 font-mono text-[11px] text-zinc-400">
                              <div>{acc.apiKeysCount} keys</div>
                              <div className="text-zinc-500">{acc.usageLogsCount} logs</div>
                            </td>

                            {/* Quick Controls Action Menu */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(acc)}
                                  className="p-1.5 rounded-lg border border-white/[0.06] bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                                  title="Log in / View as this user"
                                >
                                  <LogIn className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount(acc)}
                                  className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                                  title="Delete Account"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT & WEBHOOK SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    <span>Payment Gateway & Webhook Simulator</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Trigger simulated Lemon Squeezy / Stripe webhooks to verify database state updates and credit allocation without charging cards.
                  </p>
                </div>

                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/[0.06]">
                  Target: /api/webhooks/{monetizeConfig.providers.payments}
                </span>
              </div>

              {/* Simulation controls */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <CustomSelect
                  value={selectedEvent}
                  onChange={setSelectedEvent}
                  options={[
                    { value: "subscription_created", label: "subscription_created", sublabel: "Stripe / Lemon", dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" },
                    { value: "subscription_updated", label: "subscription_updated", sublabel: "Stripe / Lemon", dotColor: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" },
                    { value: "subscription_cancelled", label: "subscription_cancelled", sublabel: "Stripe / Lemon", dotColor: "bg-rose-400" },
                    { value: "order_created", label: "order_created (Credit Top-up)", sublabel: "+Credits Pack", dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" },
                  ]}
                  size="md"
                  menuWidth={330}
                />

                <button
                  type="button"
                  onClick={() => simulateWebhook(selectedEvent)}
                  disabled={isSimulating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition active:scale-95"
                >
                  {isSimulating ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Dispatching Event...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current text-blue-200" />
                      <span>Dispatch Webhook Event</span>
                    </>
                  )}
                </button>
              </div>

              {simulatedStatus && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-mono text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{simulatedStatus}</span>
                </div>
              )}

              {/* Simulation History Feed */}
              <div className="mt-6 rounded-2xl border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Simulation Dispatch Audit Feed
                </div>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] text-blue-400 border border-blue-500/20">
                          {item.eventType}
                        </span>
                        <span className="text-zinc-300">{item.message}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500 font-mono text-[11px] shrink-0">
                        <span className="text-emerald-400">HTTP {item.statusCode}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL API INVOCATION LOGS */}
          {activeTab === "logs" && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span>Real-time Global Invocation Stream</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Live telemetry across all developer API keys and tool runtime executions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {globalLogs.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500">No invocation logs recorded yet.</div>
                ) : (
                  globalLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.04] bg-zinc-950/70"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                          {log.statusCode}
                        </span>
                        <span className="font-bold text-white">{log.endpoint}</span>
                        <span className="text-zinc-500 text-[11px]">{log.userEmail}</span>
                      </div>

                      <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
                        <span>⚡ {log.creditsDeducted} credit</span>
                        <span>{log.durationMs}ms</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTION CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e14]/80 p-6 sm:p-8 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Production Commercialization Checklist</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">1. MoR Tax Handling Configured</h4>
                    <p className="text-zinc-400 mt-1 leading-relaxed">
                      Lemon Squeezy configured as Merchant of Record. Global sales tax, EU VAT, and cross-border currency conversions handled automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">2. Atomic Credit Deductions Verified</h4>
                    <p className="text-zinc-400 mt-1 leading-relaxed">
                      PostgreSQL row locking prevents race conditions and overdrafts across concurrent API callers. Balance checked before tool logic runs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">3. Customer Billing Portal Enabled</h4>
                    <p className="text-zinc-400 mt-1 leading-relaxed">
                      Subscribers can self-service cancel, upgrade, switch payment methods, and download PDF tax receipts without support tickets.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">4. API Key Hashing Guard</h4>
                    <p className="text-zinc-400 mt-1 leading-relaxed">
                      Secret keys are SHA-256 hashed before storage; plaintext keys are never stored in the database.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: CREATE ACCOUNT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#0c0e14] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-400" />
                <span>Create New Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="developer@startup.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Jordan Lee"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Role</label>
                  <CustomSelect
                    value={createRole}
                    onChange={setCreateRole}
                    options={[
                      { value: "user", label: "User", dotColor: "bg-zinc-400" },
                      { value: "admin", label: "Admin", dotColor: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" },
                    ]}
                    size="md"
                    className="w-full"
                    menuWidth="100%"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Initial Plan</label>
                  <CustomSelect
                    value={createPlan}
                    onChange={setCreatePlan}
                    options={planSelectOptions}
                    size="md"
                    className="w-full"
                    menuWidth="100%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Initial Credits</label>
                <input
                  type="number"
                  value={createCredits}
                  onChange={(e) => setCreateCredits(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST CREDITS */}
      {creditModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#0c0e14] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              <span>Adjust Credit Balance</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Account: <span className="text-white font-mono">{creditModalAccount.email}</span>
              <br />
              Current balance: <span className="text-emerald-400 font-mono font-bold">{creditModalAccount.creditsBalance}</span>
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                {[+100, +500, +1000, -100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAdjustCredits(creditModalAccount, amt)}
                    disabled={isAdjusting}
                    className="flex-1 py-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-xs font-mono font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
                  >
                    {amt > 0 ? `+${amt}` : amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Custom Add / Deduct</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustCredits(creditModalAccount, adjustAmount)}
                    disabled={isAdjusting}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setCreditModalAccount(null)}
                  className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
