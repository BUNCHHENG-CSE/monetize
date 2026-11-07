export interface MediaGeneratorInput {
  title?: string;
  prompt?: string;
  theme?: "dark" | "gradient" | "minimal";
  options?: {
    badge?: string;
    width?: number;
    height?: number;
    format?: "svg" | "json";
  };
}

export async function runMediaGenerator(input: MediaGeneratorInput) {
  const title = input.title || input.prompt || "High Velocity Developer Tool";
  const badge = input.options?.badge || "PROD READY";
  const theme = input.theme || "dark";
  const width = input.options?.width || 800;
  const height = input.options?.height || 420;

  const bgGradient =
    theme === "dark"
      ? `<rect width="${width}" height="${height}" rx="24" fill="#0c0e14"/><circle cx="700" cy="80" r="180" fill="#3b82f6" opacity="0.15" filter="blur(60px)"/>`
      : `<rect width="${width}" height="${height}" rx="24" fill="url(#grad)"/><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${bgGradient}
  <rect x="40" y="40" width="120" height="32" rx="16" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.3"/>
  <text x="56" y="61" fill="#60a5fa" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">${badge.toUpperCase()}</text>
  <text x="40" y="160" fill="#ffffff" font-family="system-ui, sans-serif" font-size="36" font-weight="800">${title}</text>
  <text x="40" y="210" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="18">Turn code into scalable SaaS APIs with billing, auth, and telemetry</text>
  <line x1="40" y1="340" x2="760" y2="340" stroke="#334155" stroke-width="1"/>
  <text x="40" y="375" fill="#64748b" font-family="monospace" font-size="13">Generated via TCT Monetize • 2026</text>
</svg>`;

  return {
    preset: "media-generator",
    dimensions: { width, height },
    theme,
    title,
    badge,
    contentType: "image/svg+xml",
    svgContent,
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`,
  };
}
