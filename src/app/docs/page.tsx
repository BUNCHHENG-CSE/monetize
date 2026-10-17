import Link from "next/link";
import {
  BookOpen,
  Key,
  Terminal,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CodeSnippet } from "@/components/CodeSnippet";
import { monetizeConfig } from "@/../monetize.config";

export default function DocsPage() {
  const schema = monetizeConfig.toolEngine.inputSchema;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col bg-grid-pattern">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Docs Header */}
          <div className="border-b border-zinc-800 pb-8 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              <span>API Reference v1.0</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {monetizeConfig.tool.name} Developer API
            </h1>
            <p className="mt-3 text-base text-zinc-400 max-w-2xl">
              Interact programmatically with our high-throughput optimization engine. All requests require an active API key and are credit-metered in real time.
            </p>
          </div>

          <div className="space-y-12">
            {/* 1. Authentication */}
            <section id="auth" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                <span>1. Authentication</span>
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                All programmatic requests to the API must include your secret API key in the standard{" "}
                <code className="text-blue-300 bg-zinc-900 px-1.5 py-0.5 rounded">Authorization</code> HTTP header:
              </p>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs text-zinc-200">
                <code>Authorization: Bearer sk_live_your_secret_key_here</code>
              </div>
              <p className="text-xs text-zinc-500">
                Generate and manage your keys securely inside the{" "}
                <Link href="/dashboard" className="text-blue-400 underline hover:text-blue-300">
                  Developer Dashboard
                </Link>
                . Never expose live keys in client-side frontends.
              </p>
            </section>

            {/* 2. Endpoint Specification */}
            <section id="endpoint" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-emerald-400" />
                <span>2. Execute Tool Endpoint</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  POST
                </span>
                <code className="text-sm font-mono text-white">/api/v1/tool/execute</code>
              </div>
              <p className="text-sm text-zinc-400">
                Executes the engine's processing pipeline. Deducts 1 credit per execution.
              </p>

              {/* Input Schema Table */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg mt-4">
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/80 font-bold text-xs uppercase text-zinc-400">
                  Request Body Parameters (JSON)
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 font-semibold">
                      <th className="py-2.5 px-4">Parameter</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Required</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {schema.map((field) => (
                      <tr key={field.name} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-400">{field.name}</td>
                        <td className="py-2.5 px-4 font-mono text-zinc-400">{field.type}</td>
                        <td className="py-2.5 px-4">
                          {field.required ? (
                            <span className="text-red-400 font-semibold">Yes</span>
                          ) : (
                            <span className="text-zinc-500">Optional</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Response Headers */}
            <section id="headers" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span>3. Response Headers</span>
              </h2>
              <p className="text-sm text-zinc-400">
                Every API response includes metadata headers to monitor usage and rate limits:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <code className="text-xs font-bold text-blue-400">X-Credits-Remaining</code>
                  <p className="text-xs text-zinc-400 mt-1">Remaining credits in your current billing cycle.</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <code className="text-xs font-bold text-blue-400">X-Execution-Time-Ms</code>
                  <p className="text-xs text-zinc-400 mt-1">Total server processing duration in milliseconds.</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <code className="text-xs font-bold text-blue-400">X-RateLimit-Limit</code>
                  <p className="text-xs text-zinc-400 mt-1">Allowed requests per minute according to your plan.</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <code className="text-xs font-bold text-blue-400">X-RateLimit-Remaining</code>
                  <p className="text-xs text-zinc-400 mt-1">Requests remaining in the current 60-second window.</p>
                </div>
              </div>
            </section>

            {/* 4. Code Examples */}
            <section id="examples" className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. Code Implementation Examples</h2>
              <CodeSnippet />
            </section>

            {/* 5. HTTP Error Codes */}
            <section id="errors" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span>5. Status Codes & Error Handling</span>
              </h2>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 font-semibold">
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Meaning</th>
                      <th className="py-2.5 px-4">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">200 OK</td>
                      <td className="py-2.5 px-4">Success</td>
                      <td className="py-2.5 px-4 text-zinc-400">Payload executed and credit deducted.</td>
                    </tr>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-400">401 Unauthorized</td>
                      <td className="py-2.5 px-4">Invalid or missing key</td>
                      <td className="py-2.5 px-4 text-zinc-400">Check Authorization header format or regenerate key in dashboard.</td>
                    </tr>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-purple-400">402 Payment Required</td>
                      <td className="py-2.5 px-4">Insufficient credits</td>
                      <td className="py-2.5 px-4 text-zinc-400">Top up credits or upgrade to Pro plan.</td>
                    </tr>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-red-400">429 Too Many Requests</td>
                      <td className="py-2.5 px-4">Rate limit exceeded</td>
                      <td className="py-2.5 px-4 text-zinc-400">Back off and retry after the 60-second window resets.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
