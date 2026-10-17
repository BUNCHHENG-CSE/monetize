"use client";

import { useState } from "react";
import { Check, Zap, Sparkles, ArrowRight } from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";

export function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
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
        alert(data.message || data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      alert("Checkout error: " + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div id="pricing" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent Developer Pricing</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Start Free. Upgrade As You Scale.
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Powered by {monetizeConfig.providers.payments === "lemonsqueezy" ? "Lemon Squeezy (Merchant of Record)" : "Stripe"} with global tax handling and instant activation.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800">
              <button
                onClick={() => setBillingCycle("month")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  billingCycle === "month"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle("year")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                  billingCycle === "year"
                    ? "bg-zinc-800 text-white shadow-sm"
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
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {monetizeConfig.plans.map((plan) => {
            const isPopular = plan.popular;
            const price =
              billingCycle === "year" && plan.price > 0
                ? Math.round(plan.price * 0.8)
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition sm:p-8 ${
                  isPopular
                    ? "border-blue-500 bg-zinc-900/90 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <span className="text-xs text-zinc-400">
                      {plan.creditsPerMonth.toLocaleString()} credits / mo
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      ${price}
                    </span>
                    <span className="text-sm font-medium text-zinc-400">
                      /{billingCycle === "year" ? "mo billed annually" : "month"}
                    </span>
                  </div>

                  <div className="mt-6 border-t border-zinc-800/80 pt-6">
                    <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-3 text-xs text-zinc-300">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition shadow-sm active:scale-[0.98] ${
                      isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>{plan.price === 0 ? "Get Started Free" : "Upgrade to " + plan.name}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
