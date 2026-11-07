import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getGlobalUsageLogs } from "@/lib/db/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const logs = await getGlobalUsageLogs(limit);
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error("[api/admin/logs] GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load logs" },
      { status: 500 }
    );
  }
}
