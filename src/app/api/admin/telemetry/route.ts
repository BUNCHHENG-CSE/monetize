import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getAdminTelemetry } from "@/lib/db/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const telemetry = await getAdminTelemetry();
    return NextResponse.json({
      success: true,
      telemetry,
    });
  } catch (error: any) {
    console.error("[api/admin/telemetry] GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load telemetry" },
      { status: 500 }
    );
  }
}
