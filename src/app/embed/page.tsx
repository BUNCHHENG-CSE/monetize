"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InteractivePlayground } from "@/components/InteractivePlayground";
import { PricingTable } from "@/components/PricingTable";
import { monetizeConfig } from "@/../monetize.config";
import { Terminal, CreditCard, Sparkles } from "lucide-react";

function EmbedContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "playground";
  const theme = searchParams.get("theme") || "dark";

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 ${
        theme === "transparent" ? "bg-transparent" : "bg-[#08090c]"
      } text-zinc-100 font-sans`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                {monetizeConfig.tool.name}
              </div>
              <div className="text-[11px] text-zinc-400">
                Powered by TCT Monetize
              </div>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Visit Full Console &rarr;
          </a>
        </div>

        {view === "pricing" ? (
          <div>
            <PricingTable />
          </div>
        ) : (
          <div>
            <InteractivePlayground />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400 text-sm">Loading widget...</div>}>
      <EmbedContent />
    </Suspense>
  );
}
