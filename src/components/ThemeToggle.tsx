"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { ORDER, STORAGE_KEY, type ThemePreference } from "@/lib/theme";

function resolve(pref: ThemePreference): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(pref: ThemePreference, animate: boolean) {
  const root = document.documentElement;
  const theme = resolve(pref);
  if (animate) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 300);
  }
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [pref, setPref] = useState<ThemePreference | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    setPref(stored && ORDER.includes(stored) ? stored : "system");
  }, []);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("system", true);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(pref ?? "system") + 1) % ORDER.length];
    setPref(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, true);
  };

  const label = pref === "light" ? "Light" : pref === "dark" ? "Dark" : "System";
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}. Click to change.`}
      className={`flex h-8 w-8 items-center justify-center rounded-xl border border-fg/[0.08] bg-zinc-900/50 text-zinc-400 hover:text-fg hover:bg-zinc-800/80 transition ${className}`}
    >
      {/* Render a stable placeholder until mounted to avoid hydration mismatch */}
      {pref ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4" />}
    </button>
  );
}
