export type ThemePreference = "light" | "dark" | "system";
export const STORAGE_KEY = "theme";
export const ORDER: ThemePreference[] = ["system", "light", "dark"];

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 * Keep in sync with applyTheme() in components/ThemeToggle.tsx.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}");var d=p==="dark"||((!p||p==="system")&&!window.matchMedia("(prefers-color-scheme: light)").matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",!d);}catch(e){document.documentElement.classList.add("dark");}})();`;

