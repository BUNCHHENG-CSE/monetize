"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeSnippetProps {
  apiKey?: string;
  endpoint?: string;
  samplePayload?: Record<string, any>;
}

export function CodeSnippet({
  apiKey = "sk_live_your_api_key_here",
  endpoint = "/api/v1/tool/execute",
  samplePayload = { prompt: "SELECT * FROM users JOIN orders ON users.id = orders.user_id" },
}: CodeSnippetProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "ts" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://api.yourdomain.com";
  const fullEndpoint = `${baseUrl}${endpoint}`;
  const payloadStr = JSON.stringify(samplePayload, null, 2);

  const snippets = {
    curl: `curl -X POST "${fullEndpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload)}'`,

    ts: `import fetch from "node-fetch";

const response = await fetch("${fullEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${payloadStr}),
});

const result = await response.json();
console.log("Response:", result.data);
console.log("Credits remaining:", response.headers.get("X-Credits-Remaining"));`,

    python: `import requests

url = "${fullEndpoint}"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(samplePayload, null, 4)}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print("Status:", response.status_code)
print("Data:", data.get("data"))
print("Credits remaining:", response.headers.get("X-Credits-Remaining"))`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden text-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <div className="flex gap-1">
            {(["curl", "ts", "python"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition ${
                  activeTab === tab
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab === "curl" ? "cURL" : tab === "ts" ? "TypeScript" : "Python"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="font-mono">Copy Code</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
        <code>{snippets[activeTab]}</code>
      </pre>
    </div>
  );
}
