"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Terminal } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 animate-pulse">
        <Terminal className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-white">Signing out of session...</p>
      <p className="text-xs text-zinc-500 mt-1">Clearing credentials and redirecting to login.</p>
    </div>
  );
}
