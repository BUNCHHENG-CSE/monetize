"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { WebhookAlertSettings } from "./types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface AlertsTabProps {
  alertSettings: WebhookAlertSettings;
  onChange: (next: WebhookAlertSettings) => void;
}

export function AlertsTab({ alertSettings, onChange }: AlertsTabProps) {
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [alertSaveSuccess, setAlertSaveSuccess] = useState(false);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [testAlertResult, setTestAlertResult] = useState<string | null>(null);

  const handleSaveAlerts = async () => {
    setIsSavingAlerts(true);
    setAlertSaveSuccess(false);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertSettings),
      });
      if (res.ok) {
        setAlertSaveSuccess(true);
        setTimeout(() => setAlertSaveSuccess(false), 3000);
      }
    } catch (e: any) {
      alert("Failed to save alert settings: " + e.message);
    } finally {
      setIsSavingAlerts(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTestingAlert(true);
    setTestAlertResult(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "test.ping" }),
      });
      const data = await res.json();
      if (data.success) {
        setTestAlertResult("✔ Ping delivered successfully (HTTP 200)");
      } else {
        setTestAlertResult(`⚠ Dispatch response: ${data.error || "Status " + data.statusCode}`);
      }
    } catch (e: any) {
      setTestAlertResult("Failed to send ping: " + e.message);
    } finally {
      setIsTestingAlert(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <Bell className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Developer Notifications
          </span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Outbound Webhooks & Slack / Discord Alerts
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Receive instant HTTP POST alerts when your credit balance drops below a threshold or when rate limits are exceeded. Compatible with Slack, Discord, and custom webhooks.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Destination Webhook URL
              </label>
              <input
                type="url"
                value={alertSettings.endpointUrl}
                onChange={(e) =>
                  onChange({ ...alertSettings, endpointUrl: e.target.value })
                }
                placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Alert Format Payload
                </label>
                <CustomSelect
                  value={alertSettings.format}
                  onChange={(val) =>
                    onChange({
                      ...alertSettings,
                      format: val as any,
                    })
                  }
                  options={[
                    { value: "raw_json", label: "Raw JSON (Custom Server / Hook)", sublabel: "REST Payload" },
                    { value: "slack", label: "Slack Webhook Format", sublabel: "Block Kit" },
                    { value: "discord", label: "Discord Embed Format", sublabel: "Rich Embed" },
                  ]}
                  size="md"
                  className="w-full"
                  menuWidth="100%"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Low Credit Alert Threshold
                </label>
                <input
                  type="number"
                  value={alertSettings.lowCreditThreshold}
                  onChange={(e) =>
                    onChange({
                      ...alertSettings,
                      lowCreditThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings.notifyOnLowCredits}
                  onChange={(e) =>
                    onChange({
                      ...alertSettings,
                      notifyOnLowCredits: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-zinc-300">
                  Dispatch alert when credit balance crosses below threshold
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings.notifyOnRateLimit}
                  onChange={(e) =>
                    onChange({
                      ...alertSettings,
                      notifyOnRateLimit: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-zinc-300">
                  Dispatch alert when rate limits are exceeded (HTTP 429)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings.isActive}
                  onChange={(e) =>
                    onChange({
                      ...alertSettings,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-semibold text-emerald-400">
                  Enable active outbound webhook dispatching
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.08]">
              <button
                onClick={handleSaveAlerts}
                disabled={isSavingAlerts}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
              >
                {isSavingAlerts ? "Saving..." : alertSaveSuccess ? "Saved!" : "Save Alert Settings"}
              </button>

              <button
                onClick={handleTestAlert}
                disabled={isTestingAlert || !alertSettings.endpointUrl}
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition active:scale-95 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-blue-400" />
                <span>{isTestingAlert ? "Pinging..." : "Send Test Ping"}</span>
              </button>

              {testAlertResult && (
                <span className="text-xs font-mono text-zinc-300 ml-2">
                  {testAlertResult}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Live Webhook Payload Simulator */}
          <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#07090e] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Live Payload Preview ({alertSettings.format})
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                POST
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400 border-b border-white/[0.04] pb-3">
              <div><span className="text-zinc-500">Host:</span> {alertSettings.endpointUrl ? alertSettings.endpointUrl.replace(/^https?:\/\//, "").split("/")[0] : "api.yourdomain.com"}</div>
              <div><span className="text-zinc-500">Content-Type:</span> application/json</div>
              <div><span className="text-zinc-500">X-DevTool-Event:</span> credits.low_balance</div>
            </div>

            <pre className="text-[11px] font-mono text-blue-200/90 bg-zinc-950/60 p-3.5 rounded-xl border border-white/[0.04] overflow-x-auto leading-relaxed">
              {JSON.stringify(
                alertSettings.format === "slack"
                  ? {
                      text: `⚠️ [DevTool Alert] Workspace credits balance dropped below ${alertSettings.lowCreditThreshold} threshold!`,
                      attachments: [
                        {
                          color: "#f59e0b",
                          fields: [
                            { title: "Current Balance", value: "142 credits", short: true },
                            { title: "Threshold", value: `${alertSettings.lowCreditThreshold} credits`, short: true },
                          ],
                        },
                      ],
                    }
                  : alertSettings.format === "discord"
                  ? {
                      content: `🚨 **Low Balance Warning** - Balance below ${alertSettings.lowCreditThreshold} cr`,
                      embeds: [
                        {
                          title: "API Credit Threshold Reached",
                          color: 16753920,
                          description: `Your balance is currently 142 credits. Auto-recharge or top up to prevent HTTP 402 interruption.`,
                        },
                      ],
                    }
                  : {
                      event: "credits.low_balance",
                      timestamp: new Date().toISOString(),
                      data: {
                        balance: 142,
                        threshold: alertSettings.lowCreditThreshold,
                        workspaceId: "user_demo_123",
                        status: "warning",
                      },
                    },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
