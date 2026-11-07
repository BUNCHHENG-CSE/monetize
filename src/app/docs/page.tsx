import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Key,
  Terminal,
  Zap,
  Sparkles,
  Layers,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${monetizeConfig.tool.name} — Developer API Reference`,
  description: `Complete API documentation, uniform v1.1 error codes, rate limit headers, and SDK snippets for ${monetizeConfig.tool.name}.`,
};

const ERROR_CATALOG = [
  {
    http: 400,
    code: "invalid_input",
    meaning: "Missing required field, malformed JSON body, or invalid field type/length.",
    fix: "Inspect the returned issues[] array and verify your JSON body matches the preset schema.",
  },
  {
    http: 400,
    code: "unknown_preset",
    meaning: "The 'preset' key does not match any registered tool archetype.",
    fix: "Omit 'preset' to use the default or pick one from GET /api/v1/tool/presets.",
  },
  {
    http: 401,
    code: "unauthorized",
    meaning: "Missing, inactive, or revoked Bearer API key (and no active web session).",
    fix: "Pass 'Authorization: Bearer sk_live_...' using an active key from /dashboard.",
  },
  {
    http: 402,
    code: "insufficient_credits",
    meaning: "Your credit balance is lower than the preset's execution cost.",
    fix: "Top up a credit bundle or upgrade your plan at /dashboard?tab=billing.",
  },
  {
    http: 403,
    code: "plan_required",
    meaning: "The endpoint requires a higher subscription tier than your active plan.",
    fix: "Upgrade your subscription tier in /dashboard?tab=billing.",
  },
  {
    http: 413,
    code: "payload_too_large",
    meaning: "Request body exceeds the 1 MB maximum payload limit.",
    fix: "Trim the input payload below 1,000,000 bytes.",
  },
  {
    http: 429,
    code: "rate_limited",
    meaning: "Per-minute sliding-window request limit exceeded for your plan.",
    fix: "Wait Retry-After seconds before retrying, or upgrade your tier for higher throughput.",
  },
  {
    http: 422,
    code: "tool_failed",
    meaning: "The underlying tool returned success: false for the given input.",
    fix: "No credits were charged. Adjust the input payload and retry.",
  },
  {
    http: 500,
    code: "internal_error",
    meaning: "Unexpected exception inside the execution engine.",
    fix: "Reserved credits are automatically refunded. Share requestId with support.",
  },
];

export default function DocsPage() {
  const schema = monetizeConfig.toolEngine.inputSchema;

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col bg-grid-pattern selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="mx-auto w-full max-w-[1760px] 2xl:max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Docs Header */}
          <div className="border-b border-white/[0.08] pb-8 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Developer API Reference v{monetizeConfig.tool.version} (Contract v1.1)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {monetizeConfig.tool.name} Developer API
            </h1>
            <p className="mt-3 text-base sm:text-lg text-zinc-400 max-w-3xl leading-relaxed">
              Programmatic access to the high-throughput execution engine. Every request receives a unique{" "}
              <code className="text-zinc-200 font-mono">X-Request-Id</code>, reserves credits atomically via Prisma ACID transactions, and automatically refunds credits if execution fails.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Get Your API Key</span>
              </Link>
              <Link
                href="/#playground"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] transition"
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Open in Playground</span>
              </Link>
              <a
                href="/api/openapi?download=true"
                className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>OpenAPI 3.1 Spec (.json)</span>
              </a>
              <a
                href="/api/openapi?format=postman&download=true"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition"
              >
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                <span>Postman Collection</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Table of contents sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-1 rounded-2xl border border-white/[0.08] bg-[#0c0e14]/70 p-4 text-xs font-medium backdrop-blur-xl">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                  Navigation
                </div>
                <a href="#auth" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  1. Authentication
                </a>
                <a href="#endpoint" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  2. Execute Endpoint & Schema
                </a>
                <a href="#billing-semantics" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  3. Billing Semantics & Refunds
                </a>
                <a href="#headers" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  4. Rate Limits & Headers
                </a>
                <a href="#errors" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  5. Uniform Error Codes
                </a>
                <a href="#presets" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  6. Tool Archetype Presets
                </a>
                <a href="#sdks" className="block px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.04] transition">
                  7. SDK & Code Examples
                </a>
              </div>
            </aside>

            {/* Main Documentation Body */}
            <div className="lg:col-span-3 space-y-12">
              {/* 1. Authentication */}
              <section id="auth" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Key className="h-5 w-5 text-blue-400" />
                  <span>1. Authentication</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  All programmatic requests to the API must include your secret API key in the standard{" "}
                  <code className="text-blue-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/[0.06]">
                    Authorization
                  </code>{" "}
                  HTTP header using the Bearer token scheme:
                </p>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-4 font-mono text-xs text-zinc-200">
                  <code>Authorization: Bearer sk_live_your_secret_key_here</code>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-zinc-400">
                  Keys can be generated instantly inside the{" "}
                  <Link href="/dashboard" className="text-blue-400 font-semibold underline hover:text-blue-300">
                    Developer Dashboard
                  </Link>
                  . For local testing without creating a key, you can pass <code className="text-emerald-400 font-mono">sk_test_demo</code>. Plaintext keys are hashed with SHA-256 before storage.
                </div>
              </section>

              {/* 2. Endpoint Specification */}
              <section id="endpoint" className="space-y-5">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-emerald-400" />
                  <span>2. Execute Tool Endpoint</span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20">
                    POST
                  </span>
                  <code className="text-sm font-mono text-white bg-zinc-900 px-3 py-1 rounded-lg border border-white/[0.06]">
                    /api/v1/tool/execute
                  </code>
                  <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-mono font-bold text-blue-400 border border-blue-500/20">
                    GET
                  </span>
                  <code className="text-sm font-mono text-white bg-zinc-900 px-3 py-1 rounded-lg border border-white/[0.06]">
                    /api/v1/tool/presets
                  </code>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  Validates the input payload, reserves the preset&apos;s credit cost atomically, runs the selected preset or custom engine logic, and returns structured output with a correlation <code className="text-zinc-200 font-mono">requestId</code>.
                </p>

                {/* Input Schema Table */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 overflow-hidden shadow-xl backdrop-blur-xl mt-4">
                  <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] font-bold text-xs uppercase tracking-wider text-zinc-400">
                    Request Payload Parameters (JSON)
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.01] text-zinc-400 font-semibold">
                        <th className="py-3 px-5">Parameter</th>
                        <th className="py-3 px-5">Type</th>
                        <th className="py-3 px-5">Required</th>
                        <th className="py-3 px-5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      {schema.map((field) => (
                        <tr key={field.name} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 px-5 font-mono font-bold text-blue-400">{field.name}</td>
                          <td className="py-3.5 px-5 font-mono text-zinc-400">{field.type}</td>
                          <td className="py-3.5 px-5">
                            {field.required ? (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                                Required
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-zinc-400">{field.description}</td>
                        </tr>
                      ))}
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-5 font-mono font-bold text-blue-400">preset</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">string</td>
                        <td className="py-3.5 px-5">
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                            Optional
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-zinc-400">
                          Override active archetype preset (<code className="text-zinc-200">sql-optimizer</code>, <code className="text-zinc-200">ai-agent</code>, <code className="text-zinc-200">web-scraper</code>, <code className="text-zinc-200">code-security</code>, <code className="text-zinc-200">media-generator</code>).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. Billing Semantics */}
              <section id="billing-semantics" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <RotateCcw className="h-5 w-5 text-emerald-400" />
                  <span>3. Billing Semantics & Automatic Refunds</span>
                </h2>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Failed runs never cost credits.</strong> Every request follows a 3-phase atomic reservation flow:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 pt-1">
                    <li>
                      <strong className="text-zinc-200">Pre-flight Validation (0 credits):</strong> Authentication, rate-limit checks, and input schema validation run before touching your balance.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Atomic Reservation:</strong> The preset&apos;s exact credit cost is reserved inside an ACID transaction prior to tool execution, preventing concurrent overdrafts.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Settlement or Instant Refund:</strong> If the tool throws an error or returns <code className="text-rose-300 font-mono">success: false</code>, reserved credits are refunded immediately and the audit log records <code className="text-emerald-300 font-mono">0 credits</code>.
                    </li>
                  </ol>
                </div>
              </section>

              {/* 4. Response Headers */}
              <section id="headers" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span>4. Rate Limits & Response Headers</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Every API response includes diagnostic headers for correlation, credit accounting, and sliding-window rate limits:
                </p>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 overflow-hidden shadow-xl backdrop-blur-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-semibold">
                        <th className="py-3 px-5">Response Header</th>
                        <th className="py-3 px-5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-emerald-400">X-Request-Id</td>
                        <td className="py-3.5 px-5 text-zinc-400">Unique request correlation ID (<code className="text-zinc-300">req_...</code>) recorded in audit logs</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400">X-Credits-Used</td>
                        <td className="py-3.5 px-5 text-zinc-400">Credits deducted for this invocation (0 on failed calls)</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-amber-400">X-Credits-Remaining</td>
                        <td className="py-3.5 px-5 text-zinc-400">Remaining credit balance after settlement</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-zinc-300">X-Execution-Time-Ms</td>
                        <td className="py-3.5 px-5 text-zinc-400">End-to-end execution latency in milliseconds</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-zinc-300">X-RateLimit-Limit</td>
                        <td className="py-3.5 px-5 text-zinc-400">Maximum allowed requests per minute for active subscription tier</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-zinc-300">X-RateLimit-Remaining</td>
                        <td className="py-3.5 px-5 text-zinc-400">Remaining allowed requests in current sliding 60-second window</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-zinc-300">X-RateLimit-Reset</td>
                        <td className="py-3.5 px-5 text-zinc-400">Unix epoch timestamp (seconds) when the current rate limit window resets</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-purple-400">Retry-After</td>
                        <td className="py-3.5 px-5 text-zinc-400">Seconds until retry is allowed (returned on HTTP 429 responses)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 5. Uniform Error Codes */}
              <section id="errors" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <span>5. Uniform Error Codes</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  All 4xx and 5xx responses return a predictable JSON envelope with a machine-readable <code className="text-rose-300 font-mono">error.code</code> and actionable <code className="text-zinc-200 font-mono">error.hint</code>:
                </p>

                <pre className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <code>{`{
  "success": false,
  "requestId": "req_7f83b20c19e4a12b9012",
  "error": {
    "code": "insufficient_credits",
    "message": "This request costs 2 credit(s) but your balance is 1.",
    "hint": "Buy a credit pack or upgrade your plan in the Billing tab.",
    "docsUrl": "/docs#errors"
  },
  "creditsBalance": 1,
  "creditsRequired": 2,
  "topUpUrl": "/dashboard?tab=billing"
}`}</code>
                </pre>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 overflow-x-auto shadow-xl backdrop-blur-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-semibold">
                        <th className="py-3 px-4">HTTP</th>
                        <th className="py-3 px-4">Error Code</th>
                        <th className="py-3 px-4">When It Happens</th>
                        <th className="py-3 px-4">How to Resolve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      {ERROR_CATALOG.map((item) => (
                        <tr key={item.code} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{item.http}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{item.code}</td>
                          <td className="py-3.5 px-4 text-zinc-300">{item.meaning}</td>
                          <td className="py-3.5 px-4 text-zinc-400">{item.fix}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 6. Tool Archetype Presets */}
              <section id="presets" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span>6. Drop-In Tool Archetype Presets</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Pass an optional <code className="text-blue-300 font-mono">&quot;preset&quot;</code> parameter in your request body, or query <code className="text-zinc-200 font-mono">GET /api/v1/tool/presets</code> to discover available presets programmatically:
                </p>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 overflow-hidden shadow-xl backdrop-blur-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-semibold">
                        <th className="py-3 px-5">Preset Key</th>
                        <th className="py-3 px-5">Archetype Name</th>
                        <th className="py-3 px-5">Credit Cost</th>
                        <th className="py-3 px-5">Required Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400 font-bold">sql-optimizer</td>
                        <td className="py-3.5 px-5">SQL Optimizer & Index Advisor</td>
                        <td className="py-3.5 px-5 font-mono text-amber-400 font-bold">1 cr</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">prompt or code</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400 font-bold">ai-agent</td>
                        <td className="py-3.5 px-5">AI Prompt & Structured Extractor</td>
                        <td className="py-3.5 px-5 font-mono text-amber-400 font-bold">2 cr</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">prompt</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400 font-bold">web-scraper</td>
                        <td className="py-3.5 px-5">Web Scraper & Metadata Extractor</td>
                        <td className="py-3.5 px-5 font-mono text-amber-400 font-bold">1 cr</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">url or prompt (http/https)</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400 font-bold">code-security</td>
                        <td className="py-3.5 px-5">Code Security & Secret Scanner</td>
                        <td className="py-3.5 px-5 font-mono text-amber-400 font-bold">1 cr</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">code or prompt</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 font-mono text-blue-400 font-bold">media-generator</td>
                        <td className="py-3.5 px-5">Dynamic SVG / OG Card Generator</td>
                        <td className="py-3.5 px-5 font-mono text-amber-400 font-bold">1 cr</td>
                        <td className="py-3.5 px-5 font-mono text-zinc-400">title or prompt</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 7. SDK Code Example */}
              <section id="sdks" className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-blue-400" />
                  <span>7. SDK & Code Examples</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Select your preferred language below to copy ready-to-run client snippets with v1.1 error handling:
                </p>

                <CodeSnippet />
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
