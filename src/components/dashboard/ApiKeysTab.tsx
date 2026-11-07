"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { ApiKeyItem } from "./types";

interface ApiKeysTabProps {
  keys: ApiKeyItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateKey: (name: string) => Promise<{ rawKey?: string; error?: string }>;
  onRevokeKey: (id: string) => Promise<void>;
}

export function ApiKeysTab({
  keys,
  isLoading,
  onRefresh,
  onCreateKey,
  onRevokeKey,
}: ApiKeysTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPrefixId, setCopiedPrefixId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyPrefix = (prefix: string, id: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedPrefixId(id);
    setTimeout(() => setCopiedPrefixId(null), 2000);
  };

  const handleSubmitNewKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const result = await onCreateKey(newKeyName.trim());
      if (result.rawKey) {
        setCreatedRawKey(result.rawKey);
        setNewKeyName("");
      } else if (result.error) {
        alert(result.error);
      }
    } finally {
      setIsCreatingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Active API Access Keys
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Stateless Bearer keys for scripts, terminals, GitHub Actions, and production SDKs.
            </p>
          </div>

          <button
            onClick={() => {
              setCreatedRawKey(null);
              setNewKeyName("");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create New API Key</span>
          </button>
        </div>

        {/* Filter and Search */}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keys by label or prefix..."
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-9 pr-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Keys Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Key Label</th>
                <th className="px-4 py-3">Token Prefix</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Calls Metered</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 w-full rounded bg-white/[0.04]" />
                    </td>
                  </tr>
                ))
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="font-semibold text-white">No API keys found</div>
                      <p className="text-xs text-zinc-500">
                        Generate your first secret key to authenticate CLI scripts, CI/CD jobs, or backend calls.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.01] transition">
                    <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-blue-400" />
                      <span>{k.name}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-400">
                      <button
                        onClick={() => copyPrefix(k.key_prefix, k.id)}
                        className="flex items-center gap-1.5 hover:text-white transition group"
                        title="Click to copy prefix"
                      >
                        <span>{k.key_prefix}</span>
                        {copiedPrefixId === k.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-300">
                      {(k.requests_count || 0).toLocaleString()} calls
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => onRevokeKey(k.id)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        title="Revoke API Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#0c0e14] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            <h3 className="text-lg font-bold text-white mb-2">Create New API Key</h3>

            {!createdRawKey ? (
              <>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Give your secret key a clear label so you can recognize which service, GitHub Action, or script is using it.
                </p>
                <div className="mb-5">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Key Label / Application Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitNewKey()}
                    placeholder="e.g. Production CI/CD Pipeline"
                    className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitNewKey}
                    disabled={isCreatingKey || !newKeyName.trim()}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
                  >
                    {isCreatingKey ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 mb-4 text-xs text-amber-200 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Copy this secret key now. Only its SHA-256 hash is stored — you will not be able to view the plaintext token again!
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.1] bg-[#07090e] p-3 flex items-center justify-between gap-2 mb-6">
                  <span className="font-mono text-xs text-emerald-400 select-all truncate">
                    {createdRawKey}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600/30 transition shrink-0"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setCreatedRawKey(null);
                  }}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                >
                  Done, I Have Saved My Key
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
