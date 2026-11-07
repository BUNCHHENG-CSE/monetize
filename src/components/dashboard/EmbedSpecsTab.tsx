"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  FileCode,
  Download,
  ExternalLink,
  Code2,
  Check,
  Copy,
} from "lucide-react";

export function EmbedSpecsTab() {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const iframeSnippet = `<iframe src="${origin}/embed?view=playground" width="100%" height="650" frameborder="0"></iframe>`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-purple-400 mb-1">
          <Share2 className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Distribution & Specs
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Embeddable Widgets & API Specifications
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Embed your tool playground or pricing table into external documentation sites (Mintlify, VitePress, Docusaurus, Nextra) or download full OpenAPI 3.1 & Postman specifications.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OpenAPI Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
                <FileCode className="h-5 w-5 text-blue-400" />
                <span>OpenAPI 3.1 & Postman Spec</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Machine-readable API definitions describing all routes, request schemas, status codes, and Bearer authentication.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/api/openapi?download=true"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-600/30 transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download openapi.json</span>
              </a>
              <a
                href="/api/openapi?format=postman&download=true"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] hover:text-white transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Export Postman Collection</span>
              </a>
            </div>
          </div>

          {/* Embed Iframe Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
                <Code2 className="h-5 w-5 text-emerald-400" />
                <span>Embeddable HTML Widget Snippet</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copy this iframe snippet to embed a live interactive sandbox widget in your Mintlify / GitBook / Docusaurus docs:
              </p>
            </div>

            <div className="mt-4">
              <pre className="p-3 rounded-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-zinc-300 overflow-x-auto">
                <code>{iframeSnippet}</code>
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(iframeSnippet);
                  setCopiedEmbed(true);
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                {copiedEmbed ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedEmbed ? "Copied Snippet!" : "Copy Embed Code"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
