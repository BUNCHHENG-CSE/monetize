import type { Config } from "tailwindcss";

/** Theme-aware color backed by an RGB-triplet CSS variable (supports /opacity modifiers). */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const zincShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/tool-engine/**/*.{js,ts,jsx,tsx,mdx}",
    "./monetize.config.ts",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutral scale flips between themes (see globals.css), so every existing
        // zinc-* class adapts automatically: zinc-950 is the page in dark, near-white in light.
        zinc: Object.fromEntries(zincShades.map((s) => [s, v(`zinc-${s}`)])),
        // "fg" = maximum-contrast foreground: white in dark mode, near-black in light mode.
        fg: v("fg"),
        background: v("background"),
        foreground: v("foreground"),
        border: v("border"),
        card: {
          DEFAULT: v("card"),
          hover: v("card-hover"),
          foreground: v("card-foreground"),
        },
        "card-foreground": v("card-foreground"),
        primary: {
          DEFAULT: v("primary"),
          foreground: v("primary-foreground"),
        },
        muted: {
          DEFAULT: v("muted"),
          foreground: v("muted-foreground"),
        },
        accent: {
          DEFAULT: v("accent"),
          foreground: v("accent-foreground"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
