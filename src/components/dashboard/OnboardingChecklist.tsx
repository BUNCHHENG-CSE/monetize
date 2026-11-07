"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Key,
  Terminal,
  Bell,
  Sparkles,
  Copy,
  Check,
  X,
} from "lucide-react";
import { ApiKeyItem, UsageLogItem, WebhookAlertSettings } from "./types";

interface OnboardingChecklistProps {
  keys: ApiKeyItem[];
  logs: UsageLogItem[];
  alerts: WebhookAlertSettings;
  userPlan: string;
  onSelectTab: (tab: any) => void;
  onOpenNewKeyModal: () => void;
}

const STORAGE_KEY = "devtool_onboarding_dismissed_v1";

export function OnboardingChecklist({
  keys,
  logs,
  alerts,
  userPlan,
  onSelectTab,
  onOpenNewKeyModal,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  const hasKey = keys.length > 0;
  const hasRealCall = logs.some((l) => l.status_code === 200);
  const hasAlert = Boolean(alerts.isActive && alerts.endpointUrl && !alerts.endpointUrl.includes("httpbin.org"));
  const hasPaidPlan = userPlan !== "free";

  const steps = [
    {
      id: "key",
      done: hasKey,
      title: "Generate a secret API key",
      description: "Create a SHA-256 hashed Bearer token for your CLI or backend.",
      actionLabel: hasKey ? "Manage Keys" : "Create Key",
      onAction: () => (hasKey ? onSelectTab("keys") : onOpenNewKeyModal()),
      icon: Key,
    },
    {
      id: "call",
      done: hasRealCall,
      title: "Make your first metered API call",
      description: "Run a test query in the Playground or copy the cURL command below.",
      actionLabel: "Open Sandbox",
      onAction: () => onSelectTab("playground"),
      icon: Terminal,
    },
    {
      id: "alert",
      done: hasAlert,
      title: "Configure a low-credit webhook alert",
      description: "Connect Slack, Discord, or your server to get notified before credits run out.",
      actionLabel: "Configure Alerts",
      onAction: () => onSelectTab("alerts"),
      icon: Bell,
    },
    {
      id: "plan",
      done: hasPaidPlan,
      title: "Choose a production plan or credit pack",
      description: "Unlock higher rate limits and automatic balance top-ups.",
      actionLabel: "View Billing",
      onAction: () => onSelectTab("billing"),
      icon: Sparkles,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  if (dismissed) return null;

  const sampleKey = keys[0]?.key_prefix ? `${keys[0].key_prefix}` : "sk_test_demo";
  const curlCmd = `curl -X POST "${origin}/api/v1/tool/execute" -H "Authorization: Bearer ${sampleKey}" -H "Content-Type: application/json" -d '{"prompt":"SELECT * FROM users;","preset":"sql-optimizer"}'`;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-[#0c0e14]/90 to-[#0c0e14]/90 p-5 sm:p-6 mb-8 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-blue-300">
              {completedCount}/{steps.length} Completed
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Quickstart Onboarding Checklist
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Follow these steps to wire up your developer tool and test your first metered request.
          </p>
        </div>

        <button
          onClick={() => {
            setDismissed(true);
            if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
          }}
          className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition"
          title="Dismiss onboarding checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                step.done
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${step.done ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">{step.title}</div>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <button
                onClick={step.onAction}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                <span>{step.actionLabel}</span>
                <span>→</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick copyable first request bar */}
      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#07090e] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-inner">
        <div className="font-mono text-xs text-zinc-300 truncate flex items-center gap-2">
          <span className="text-emerald-400 select-none font-bold">$</span>
          <span className="truncate">{curlCmd}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(curlCmd);
            setCopiedCurl(true);
            setTimeout(() => setCopiedCurl(false), 2000);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition shrink-0 active:scale-95"
        >
          {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedCurl ? "Copied cURL" : "Copy cURL"}</span>
        </button>
      </div>
    </div>
  );
}
