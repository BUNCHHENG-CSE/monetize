"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Terminal,
  Zap,
  Shield,
  Layers,
  Play,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  FileCode,
  Sparkles,
  Code2,
} from "lucide-react";

interface PipelineStep {
  id: string;
  stepNum: string;
  name: string;
  technology: string;
  subtext: string;
  badge: string;
  color: string;
  accentBg: string;
  borderColor: string;
  icon: any;
  metric: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "auth",
    stepNum: "01",
    name: "Auth Gate",
    technology: "Clerk / Bearer Key",
    subtext: "SHA-256 Hashed Key Vault",
    badge: "Verified",
    color: "text-blue-400",
    accentBg: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: Shield,
    metric: "< 2ms latency",
  },
  {
    id: "metering",
    stepNum: "02",
    name: "Credit Metering",
    technology: "Atomic ACID Lock",
    subtext: "Prisma Interactive Tx",
    badge: "Deducted",
    color: "text-amber-400",
    accentBg: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Zap,
    metric: "-1 Credit (ACID)",
  },
  {
    id: "execution",
    stepNum: "03",
    name: "Tool Logic",
    technology: "src/tool-engine",
    subtext: "TypeScript / Python Engine",
    badge: "Executed",
    color: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: Cpu,
    metric: "Pure Logic Run",
  },
  {
    id: "billing",
    stepNum: "04",
    name: "Billing & MoR",
    technology: "Lemon / Stripe MoR",
    subtext: "Global Tax & Webhooks",
    badge: "Compliant",
    color: "text-purple-400",
    accentBg: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: Layers,
    metric: "100% Tax Legal",
  },
];

export function HeroPipelineStudio() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "curl" | "sdk" | "json">("pipeline");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(4); // 4 = all completed by default
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSdkInstall, setCopiedSdkInstall] = useState(false);

  const triggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);

    const timers = [
      setTimeout(() => setSimulationStep(1), 300),
      setTimeout(() => setSimulationStep(2), 650),
      setTimeout(() => setSimulationStep(3), 1050),
      setTimeout(() => {
        setSimulationStep(4);
        setIsSimulating(false);
      }, 1450),
    ];

    return () => timers.forEach(clearTimeout);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const copyInstallCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedSdkInstall(true);
    setTimeout(() => setCopiedSdkInstall(false), 2000);
  };

  const curlLines = [
    `# 1. Direct API invocation with Bearer Secret Key`,
    `curl -X POST https://api.yourtool.dev/api/v1/execute \\`,
    `  -H "Authorization: Bearer sk_live_89f02c7b..." \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "prompt": "SELECT * FROM orders WHERE total > 100;",`,
    `    "options": { "dialect": "postgres", "strict": true }`,
    `  }'`,
  ];

  const sdkLines = [
    `import { DevToolClient } from "@yourtool/sdk";`,
    ``,
    `// Pre-configured type-safe client instance`,
    `const client = new DevToolClient({`,
    `  apiKey: process.env.DEVTOOL_API_KEY,`,
    `});`,
    ``,
    `// Atomic credit deduction occurs before logic runs`,
    `const result = await client.execute({`,
    `  prompt: "SELECT * FROM orders WHERE total > 100;",`,
    `  options: { dialect: "postgres" }`,
    `});`,
    ``,
    `console.log(result.data, result.creditsRemaining);`,
  ];

  const jsonLines = [
    `{`,
    `  "status": "success",`,
    `  "data": {`,
    `    "executionTimeMs": 14,`,
    `    "optimizedQuery": "SELECT id, total FROM orders WHERE total > 100;",`,
    `    "performanceGain": "+340%",`,
    `    "indexesRecommended": ["orders_total_idx"]`,
    `  },`,
    `  "creditsUsed": 1,`,
    `  "creditsRemaining": 4999,`,
    `  "requestId": "req_88f0a2e9b1"`,
    `}`,
  ];

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[#0c0e15]/95 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden transition-all hover:border-white/[0.16] flex flex-col">
      {/* Top Header Bar / Mac Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#090b10]/80 px-4 py-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-white/[0.1] mx-1" />
          <span className="text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-blue-400" />
            api-request-pipeline.ts
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 text-xs">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "pipeline"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab("curl")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "curl"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            cURL
          </button>
          <button
            onClick={() => setActiveTab("sdk")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "sdk"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            SDK
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === "json"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            JSON
          </button>
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zero-Latency Fallback Active</span>
        </div>
      </div>

      {/* Main Studio Body - FIXED UNIFORM HEIGHT (min-h-[440px] and flex flex-col) so NO layout jumping occurs */}
      <div className="p-4 sm:p-6 lg:p-7 min-h-[440px] flex flex-col justify-between">
        {/* TAB 1: PIPELINE FLOW */}
        {activeTab === "pipeline" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Simulation Controller Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                <span>Simulated Flow:</span>
                <span className="text-zinc-200 font-semibold">POST /api/v1/execute</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition hover:bg-blue-500 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSimulating ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Run Test Payload</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4 Interactive Pipeline Stages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative flex-1 items-stretch">
              {PIPELINE_STEPS.map((step, idx) => {
                const isStepActive = simulationStep > idx;
                const isCurrentlyExecuting = simulationStep === idx && isSimulating;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`relative rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 ${
                      isCurrentlyExecuting
                        ? `${step.borderColor} ${step.accentBg} ring-1 ring-blue-500 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.3)]`
                        : isStepActive
                        ? "border-white/[0.1] bg-[#10131d] hover:border-white/[0.2]"
                        : "border-white/[0.04] bg-white/[0.01] opacity-50"
                    }`}
                  >
                    <div>
                      {/* Top step row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                          Step {step.stepNum}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isCurrentlyExecuting ? (
                            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                          ) : isStepActive ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-zinc-600" />
                          )}
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              isStepActive ? "text-emerald-400" : "text-zinc-500"
                            }`}
                          >
                            {isStepActive ? step.badge : "Idle"}
                          </span>
                        </div>
                      </div>

                      {/* Step Icon and Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${step.accentBg} ${step.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="font-bold text-white text-xs sm:text-sm">{step.name}</div>
                      </div>

                      {/* Technology details */}
                      <div className={`text-xs font-mono font-semibold ${step.color} truncate`}>
                        {step.technology}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{step.subtext}</div>
                    </div>

                    {/* Micro metric */}
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Telemetry</span>
                      <span className="text-zinc-300 font-medium">{step.metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal Output Drawer */}
            <div className="rounded-xl border border-white/[0.08] bg-[#07090e] p-3.5 font-mono text-xs shrink-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 border-b border-white/[0.06] mb-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Pipeline Execution Stream</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">200 OK</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300">14ms total</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-amber-300 font-semibold">1 Credit Deducted</span>
                </div>
              </div>

              <div className="space-y-1 text-zinc-400 text-[11px] sm:text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-zinc-500">[00:00.001]</span>
                  <span className="text-zinc-300">Auth:</span>
                  <span>Bearer token authenticated (SHA-256 match in 0.8ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-zinc-500">[00:00.004]</span>
                  <span className="text-zinc-300">Metering:</span>
                  <span>ACID lock acquired. User balance: 5,000 → 4,999 credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-zinc-500">[00:00.012]</span>
                  <span className="text-zinc-300">Tool Engine:</span>
                  <span className="text-emerald-300">executeToolLogic() finished cleanly in 8ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-zinc-500">[00:00.014]</span>
                  <span className="text-zinc-300">Billing:</span>
                  <span>Usage logged. Global MoR compliance active. Dispatched 200 payload</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: cURL (MATCHING EXACT HEIGHT) */}
        {activeTab === "curl" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Editor Container Filling Height */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#07090e] p-4 font-mono text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      BASH / SHELL
                    </span>
                    <span className="text-zinc-400 text-[11px]">POST https://api.yourtool.dev/api/v1/execute</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(curlLines.join("\n"))}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className={copiedSnippet ? "text-emerald-400" : ""}>
                      {copiedSnippet ? "Copied" : "Copy cURL"}
                    </span>
                  </button>
                </div>

                {/* Code with Line Numbers */}
                <div className="space-y-1.5 overflow-x-auto">
                  {curlLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <span className="text-zinc-600 select-none text-[11px] w-5 text-right font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs ${
                          line.startsWith("#")
                            ? "text-zinc-500 italic"
                            : line.includes("Authorization")
                            ? "text-amber-300"
                            : line.includes("curl")
                            ? "text-blue-400 font-bold"
                            : line.includes("prompt")
                            ? "text-emerald-300"
                            : "text-zinc-200"
                        }`}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanatory Payload Drawer to keep height balanced */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400">
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">Method</div>
                  <div className="text-blue-400 font-semibold mt-0.5">POST (JSON)</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">Auth Header</div>
                  <div className="text-amber-400 font-semibold mt-0.5">Bearer sk_live_...</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">Credit Cost</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">1 Credit / req</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">Response Code</div>
                  <div className="text-purple-400 font-semibold mt-0.5">200 OK / 402 Pay</div>
                </div>
              </div>
            </div>

            {/* Bottom cURL helper strip */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-blue-400" />
                <span>Replace <code className="text-zinc-200 font-bold">sk_live_...</code> with your subscriber key</span>
              </div>
              <span className="text-emerald-400 font-semibold">Ready to paste into terminal</span>
            </div>
          </div>
        )}

        {/* TAB 3: SDK (MATCHING EXACT HEIGHT) */}
        {activeTab === "sdk" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Editor Container Filling Height */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#07090e] p-4 font-mono text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      TYPESCRIPT
                    </span>
                    <span className="text-zinc-400 text-[11px]">@yourtool/sdk • Modern Async Client</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(sdkLines.join("\n"))}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className={copiedSnippet ? "text-emerald-400" : ""}>
                      {copiedSnippet ? "Copied" : "Copy Code"}
                    </span>
                  </button>
                </div>

                {/* Code with Line Numbers */}
                <div className="space-y-1.5 overflow-x-auto">
                  {sdkLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <span className="text-zinc-600 select-none text-[11px] w-5 text-right font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs ${
                          line.startsWith("//")
                            ? "text-zinc-500 italic"
                            : line.includes("import")
                            ? "text-purple-300 font-semibold"
                            : line.includes("const")
                            ? "text-blue-300"
                            : line.includes("await")
                            ? "text-amber-300"
                            : line.includes("prompt")
                            ? "text-emerald-300"
                            : "text-zinc-200"
                        }`}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Install strip inside SDK */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Package:</span>
                  <code className="text-zinc-200 font-semibold">npm i @yourtool/sdk</code>
                </div>
                <button
                  onClick={() => copyInstallCommand("npm i @yourtool/sdk")}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  {copiedSdkInstall ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span className={copiedSdkInstall ? "text-emerald-400" : ""}>
                    {copiedSdkInstall ? "Copied" : "Copy Install"}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom SDK helper strip */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Zero runtime dependencies • Built-in retry logic & types</span>
              </div>
              <span className="text-purple-400 font-semibold">ESM & CJS Compatible</span>
            </div>
          </div>
        )}

        {/* TAB 4: JSON (MATCHING EXACT HEIGHT) */}
        {activeTab === "json" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Editor Container Filling Height */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#07090e] p-4 font-mono text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      HTTP 200 OK
                    </span>
                    <span className="text-zinc-400 text-[11px]">application/json • 14ms execution</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(jsonLines.join("\n"))}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className={copiedSnippet ? "text-emerald-400" : ""}>
                      {copiedSnippet ? "Copied" : "Copy JSON"}
                    </span>
                  </button>
                </div>

                {/* Code with Line Numbers */}
                <div className="space-y-1.5 overflow-x-auto">
                  {jsonLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <span className="text-zinc-600 select-none text-[11px] w-5 text-right font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs ${
                          line.includes('"status"') || line.includes('"success"')
                            ? "text-emerald-400 font-semibold"
                            : line.includes('"creditsRemaining"') || line.includes('"creditsUsed"')
                            ? "text-amber-300"
                            : line.includes('"performanceGain"')
                            ? "text-blue-300 font-bold"
                            : line.includes('"data"')
                            ? "text-purple-300"
                            : "text-zinc-200"
                        }`}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Headers Drawer inside JSON */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400">
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">X-RateLimit-Limit</div>
                  <div className="text-zinc-200 font-semibold mt-0.5">60 req / min</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">X-RateLimit-Remaining</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">59 remaining</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">X-Credit-Balance</div>
                  <div className="text-amber-400 font-semibold mt-0.5">4,999 credits</div>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-zinc-500">X-Request-Id</div>
                  <div className="text-zinc-200 font-semibold mt-0.5 truncate">req_88f0a2e9b1</div>
                </div>
              </div>
            </div>

            {/* Bottom JSON helper strip */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Deterministic envelope format matching standard API gateways</span>
              </div>
              <span className="text-emerald-400 font-semibold">Prisma ACID Committed</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer ticker */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] bg-[#090b10]/80 px-4 py-2.5 sm:px-6 text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Atomic transactions backed by Prisma ORM & Neon Serverless PostgreSQL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Stack:</span>
          <span className="text-zinc-300">Clerk</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300">Lemon Squeezy</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300">Stripe</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300">Next.js 15</span>
        </div>
      </div>
    </div>
  );
}
