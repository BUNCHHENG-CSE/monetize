"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle,
  Copy,
  Check,
  Code2,
  Shield,
  Globe,
  Database,
  Image as ImageIcon,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";
import { AVAILABLE_PRESETS, ToolPresetKey } from "@/tool-engine/presets";
import { generateSnippet, SnippetLanguage } from "@/lib/snippets";

interface StructuredError {
  code?: string;
  message: string;
  hint?: string;
  status: number;
  requestId?: string;
  retryAfterSeconds?: number;
  topUpUrl?: string;
  issues?: Array<{ path: string; message: string }>;
}

export function InteractivePlayground() {
  const [activePreset, setActivePreset] = useState<ToolPresetKey>("sql-optimizer");
  const [prompt, setPrompt] = useState<string>(
    "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.created_at > NOW() - INTERVAL '30 days' GROUP BY u.id, u.name;"
  );
  const [optionsJson, setOptionsJson] = useState<string>(
    JSON.stringify({ dialect: "postgres", strictMode: true }, null, 2)
  );
  const [activeInputTab, setActiveInputTab] = useState<"input" | "options" | "code">("input");
  const [codeLang, setCodeLang] = useState<SnippetLanguage>("curl");
  const [activeOutputTab, setActiveOutputTab] = useState<"visual" | "json" | "headers">("visual");

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(monetizeConfig.toolEngine.sampleResponse);
  const [errorInfo, setErrorInfo] = useState<StructuredError | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const [metrics, setMetrics] = useState<{
    requestId: string;
    durationMs: number;
    creditsUsed: number;
    creditsRemaining: number;
    status: number;
    rateLimitLimit: string;
    rateLimitRemaining: string;
    rateLimitReset: string;
  }>({
    requestId: "req_demo98af2c019d",
    durationMs: 38,
    creditsUsed: 1,
    creditsRemaining: 1419,
    status: 200,
    rateLimitLimit: "60",
    rateLimitRemaining: "59",
    rateLimitReset: String(Math.floor(Date.now() / 1000) + 60),
  });

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleSelectArchetype = (presetKey: ToolPresetKey) => {
    setActivePreset(presetKey);
    setErrorInfo(null);
    if (presetKey === "sql-optimizer") {
      setPrompt("SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;");
      setOptionsJson(JSON.stringify({ dialect: "postgres", strictMode: true }, null, 2));
    } else if (presetKey === "ai-agent") {
      setPrompt("Analyze this infrastructure setup and extract key operational risks.");
      setOptionsJson(JSON.stringify({ task: "review", format: "json", model: "claude-3-7-sonnet" }, null, 2));
    } else if (presetKey === "web-scraper") {
      setPrompt("https://news.ycombinator.com");
      setOptionsJson(JSON.stringify({ extractMarkdown: true, extractMetadata: true }, null, 2));
    } else if (presetKey === "code-security") {
      setPrompt(`const query = "SELECT * FROM users WHERE id = '" + req.query.id + "';";\nconst secret = "sk_live_9f82d10a9c8b77e2";`);
      setOptionsJson(JSON.stringify({ language: "typescript", strictness: "high" }, null, 2));
    } else if (presetKey === "media-generator") {
      setPrompt("TCT Monetize v2.0");
      setOptionsJson(JSON.stringify({ badge: "PROD READY", width: 800, height: 420, theme: "dark" }, null, 2));
    }
  };

  const currentPayload = useMemo(() => {
    let parsedOptions: Record<string, any> = {};
    try {
      parsedOptions = JSON.parse(optionsJson);
    } catch {
      parsedOptions = {};
    }
    const fieldName =
      activePreset === "web-scraper"
        ? "url"
        : activePreset === "code-security"
        ? "code"
        : activePreset === "media-generator"
        ? "title"
        : "prompt";
    return {
      [fieldName]: prompt,
      preset: activePreset,
      options: parsedOptions,
    };
  }, [prompt, optionsJson, activePreset]);

  const liveSnippet = useMemo(
    () =>
      generateSnippet({
        language: codeLang,
        baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
        endpoint: "/api/v1/tool/execute",
        apiKey: "sk_test_demo",
        body: currentPayload,
      }),
    [codeLang, currentPayload]
  );

  const handleExecute = async () => {
    setIsLoading(true);
    setErrorInfo(null);
    const start = Date.now();

    try {
      let parsedOptions: Record<string, any> = {};
      try {
        parsedOptions = JSON.parse(optionsJson);
      } catch {
        setErrorInfo({
          code: "invalid_input",
          message: "Options JSON is malformed. Please fix the JSON syntax in the Options tab.",
          status: 400,
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/v1/tool/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          preset: activePreset,
          options: parsedOptions,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const duration = Date.now() - start;

      const requestId = res.headers.get("X-Request-Id") || data.requestId || "req_local";
      const creditsUsedHeader = res.headers.get("X-Credits-Used");
      const creditsUsed = creditsUsedHeader !== null ? parseInt(creditsUsedHeader, 10) : res.ok ? 1 : 0;
      const creditsRemaining = parseInt(
        res.headers.get("X-Credits-Remaining") ||
          String(data.metadata?.creditsRemaining ?? Math.max(0, metrics.creditsRemaining - creditsUsed)),
        10
      );
      const rateLimitLimit = res.headers.get("X-RateLimit-Limit") || metrics.rateLimitLimit;
      const rateLimitRemaining = res.headers.get("X-RateLimit-Remaining") || metrics.rateLimitRemaining;
      const rateLimitReset = res.headers.get("X-RateLimit-Reset") || metrics.rateLimitReset;

      setMetrics({
        requestId,
        durationMs: duration,
        creditsUsed,
        creditsRemaining,
        status: res.status,
        rateLimitLimit,
        rateLimitRemaining,
        rateLimitReset,
      });

      if (!res.ok || data.success === false) {
        const errObj = typeof data.error === "object" && data.error ? data.error : null;
        const retrySec = Number(res.headers.get("Retry-After") || data.retryAfterSeconds || 0);
        if (retrySec > 0) setRetryCountdown(retrySec);

        setErrorInfo({
          code: errObj?.code || (typeof data.error === "string" ? data.error : `http_${res.status}`),
          message: errObj?.message || data.message || (typeof data.error === "string" ? data.error : `Execution failed (${res.status})`),
          hint: errObj?.hint,
          status: res.status,
          requestId,
          retryAfterSeconds: retrySec || undefined,
          topUpUrl: data.topUpUrl || data.upgradeUrl,
          issues: data.issues,
        });
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setErrorInfo({
        code: "network_error",
        message: err?.message || "Network request failed. Is the development server running?",
        status: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(liveSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Archetype Preset Selector Pills */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Select Tool Engine Archetype</span>
          </div>
          <span className="text-xs text-zinc-400">
            Switch between 5 drop-in presets or customize in <code className="text-zinc-300">src/tool-engine/</code>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { id: "sql-optimizer", label: "SQL Optimizer", icon: Database, badge: "1 cr" },
            { id: "ai-agent", label: "AI Prompt Engine", icon: Sparkles, badge: "2 cr" },
            { id: "web-scraper", label: "Web Scraper", icon: Globe, badge: "1 cr" },
            { id: "code-security", label: "Security Linter", icon: Shield, badge: "1 cr" },
            { id: "media-generator", label: "SVG / OG Card", icon: ImageIcon, badge: "1 cr" },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activePreset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectArchetype(item.id as ToolPresetKey)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? "bg-blue-600/15 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-blue-400" : "text-zinc-500"}`} />
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Payload Column */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Tool Input Payload
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveInputTab("input")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeInputTab === "input"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Payload
              </button>
              <button
                onClick={() => setActiveInputTab("options")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeInputTab === "options"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Options JSON
              </button>
              <button
                onClick={() => setActiveInputTab("code")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                  activeInputTab === "code"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Terminal className="h-3 w-3" />
                <span>Copy as Code</span>
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {activeInputTab === "input" ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">
                  {activePreset === "web-scraper"
                    ? "Target URL to Scrape & Extract"
                    : activePreset === "code-security"
                    ? "Source Code to Audit for Vulnerabilities"
                    : activePreset === "media-generator"
                    ? "Banner Title / Header"
                    : "Prompt / Query Payload"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={activePreset === "code-security" ? 8 : 6}
                  placeholder="Enter input..."
                  className="w-full rounded-xl border border-white/[0.1] bg-[#07090e] p-3.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            ) : activeInputTab === "options" ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Custom Options Payload (JSON)
                </label>
                <textarea
                  value={optionsJson}
                  onChange={(e) => setOptionsJson(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#07090e] p-3.5 font-mono text-xs text-zinc-200 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(["curl", "ts", "js", "python", "go"] as SnippetLanguage[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-mono uppercase transition ${
                          codeLang === lang
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={copySnippet}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Snippet"}</span>
                  </button>
                </div>
                <pre className="w-full max-h-[210px] overflow-auto rounded-xl border border-white/[0.1] bg-[#07090e] p-3.5 font-mono text-[11px] text-zinc-300 leading-relaxed">
                  <code>{liveSnippet}</code>
                </pre>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-mono">
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-current" />
                <span>
                  Cost: {AVAILABLE_PRESETS[activePreset]?.defaultCreditCost || 1} cr • Failed calls cost 0 cr
                </span>
              </div>

              <button
                onClick={handleExecute}
                disabled={isLoading || retryCountdown > 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing Logic...</span>
                  </>
                ) : retryCountdown > 0 ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Retry in {retryCountdown}s</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Tool Logic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output & Telemetry Column */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${errorInfo ? "text-rose-400" : "text-emerald-400"}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Execution Output
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
                {metrics.requestId}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveOutputTab("visual")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeOutputTab === "visual"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Visual Result
              </button>
              <button
                onClick={() => setActiveOutputTab("json")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeOutputTab === "json"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Raw JSON
              </button>
              <button
                onClick={() => setActiveOutputTab("headers")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeOutputTab === "headers"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Headers
              </button>
            </div>
          </div>

          {/* Telemetry ribbon */}
          <div className="grid grid-cols-4 border-b border-white/[0.06] bg-white/[0.01] divide-x divide-white/[0.06] text-center text-xs py-2 px-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-mono">Status</div>
              <div
                className={`font-bold font-mono mt-0.5 ${
                  metrics.status >= 400 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {metrics.status} {metrics.status >= 400 ? "ERR" : "OK"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-mono">Latency</div>
              <div className="font-bold text-white font-mono mt-0.5">{metrics.durationMs}ms</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-mono">Credits Used</div>
              <div className="font-bold text-amber-400 font-mono mt-0.5">
                {metrics.creditsUsed > 0 ? `-${metrics.creditsUsed}` : "0 (Refunded)"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-mono">Balance Left</div>
              <div className="font-bold text-blue-400 font-mono mt-0.5">
                {metrics.creditsRemaining} cr
              </div>
            </div>
          </div>

          {/* Output Display Body */}
          <div className="p-5 flex-1 overflow-y-auto max-h-[380px] bg-[#07090e]">
            {errorInfo ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-rose-300">
                        Execution Blocked ({errorInfo.code || `HTTP ${errorInfo.status}`})
                      </span>
                      {errorInfo.requestId && (
                        <span className="font-mono text-[10px] text-rose-300/80">
                          {errorInfo.requestId}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-zinc-200">{errorInfo.message}</div>
                    {errorInfo.hint && (
                      <div className="mt-1.5 text-[11px] text-zinc-300 bg-black/30 rounded-lg p-2 border border-white/[0.06]">
                        💡 {errorInfo.hint}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actionable Contextual Recovery Links */}
                <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
                  {(errorInfo.status === 402 || errorInfo.code === "insufficient_credits") && (
                    <Link
                      href={errorInfo.topUpUrl || "/dashboard?tab=billing"}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Top Up Credits in Billing</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {(errorInfo.status === 401 || errorInfo.code === "unauthorized") && (
                    <Link
                      href="/dashboard?tab=keys"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition"
                    >
                      <span>Create API Key in Dashboard</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  <Link
                    href="/docs#errors"
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white underline"
                  >
                    View Error Code Reference
                  </Link>
                </div>
              </div>
            ) : activeOutputTab === "visual" ? (
              <div className="space-y-4">
                {/* Visualizer for SQL */}
                {response?.data?.optimizedQuery && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                      <span>Optimized SQL Statement</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {response.data.estimatedSpeedup || "3.8x"} faster
                      </span>
                    </div>
                    <pre className="rounded-xl border border-white/[0.08] bg-black/50 p-3 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
                      <code>{response.data.optimizedQuery}</code>
                    </pre>

                    {response.data.recommendations && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Advisor Recommendations
                        </div>
                        {response.data.recommendations.map((rec: string, i: number) => (
                          <div
                            key={i}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs text-zinc-300 flex items-start gap-2"
                          >
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Visualizer for AI Agent */}
                {response?.data?.structuredOutput && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                      <div className="font-bold">AI Agent Output ({response.data.preset})</div>
                      <div className="mt-1">{response.data.analysisSummary}</div>
                    </div>

                    {response.data.structuredOutput.keyFindings && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase">Key Findings</div>
                        {response.data.structuredOutput.keyFindings.map((finding: string, idx: number) => (
                          <div key={idx} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2 text-xs text-zinc-300">
                            ✔ {finding}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Visualizer for Web Scraper */}
                {response?.data?.metadata && (
                  <div className="space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase">Scraped Metadata</div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1.5 font-mono text-xs">
                      <div><span className="text-zinc-500">Title:</span> <span className="text-white">{response.data.metadata.title}</span></div>
                      <div><span className="text-zinc-500">Host:</span> <span className="text-blue-400">{response.data.hostname}</span></div>
                      <div><span className="text-zinc-500">Bytes:</span> <span className="text-emerald-400">{response.data.contentLengthBytes}</span></div>
                    </div>
                  </div>
                )}

                {/* Visualizer for Code Security */}
                {response?.data?.securityScore !== undefined && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                      <div className="text-xs">
                        <div className="text-zinc-400">Security Score</div>
                        <div className="text-xl font-bold text-white font-mono mt-0.5">
                          {response.data.securityScore} / 100
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        response.data.status === "PASSED" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {response.data.status}
                      </span>
                    </div>

                    {response.data.findings?.map((f: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                        <div className="font-bold flex items-center justify-between">
                          <span>{f.ruleId}</span>
                          <span className="uppercase text-[10px] font-mono">{f.severity}</span>
                        </div>
                        <div className="mt-1">{f.description}</div>
                        <div className="mt-1 text-[11px] text-zinc-400">Fix: {f.remediation}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Visualizer for Media SVG */}
                {response?.data?.svgContent && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase">SVG Dynamic Card Preview</div>
                    <div
                      className="rounded-xl border border-white/[0.1] p-3 bg-black/60 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: response.data.svgContent }}
                    />
                  </div>
                )}

                {/* Fallback data preview */}
                {!response?.data?.optimizedQuery &&
                  !response?.data?.structuredOutput &&
                  !response?.data?.metadata &&
                  !response?.data?.securityScore &&
                  !response?.data?.svgContent && (
                    <pre className="font-mono text-xs text-zinc-300">
                      <code>{JSON.stringify(response?.data, null, 2)}</code>
                    </pre>
                  )}
              </div>
            ) : activeOutputTab === "json" ? (
              <pre className="font-mono text-xs text-zinc-300 leading-relaxed">
                <code>{JSON.stringify(response, null, 2)}</code>
              </pre>
            ) : (
              <div className="space-y-2 font-mono text-xs text-zinc-300">
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-Request-Id:</span> {metrics.requestId}
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-Credits-Used:</span> {metrics.creditsUsed}
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-Credits-Remaining:</span> {metrics.creditsRemaining}
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-Execution-Time-Ms:</span> {metrics.durationMs}ms
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-RateLimit-Limit:</span> {metrics.rateLimitLimit}
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-RateLimit-Remaining:</span> {metrics.rateLimitRemaining}
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-blue-400">X-RateLimit-Reset:</span> {metrics.rateLimitReset}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-5 py-2.5">
            <span className="text-[11px] text-zinc-500 font-mono">
              Engine: {response?.metadata?.processedBy || "DevTool Engine"} • Rate Left: {metrics.rateLimitRemaining}/{metrics.rateLimitLimit}
            </span>

            <button
              onClick={copyJson}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
            >
              {copiedJson ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Response JSON</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
