import Link from "next/link";
import { Terminal, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col items-center justify-center p-6 bg-grid-pattern">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
        <Terminal className="h-6 w-6" />
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-2">404 - Not Found</h2>
      <p className="text-sm text-zinc-400 max-w-sm text-center mb-6">
        The requested developer resource or workspace could not be found.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
