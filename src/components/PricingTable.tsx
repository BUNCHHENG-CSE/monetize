"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowDown,
  Shield,
  CreditCard,
  Coins,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { monetizeConfig, PlanConfig } from "@/../monetize.config";
import { useAuth } from "@/components/AuthProvider";

export function PricingTable() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<PlanConfig | null>(null);
  const [downgrading, setDowngrading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Helper to determine plan rank / tier
  const getPlanRank = (planId: string): number => {
    const idx = monetizeConfig.plans.findIndex((p) => p.id === planId);
    return idx !== -1 ? idx : 0;
  };

  const currentPlanId = user?.plan || "free";
  const currentRank = isAuthenticated ? getPlanRank(currentPlanId) : -1;
  const currentPlanConfig = monetizeConfig.plans.find((p) => p.id === currentPlanId) || monetizeConfig.plans[0];

  // Auto-trigger checkout if user was redirected back after sign up with ?checkout=<planId>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutPlanId = params.get("checkout");

    if (checkoutPlanId && isAuthenticated && user) {
      // Clear query parameter from URL
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);

      const targetPlan = monetizeConfig.plans.find((p) => p.id === checkoutPlanId);
      if (targetPlan) {
        const curRank = getPlanRank(user.plan || "free");
        const tgtRank = getPlanRank(targetPlan.id);
        if (curRank > tgtRank) {
          setDowngradeTarget(targetPlan);
        } else if (curRank < tgtRank) {
          handleCheckout(targetPlan.id);
        }
      }
    }
  }, [isAuthenticated, user]);

  const handleCheckout = async (planId: string) => {
    // 1. If not authenticated, redirect to create account
    if (!isAuthenticated) {
      const redirectTarget = planId === "free" ? "/dashboard" : `/?checkout=${planId}#pricing`;
      window.location.href = `/login?mode=signup&plan=${planId}&redirect=${encodeURIComponent(redirectTarget)}`;
      return;
    }

    // 2. Free plan for already authenticated user -> go to dashboard
    if (planId === "free") {
      window.location.href = "/dashboard";
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setFeedback({
          type: "success",
          message: data.message || "Checkout session simulated in development mode.",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Checkout notice: " + (err.message || "Failed to process checkout"),
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCreditPackCheckout = async (packId: string) => {
    if (!isAuthenticated) {
      const redirectTarget = `/?checkout=${packId}#pricing`;
      window.location.href = `/login?mode=signup&redirect=${encodeURIComponent(redirectTarget)}`;
      return;
    }

    setLoadingPlan(packId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: packId }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setFeedback({
          type: "success",
          message: data.message || "Credit pack allocated successfully.",
        });
        await refreshUser();
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Checkout notice: " + (err.message || "Failed to process pack checkout"),
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const confirmDowngrade = async () => {
    if (!downgradeTarget) return;

    setDowngrading(true);
    try {
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: downgradeTarget.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Your subscription has been successfully downgraded to ${downgradeTarget.name}.`,
        });
        await refreshUser();
        setDowngradeTarget(null);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to downgrade plan. Please try again.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Downgrade error: " + (err.message || "Network error"),
      });
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="relative mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-10 xl:px-14">
        {/* Feedback Alert Toast */}
        {feedback && (
          <div className="max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4">
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-xl ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-medium">{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 mb-4 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Developer-First Pricing Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Transparent Pricing.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Zero Hidden Fees.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            All plans include Merchant of Record global tax handling (EU VAT, US sales tax) via{" "}
            <strong className="text-zinc-200 capitalize">{monetizeConfig.providers.payments}</strong>.
          </p>

          {/* User Status Bar if logged in */}
          {isAuthenticated && user && (
            <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Signed in as <strong className="text-white">{user.name || user.email}</strong></span>
              <span className="text-zinc-500">•</span>
              <span>Active Plan: <strong className="text-blue-400 uppercase font-mono">{user.planName || user.plan}</strong></span>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-xl">
            <button
              onClick={() => setBillingCycle("month")}
              className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                billingCycle === "month"
                  ? "bg-white/[0.1] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("year")}
              className={`rounded-xl px-5 py-2 text-xs font-semibold flex items-center gap-2 transition-all ${
                billingCycle === "year"
                  ? "bg-white/[0.1] text-white shadow-sm font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 items-stretch">
          {monetizeConfig.plans.map((plan) => {
            const isPopular = plan.popular;
            const isOneTime = plan.interval === "one-time";
            const price =
              billingCycle === "year" && plan.price > 0 && !isOneTime
                ? Math.round(plan.price * 0.8)
                : plan.price;

            const targetRank = getPlanRank(plan.id);
            const isCurrentPlan = isAuthenticated && currentPlanId === plan.id;
            const isDowngrade = isAuthenticated && currentRank > targetRank;
            const isUpgrade = isAuthenticated && currentRank < targetRank;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 ${
                  isCurrentPlan
                    ? "border-2 border-emerald-500/60 bg-gradient-to-b from-[#0c1814]/90 to-[#0c0e14] shadow-[0_0_35px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30 md:-translate-y-1"
                    : isPopular
                    ? "border-2 border-blue-500/70 bg-gradient-to-b from-[#121626] to-[#0c0e16] shadow-[0_0_40px_rgba(59,130,246,0.2)] md:-translate-y-2 ring-1 ring-blue-500/30"
                    : isOneTime
                    ? "border-2 border-amber-500/50 bg-gradient-to-b from-[#1c1810]/80 to-[#0c0e14] shadow-[0_0_35px_rgba(245,158,11,0.15)] hover:border-amber-400/80 md:-translate-y-1"
                    : "border border-white/[0.08] bg-[#0c0e14]/80 hover:border-white/[0.15] hover:bg-[#10131c]"
                }`}
              >
                {/* Current Active Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 whitespace-nowrap">
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Current Active Plan</span>
                  </div>
                )}

                {!isCurrentPlan && isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/40 whitespace-nowrap">
                    Recommended for Builders
                  </div>
                )}

                {!isCurrentPlan && !isPopular && plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/40 whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-mono shrink-0 ${
                        isCurrentPlan
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                          : isOneTime
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold"
                          : "bg-white/[0.05] border-white/[0.08] text-zinc-300"
                      }`}
                    >
                      {plan.creditsPerMonth.toLocaleString()} cr / mo
                    </span>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed min-h-[44px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-1.5 pb-6 border-b border-white/[0.08]">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                      ${price}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-zinc-400">
                      {isOneTime
                        ? "/one-time payment"
                        : `/${billingCycle === "year" ? "mo billed annually" : "month"}`}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="mt-6 space-y-3.5">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check
                            className={`h-4 w-4 shrink-0 mt-0.5 ${
                              isCurrentPlan
                                ? "text-emerald-400"
                                : isOneTime
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4">
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default opacity-90 shadow-sm"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Current Plan</span>
                    </button>
                  ) : isDowngrade ? (
                    <button
                      onClick={() => setDowngradeTarget(plan)}
                      disabled={loadingPlan === plan.id || downgrading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all shadow-sm active:scale-95 group"
                    >
                      <span>Downgrade to {plan.name}</span>
                      <ArrowDown className="h-4 w-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={loadingPlan === plan.id}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 ${
                        isPopular
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                          : isOneTime
                          ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25"
                          : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.08]"
                      }`}
                    >
                      {loadingPlan === plan.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <span>
                            {!isAuthenticated
                              ? plan.price === 0
                                ? "Start Building Free"
                                : isOneTime
                                ? "Get Lifetime Access"
                                : `Subscribe to ${plan.name}`
                              : isUpgrade && currentRank > 0 && !isOneTime
                              ? `Upgrade to ${plan.name}`
                              : isOneTime
                              ? "Get Lifetime Access"
                              : `Subscribe to ${plan.name}`}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Credit Packs (One-Time Refills) */}
        <div className="mt-20 rounded-3xl border border-white/[0.08] bg-[#0c0e14]/70 p-6 sm:p-10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Coins className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Need More Execution Credits?</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                One-Time Credit Top-Up Packs
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Credits never expire. Top up anytime without altering your active subscription plan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">Instant credit balance allocation</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {monetizeConfig.creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] transition"
              >
                <div>
                  <div className="text-sm font-bold text-white">{pack.name}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {pack.credits.toLocaleString()} API Invocations
                  </div>
                  <div className="text-lg font-extrabold text-white mt-2 font-mono">${pack.price}</div>
                </div>

                <button
                  onClick={() => handleCreditPackCheckout(pack.id)}
                  disabled={loadingPlan === pack.id}
                  className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition active:scale-95 disabled:opacity-50"
                >
                  {loadingPlan === pack.id ? "Processing..." : "Buy Pack"}
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] p-5">
              <div>
                <div className="text-sm font-bold text-white">High Volume / Enterprise</div>
                <div className="text-xs text-zinc-400 mt-0.5">Custom credit quotas & dedicated cluster</div>
                <div className="text-xs font-semibold text-emerald-400 mt-2">Volume Discounts Available</div>
              </div>
              <a
                href="mailto:contact@developer.local"
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-zinc-400">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Merchant of Record Global Tax & VAT Handled</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-400" />
            <span>Self-Service Customer Billing & Invoices</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Instant API Key Generation Upon Checkout</span>
          </div>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {downgradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#0c0e14] p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setDowngradeTarget(null)}
              disabled={downgrading}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Plan Downgrade</h3>
                <p className="text-xs text-zinc-400">Switching subscription tier</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-5">
              Are you sure you want to downgrade from{" "}
              <strong className="text-white">{currentPlanConfig.name}</strong> to{" "}
              <strong className="text-amber-300">{downgradeTarget.name}</strong>?
            </p>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 mb-6 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Monthly Credits:</span>
                <span className="text-white">
                  {currentPlanConfig.creditsPerMonth.toLocaleString()} →{" "}
                  <strong className="text-amber-300">{downgradeTarget.creditsPerMonth.toLocaleString()} cr/mo</strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Rate Limits:</span>
                <span className="text-white">
                  {currentPlanConfig.rateLimitPerMin} →{" "}
                  <strong className="text-amber-300">{downgradeTarget.rateLimitPerMin} req/min</strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>New Price:</span>
                <span className="text-white font-bold">
                  ${downgradeTarget.price}
                  {downgradeTarget.interval === "one-time" ? " one-time" : "/month"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDowngradeTarget(null)}
                disabled={downgrading}
                className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
              >
                Keep Current Plan
              </button>
              <button
                type="button"
                onClick={confirmDowngrade}
                disabled={downgrading}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {downgrading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    <span>Confirm Downgrade</span>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
