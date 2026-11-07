import { runSqlOptimizer } from "./sql-optimizer";
import { runAiAgent } from "./ai-agent";
import { runWebScraper } from "./web-scraper";
import { runCodeSecurityAudit } from "./code-security";
import { runMediaGenerator } from "./media-generator";

export type ToolPresetKey =
  | "sql-optimizer"
  | "ai-agent"
  | "web-scraper"
  | "code-security"
  | "media-generator";

export interface PresetMetadata {
  id: ToolPresetKey;
  name: string;
  badge: string;
  description: string;
  defaultCreditCost: number;
  sampleInput: Record<string, any>;
}

export const AVAILABLE_PRESETS: Record<ToolPresetKey, PresetMetadata> = {
  "sql-optimizer": {
    id: "sql-optimizer",
    name: "SQL Optimizer & Index Advisor",
    badge: "Database",
    description: "Analyzes raw SQL queries, rewrites joins, projects columns, and recommends optimal B-tree indexes.",
    defaultCreditCost: 1,
    sampleInput: {
      prompt: "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
      options: { dialect: "postgres", strictMode: true },
    },
  },
  "ai-agent": {
    id: "ai-agent",
    name: "AI Prompt Engine & Summarizer",
    badge: "Generative AI",
    description: "Multi-model prompt orchestrator with structured entity extraction, tone classification, and summaries.",
    defaultCreditCost: 2,
    sampleInput: {
      prompt: "Review this deployment architecture and identify potential reliability bottlenecks.",
      options: { task: "review", format: "json" },
    },
  },
  "web-scraper": {
    id: "web-scraper",
    name: "Web Scraper & Metadata Extractor",
    badge: "Data API",
    description: "Extracts clean Markdown, OpenGraph cards, canonical tags, and structured text from any public URL.",
    defaultCreditCost: 1,
    sampleInput: {
      url: "https://news.ycombinator.com",
      options: { extractMarkdown: true, extractMetadata: true },
    },
  },
  "code-security": {
    id: "code-security",
    name: "Code Security & Secret Scanner",
    badge: "Security",
    description: "Scans source snippets for hardcoded tokens, SQL injection patterns, dangerous eval calls, and XSS risks.",
    defaultCreditCost: 1,
    sampleInput: {
      code: `const query = "SELECT * FROM users WHERE id = '" + req.query.id + "';";\nconst secret = "sk_live_9f82d10a9c8b77e2";`,
      options: { language: "typescript", strictness: "high" },
    },
  },
  "media-generator": {
    id: "media-generator",
    name: "Dynamic SVG / OpenGraph Card Generator",
    badge: "Media API",
    description: "Renders responsive SVG social share banners and badges dynamically with customizable themes.",
    defaultCreditCost: 1,
    sampleInput: {
      title: "TCT Monetize",
      options: { badge: "v2.0", width: 800, height: 420, format: "svg" },
    },
  },
};

export function isPresetKey(value: unknown): value is ToolPresetKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(AVAILABLE_PRESETS, value);
}

/** Single source of truth for what a preset costs (used for pre-flight reservation). */
export function getPresetCost(presetKey: ToolPresetKey): number {
  return AVAILABLE_PRESETS[presetKey]?.defaultCreditCost ?? 1;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

const MAX_TEXT_LENGTH = 50_000;

/** Which input field(s) each preset needs; the first non-empty one is used. */
const REQUIRED_FIELDS: Record<ToolPresetKey, string[]> = {
  "sql-optimizer": ["prompt", "code"],
  "ai-agent": ["prompt"],
  "web-scraper": ["url", "prompt"],
  "code-security": ["code", "prompt"],
  "media-generator": ["title", "prompt"],
};

/**
 * Validate input BEFORE credits are reserved so users are never charged for a
 * request that could not possibly succeed. Returns an empty array when valid.
 */
export function validatePresetInput(presetKey: ToolPresetKey, input: Record<string, any>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fields = REQUIRED_FIELDS[presetKey];
  const provided = fields.find((f) => typeof input[f] === "string" && input[f].trim().length > 0);

  if (!provided) {
    issues.push({
      path: fields[0],
      message: `Preset '${presetKey}' requires a non-empty string in ${fields.map((f) => `'${f}'`).join(" or ")}.`,
    });
  }

  for (const field of ["prompt", "code", "url", "title"]) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      issues.push({ path: field, message: `'${field}' must be a string.` });
    } else if (value.length > MAX_TEXT_LENGTH) {
      issues.push({ path: field, message: `'${field}' exceeds the maximum length of ${MAX_TEXT_LENGTH} characters.` });
    }
  }

  if (input.options !== undefined && (typeof input.options !== "object" || input.options === null || Array.isArray(input.options))) {
    issues.push({ path: "options", message: "'options' must be a JSON object." });
  }

  if (presetKey === "web-scraper" && provided) {
    const raw = String(input[provided]).trim();
    try {
      const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
    } catch {
      issues.push({ path: provided, message: `'${raw.slice(0, 80)}' is not a valid http(s) URL.` });
    }
  }

  return issues;
}

export async function executePresetLogic(
  presetKey: ToolPresetKey,
  input: any
): Promise<{ data: any; costInCredits: number }> {
  const costInCredits = getPresetCost(presetKey);
  switch (presetKey) {
    case "sql-optimizer":
      return { data: await runSqlOptimizer(input), costInCredits };
    case "ai-agent":
      return { data: await runAiAgent(input), costInCredits };
    case "web-scraper":
      return { data: await runWebScraper(input), costInCredits };
    case "code-security":
      return { data: await runCodeSecurityAudit(input), costInCredits };
    case "media-generator":
      return { data: await runMediaGenerator(input), costInCredits };
    default: {
      const exhaustive: never = presetKey;
      throw new Error(`Unknown preset: ${exhaustive}`);
    }
  }
}
