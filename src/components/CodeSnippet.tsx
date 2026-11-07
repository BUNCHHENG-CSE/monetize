"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Check,
  Copy,
  ShieldCheck,
  Download,
} from "lucide-react";
import {
  generateSnippet,
  generateStandaloneSdkFile,
  SnippetLanguage,
} from "@/lib/snippets";

interface CodeSnippetProps {
  apiKey?: string;
  endpoint?: string;
  samplePayload?: Record<string, any>;
  preset?: string;
}

const LANGUAGE_TABS: { id: SnippetLanguage; label: string }[] = [
  { id: "curl", label: "cURL (CLI)" },
  { id: "ts", label: "TypeScript" },
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "php", label: "PHP" },
];

export function CodeSnippet({
  apiKey = "sk_live_9f82d10a9c8b77e2",
  endpoint = "/api/v1/tool/execute",
  samplePayload = {
    prompt:
      "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
    options: { dialect: "postgres", benchmark: true },
  },
  preset,
}: CodeSnippetProps) {
  const [activeTab, setActiveTab] = useState<SnippetLanguage>("curl");
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("https://api.yourdomain.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const fullEndpoint = `${baseUrl.replace(/\/$/, "")}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  const activeSnippet = useMemo(
    () =>
      generateSnippet({
        language: activeTab,
        baseUrl,
        endpoint,
        apiKey,
        body: samplePayload,
        preset,
      }),
    [activeTab, baseUrl, endpoint, apiKey, samplePayload, preset]
  );

  const copyCode = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadStandaloneSdk = (language: "ts" | "python") => {
    const { filename, content } = generateStandaloneSdkFile(language, apiKey, baseUrl);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(language);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Tab Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-white/[0.02] gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {LANGUAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Download Client SDK File button */}
          <button
            onClick={() => downloadStandaloneSdk(activeTab === "python" ? "python" : "ts")}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
            title="Download Standalone Client SDK file"
          >
            {downloadSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-blue-400" />
                <span>Download SDK ({activeTab === "python" ? ".py" : ".ts"})</span>
              </>
            )}
          </button>

          {/* Copy snippet button */}
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative p-4 sm:p-6 overflow-x-auto bg-[#07090e]">
        <pre className="font-mono text-xs text-zinc-300 leading-relaxed">
          <code>{activeSnippet}</code>
        </pre>
      </div>

      {/* Bottom info banner */}
      <div className="flex flex-wrap items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-5 py-2.5 text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Stateless Bearer Auth • SHA-256 Hashed • Zero Charge on Errors</span>
        </div>
        <div className="font-mono text-zinc-400">
          Target: <span className="text-zinc-300">{fullEndpoint}</span>
        </div>
      </div>
    </div>
  );
}
