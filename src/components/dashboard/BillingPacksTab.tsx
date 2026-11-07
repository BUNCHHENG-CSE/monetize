"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Coins,
  Zap,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";
import { AccountInfo } from "./types";

interface BillingPacksTabProps {
  account: AccountInfo | null;
  creditsBalance: number;
  onCreditsAdded: (added: number) => void;
  onOpenPortal: () => void;
  portalLoading: boolean;
}

export function BillingPacksTab({
  account,
  creditsBalance,
  onCreditsAdded,
  onOpenPortal,
  portalLoading,
}: BillingPacksTabProps) {
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  const sub = account?.subscription;
  const planDetails = account?.planDetails;

  return (
    <div className="space-y-6">
      {/* Subscription Summary Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Active Subscription & Plan
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {planDetails?.name || "Pro Developer"} Tier{" "}
              <span className="text-sm font-mono text-zinc-400">
                (${planDetails?.price ?? 29}
                {planDetails?.interval === "one-time" ? " one-time" : `/${planDetails?.interval ?? "month"}`})
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Status: {sub?.status || "active"}
              </span>
              {sub?.currentPeriodEnd && planDetails?.interval !== "one-time" && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  {sub.cancelAtPeriodEnd ? "Cancels on " : "Renews on "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
              {planDetails?.interval === "one-time" && (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Zap className="h-3.5 w-3.5" />
                  Perpetual License (Lifetime)
                </span>
              )}
              <span>
                Quota: {(planDetails?.creditsPerMonth ?? 2500).toLocaleString()}{" "}
                {planDetails?.interval === "one-time" ? "credits / mo (lifetime renewal)" : "credits/mo"} •{" "}
                {planDetails?.rateLimitPerMin ?? 60} req/min
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/#pricing"
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition"
            >
              <span>Change / Switch Plan</span>
            </Link>

            <button
              onClick={onOpenPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition"
            >
              <CreditCard className="h-4 w-4 text-blue-400" />
              <span>{portalLoading ? "Opening..." : "Customer Billing Portal"}</span>
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Credit Top-Up Bundles */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Refill Balance On Demand (Current: {creditsBalance.toLocaleString()} cr)
            </span>
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight">
            One-Time Credit Top-Up Bundles & Auto-Recharge
          </h4>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Need a burst of execution credits for large data pipelines or traffic spikes? Top up credits instantly without changing your monthly subscription tier.
          </p>

          {/* Auto-recharge toggle */}
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-current" />
                <span>Automatic Balance Recharge (Zero Downtime)</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Automatically purchase a 500-credit pack when balance falls below 50 credits to prevent API HTTP 402 outages.
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoRechargeEnabled}
                onChange={(e) => setAutoRechargeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {monetizeConfig.creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-white/[0.15] hover:bg-white/[0.04] transition flex flex-col justify-between"
              >
                <div>
                  <div className="text-base font-bold text-white">{pack.name}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {pack.credits.toLocaleString()} Tool Invocations
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-4 font-mono">
                    ${pack.price}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                    ~${(pack.price / pack.credits).toFixed(3)} per execution
                  </div>
                </div>

                <button
                  disabled={buyingPackId === pack.id}
                  onClick={async () => {
                    setBuyingPackId(pack.id);
                    try {
                      const res = await fetch("/api/billing/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ planId: pack.id }),
                      });
                      const data = await res.json();
                      if (data.checkoutUrl) {
                        window.location.href = data.checkoutUrl;
                      } else {
                        onCreditsAdded(pack.credits);
                      }
                    } finally {
                      setBuyingPackId(null);
                    }
                  }}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
                >
                  {buyingPackId === pack.id ? "Processing..." : "Buy Pack Now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
