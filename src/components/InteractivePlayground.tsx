"use client";

import { useState } from "react";
import { Play, Sparkles, CheckCircle2, Clock, Zap, AlertCircle } from "lucide-react";
import { monetizeConfig } from "@/../monetize.config";

export function InteractivePlayground() {
  const [prompt, setPrompt] = useState(
    monetizeConfig.toolEngine.sampleRequest.prompt ||
      "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(monetizeConfig.toolEngine.sampleResponse);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ durationMs: number; creditsUsed: number; status: number }>({
    durationMs: 42,
    creditsUsed: 1,
    status: 200,
  });

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    const start = Date.now();

    try {
      const res = await fetch("/api/v1/tool/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          options: { benchmark: true, dialect: "postgres" },
        }),
      });

      const data = await res.json();
      const durationMs = Date.now() - start;

      if (!res.ok) {
        setError(data.message || data.error || `HTTP ${res.status}`);
        setMetrics({ durationMs, creditsUsed: 0, status: res.status });
      } else {
        setResponse(data);
        setMetrics({
          durationMs,
          creditsUsed: data.metadata?.creditsDeducted || 1,
          status: res.status,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to contact execution engine");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Live Interactive Playground
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test the live tool endpoint. Automatically wrapped with auth, rate limits & credit deductions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 rounded-md bg-zinc-800/80 px-2.5 py-1 text-zinc-300 border border-zinc-700/50">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>{metrics.durationMs}ms</span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-zinc-800/80 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-3.5 w-3.5" />
            <span>-{metrics.creditsUsed} Credit</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Input Payload (SQL / Prompt / Code)</span>
            <button
              onClick={() =>
                setPrompt(
                  "SELECT * FROM accounts WHERE status = 'pending' ORDER BY created_at DESC;"
                )
              }
              className="text-blue-400 hover:text-blue-300 normal-case font-normal transition text-xs"
            >
              Load Example 2
            </button>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
            placeholder="Type your tool input payload..."
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500">
              Endpoint: <code className="text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded">POST /api/v1/tool/execute</code>
            </div>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Execute Tool</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Execution Output (JSON)</span>
            {metrics.status === 200 && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="h-3 w-3" /> HTTP 200 OK
              </span>
            )}
          </label>

          {error ? (
            <div className="h-full rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-mono text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200">Execution Error</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 overflow-auto max-h-[220px]">
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                <code>{JSON.stringify(response, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
