"use client";

import { useState, useMemo } from "react";
import {
  Download,
  FileCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";
import { UsageLogItem } from "./types";

interface UsageLogsTabProps {
  logs: UsageLogItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

function formatRelativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function UsageLogsTab({ logs, isLoading, onRefresh }: UsageLogsTabProps) {
  const [logFilter, setLogFilter] = useState<"all" | "200" | "error">("all");

  const stats = useMemo(() => {
    const total = logs.length;
    const okCount = logs.filter((l) => l.status_code === 200).length;
    const errCount = total - okCount;
    const totalCredits = logs.reduce((acc, l) => acc + (l.credits_deducted ?? 0), 0);
    const avgLatency =
      total > 0
        ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms ?? 0), 0) / total)
        : 0;

    // Group last 7 days for lightweight bar chart
    const days: { label: string; key: string; requests: number; credits: number; errors: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      days.push({ label, key, requests: 0, credits: 0, errors: 0 });
    }
    for (const log of logs) {
      const key = new Date(log.created_at).toISOString().slice(0, 10);
      const slot = days.find((d) => d.key === key);
      if (slot) {
        slot.requests += 1;
        slot.credits += log.credits_deducted ?? 0;
        if (log.status_code !== 200) slot.errors += 1;
      }
    }
    const maxRequests = Math.max(1, ...days.map((d) => d.requests));

    return { total, okCount, errCount, totalCredits, avgLatency, days, maxRequests };
  }, [logs]);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (logFilter === "200") return log.status_code === 200;
        if (logFilter === "error") return log.status_code !== 200;
        return true;
      }),
    [logs, logFilter]
  );

  return (
    <div className="space-y-6">
      {/* Lightweight Daily Usage Chart & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <BarChart3 className="h-4 w-4" />
                <span>7-Day Request & Credit Activity</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Daily distribution of metered API calls and credit consumption.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                200 OK
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                Errors (0 cr)
              </span>
            </div>
          </div>

          <div className="h-40 flex items-end justify-between gap-3 pt-6 px-2 border-b border-white/[0.06]">
            {stats.days.map((day) => {
              const heightPct = Math.max(8, Math.round((day.requests / stats.maxRequests) * 100));
              const errPct = day.requests > 0 ? Math.round((day.errors / day.requests) * 100) : 0;
              return (
                <div key={day.key} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-zinc-400 opacity-80 group-hover:text-white">
                    {day.requests > 0 ? `${day.requests} (${day.credits}cr)` : "0"}
                  </div>
                  <div className="w-full max-w-[54px] h-24 flex items-end bg-white/[0.02] rounded-t-lg overflow-hidden p-0.5">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400 relative overflow-hidden transition-all"
                      style={{ height: `${day.requests > 0 ? heightPct : 4}%` }}
                    >
                      {errPct > 0 && (
                        <div
                          className="w-full bg-rose-500 absolute top-0 left-0"
                          style={{ height: `${errPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 pb-2">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400">Success vs Error Calls</div>
              <div className="text-xl font-extrabold text-white font-mono mt-1">
                {stats.okCount} OK{" "}
                <span className="text-xs font-normal text-rose-400">/ {stats.errCount} Err</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {stats.total > 0 ? Math.round((stats.okCount / stats.total) * 100) : 100}% success rate
              </div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-400/80" />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400">Avg Execution Latency & Spend</div>
              <div className="text-xl font-extrabold text-white font-mono mt-1">
                {stats.avgLatency}ms{" "}
                <span className="text-xs font-normal text-amber-400">• {stats.totalCredits} cr</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Across {stats.total} recent invocations
              </div>
            </div>
            <Clock className="h-8 w-8 text-blue-400/80" />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Execution Telemetry & Audit Logs
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Historical audit trail of all authenticated invocations, request IDs, credit charges, and latency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/logs?format=csv"
              download
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Export CSV</span>
            </a>
            <a
              href="/api/logs?format=json"
              download
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition shadow-sm"
            >
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </a>
          </div>
        </div>

        {/* Filter and stats */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(["all", "200", "error"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  logFilter === filter
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/[0.02] text-zinc-400 hover:text-white"
                }`}
              >
                {filter === "all"
                  ? `All Logs (${logs.length})`
                  : filter === "200"
                  ? `200 OK (${stats.okCount})`
                  : `Errors (${stats.errCount})`}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Logs Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Endpoint & Preset</th>
                <th className="px-4 py-3">HTTP Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3 text-right">Request / Log ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No matching execution logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const reqId = log.metadata?.requestId || log.id;
                  const preset = log.metadata?.preset;
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition">
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap" title={new Date(log.created_at).toLocaleString()}>
                        {formatRelativeTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-200">
                        <span>{log.endpoint}</span>
                        {preset && (
                          <span className="ml-2 rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                            {preset}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${
                            log.status_code === 200
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">
                        {log.duration_ms}ms
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {log.credits_deducted > 0 ? (
                          <span className="text-amber-400">-{log.credits_deducted} cr</span>
                        ) : (
                          <span className="text-zinc-500">0 cr</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">
                        {reqId.slice(0, 14)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
