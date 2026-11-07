/**
 * ==============================================================================
 * DROP-IN YOUR BUSINESS LOGIC HERE OR USE READY-MADE PRESETS
 * ==============================================================================
 * This is the ONLY file you need to modify to turn your script, algorithm, or
 * AI logic into a commercial developer product with billing and API keys!
 */

import {
  executePresetLogic,
  ToolPresetKey,
  AVAILABLE_PRESETS,
  isPresetKey,
  getPresetCost,
  validatePresetInput,
  ValidationIssue,
} from "./presets";
import { monetizeConfig } from "@/../monetize.config";

export interface ToolInput {
  prompt?: string;
  code?: string;
  url?: string;
  title?: string;
  preset?: ToolPresetKey;
  options?: Record<string, any>;
  [key: string]: any;
}

export interface ToolContext {
  userId: string;
  authMethod: "api_key" | "session";
  planId: string;
  creditsRemaining: number;
  /** Unique id of this request (also returned in the X-Request-Id header). */
  requestId?: string;
}

export interface ToolOutput {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
  costInCredits?: number; // Override default credit cost if needed
  /** Optional human-readable reason when success === false (no credits are charged). */
  error?: string;
}

export type { ValidationIssue };

/**
 * Resolve which preset this request targets.
 * - `{ preset }` in the body wins, otherwise `toolEngine.activePreset` from monetize.config.ts.
 * - Returns `null` when no preset is configured (=> your custom logic below runs).
 * - Returns `{ unknown }` when the caller asked for a preset that doesn't exist.
 */
export function resolvePreset(input: ToolInput): ToolPresetKey | null | { unknown: string } {
  if (input.preset !== undefined && input.preset !== null && input.preset !== ("" as any)) {
    return isPresetKey(input.preset) ? input.preset : { unknown: String(input.preset) };
  }
  const configured = monetizeConfig.toolEngine.activePreset;
  return configured && isPresetKey(configured) ? configured : null;
}

/**
 * Credits reserved BEFORE execution. If your custom logic has dynamic pricing,
 * return the maximum it could cost here and the real cost via `costInCredits`
 * (the difference is refunded automatically).
 */
export function estimateCreditCost(input: ToolInput): number {
  const preset = resolvePreset(input);
  if (preset && typeof preset === "string") return getPresetCost(preset);
  return monetizeConfig.toolEngine.defaultCostInCredits || 1;
}

/**
 * Validate input before any credits are reserved. Return [] when valid.
 * Customize the custom-logic branch to match your own input schema.
 */
export function validateToolInput(input: ToolInput): ValidationIssue[] {
  const preset = resolvePreset(input);
  if (preset && typeof preset === "string") return validatePresetInput(preset, input);

  // Custom logic validation: require at least a prompt or code payload.
  const payload = input.prompt ?? input.code;
  if (typeof payload !== "string" || payload.trim().length === 0) {
    return [{ path: "prompt", message: "Provide a non-empty 'prompt' or 'code' string." }];
  }
  return [];
}

/**
 * Execute your custom business logic.
 *
 * Examples of what you can build here:
 * 1. AI Prompt Engine & Code Reviewer (use 'ai-agent')
 * 2. SQL Query Optimizer & Index Advisor (use 'sql-optimizer')
 * 3. Web Scraping & Metadata Extractor (use 'web-scraper')
 * 4. Code Security & Secret Scanner (use 'code-security')
 * 5. Media & Dynamic OpenGraph Generator (use 'media-generator')
 * 6. Or write your own 100% custom function below!
 */
export async function executeToolLogic(
  input: ToolInput,
  context: ToolContext
): Promise<ToolOutput> {
  const startTime = Date.now();

  // 1. Check if caller selected a preset or if config defines a default preset
  const activePreset = resolvePreset(input);

  // If a recognized preset is chosen, dispatch to the optimized preset engine
  if (activePreset && typeof activePreset === "string" && AVAILABLE_PRESETS[activePreset]) {
    const { data, costInCredits } = await executePresetLogic(activePreset, input);

    return {
      success: true,
      data,
      metadata: {
        preset: activePreset,
        processedBy: `${monetizeConfig.tool.name} Engine v${monetizeConfig.tool.version}`,
        executionDurationMs: Date.now() - startTime,
        userPlan: context.planId,
      },
      costInCredits,
    };
  }

  // 2. Custom Business Logic Fallback (If not using presets)
  // Developers can directly insert their proprietary algorithms here!
  const query = input.prompt || input.code || "";
  await new Promise((resolve) => setTimeout(resolve, 80));

  return {
    success: true,
    data: {
      result: `Processed: ${query.slice(0, 50)}...`,
      status: "completed",
    },
    metadata: {
      processedBy: `${monetizeConfig.tool.name} Engine Custom Logic`,
      executionDurationMs: Date.now() - startTime,
      userPlan: context.planId,
    },
    costInCredits: 1,
  };
}
