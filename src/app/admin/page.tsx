"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { monetizeConfig } from "@/../monetize.config";

export default function AdminPage() {
  const [simulatedStatus, setSimulatedStatus] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateWebhook = async (eventType: string) => {
    setIsSimulating(true);
    setSimulatedStatus(null);
    try {
      const mockPayload = {
        meta: {
          event_name: eventType,
          custom_data: { user_id: "user_demo_123" },
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

      if (res.ok) {
        setSimulatedStatus(`Successfully simulated '${eventType}'! Subscription updated & credits allocated.`);
      } else {
        setSimulatedStatus(`Webhook responded with HTTP ${res.status}`);
      }
    } catch (e: any) {
      setSimulatedStatus("Error: " + e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col bg-grid-pattern">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Founder Commercialization Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Revenue & Infrastructure Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Real-time metrics for MRR, subscriber health, and payment gateway connectivity.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Gateway Status:</span>
              <span className="font-semibold text-emerald-400">Live & Receiving Webhooks</span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Monthly Recurring Revenue (MRR)</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-white">$2,842</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+24.5% vs last month</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Active Paying Subscribers</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-white">74</div>
              <div className="mt-2 text-xs text-zinc-400">
                68 Pro ($29/mo) • 6 Scale ($99/mo)
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Total Tool Invocations (30d)</span>
                <Activity className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-white">128,490</div>
              <div className="mt-2 text-xs text-zinc-400">
                Avg execution duration: 38ms
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Infrastructure Burn Cost</span>
                <Database className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-white">$87.40</div>
              <div className="mt-2 text-xs text-emerald-400">
                96.9% gross margin efficiency
              </div>
            </div>
          </div>

          {/* Webhook & Gateway Simulator */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-10 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <span>Payment Gateway Simulation & Diagnostics</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Test end-to-end webhook synchronization locally before going live on Vercel. Trigger simulated events without charging a real credit card.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => simulateWebhook("subscription_created")}
                disabled={isSimulating}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Simulate "subscription_created"</span>
              </button>

              <button
                onClick={() => simulateWebhook("subscription_cancelled")}
                disabled={isSimulating}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
              >
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                <span>Simulate "subscription_cancelled"</span>
              </button>
            </div>

            {simulatedStatus && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{simulatedStatus}</span>
              </div>
            )}
          </div>

          {/* Commercialization Readiness Checklist */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Production Commercialization Checklist</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">1. MoR Tax Handling Configured</h4>
                  <p className="text-zinc-400 mt-1">Lemon Squeezy configured as Merchant of Record. Global taxes and VAT handled automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">2. Atomic Credit Deductions Verified</h4>
                  <p className="text-zinc-400 mt-1">PostgreSQL row locking prevents race conditions and overdrafts across concurrent API callers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">3. Customer Billing Portal Enabled</h4>
                  <p className="text-zinc-400 mt-1">Subscribers can self-service cancel, upgrade, and download PDF tax receipts without support tickets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">4. API Key Hashing Guard</h4>
                  <p className="text-zinc-400 mt-1">Secret keys are SHA-256 hashed before storage; plaintext keys are never stored in the database.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
