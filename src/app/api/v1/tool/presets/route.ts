import { NextResponse } from "next/server";
import { AVAILABLE_PRESETS } from "@/tool-engine/presets";
import { monetizeConfig } from "@/../monetize.config";

export const revalidate = 300;

/**
 * GET /api/v1/tool/presets
 * Public catalog of available tool presets, their credit costs, and sample payloads.
 */
export async function GET() {
  const presets = Object.values(AVAILABLE_PRESETS).map((preset) => ({
    id: preset.id,
    name: preset.name,
    badge: preset.badge,
    description: preset.description,
    creditCost: preset.defaultCreditCost,
    sampleInput: preset.sampleInput,
  }));

  return NextResponse.json({
    success: true,
    activePreset: monetizeConfig.toolEngine.activePreset || "sql-optimizer",
    defaultEndpoint: monetizeConfig.toolEngine.apiEndpoint,
    presets,
  });
}
