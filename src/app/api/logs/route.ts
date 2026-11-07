import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getUserUsageLogs, UsageLog } from "@/lib/db/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.userId || "user_demo_123";

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam, 10))) : 50;
    const format = searchParams.get("format") || "json";
    const statusFilter = searchParams.get("status");

    let logs = await getUserUsageLogs(userId, limit);

    // Filter by status if provided
    if (statusFilter === "200") {
      logs = logs.filter((l) => (l.status_code ?? l.statusCode) === 200);
    } else if (statusFilter === "error") {
      logs = logs.filter((l) => (l.status_code ?? l.statusCode) !== 200);
    }

    // CSV Export
    if (format === "csv") {
      const headers = ["ID", "Timestamp", "Endpoint", "Status Code", "Duration (ms)", "Credits Deducted", "API Key ID"];
      const rows = logs.map((log) => [
        log.id,
        new Date(log.created_at ?? log.createdAt ?? Date.now()).toISOString(),
        log.endpoint,
        log.status_code ?? log.statusCode ?? 200,
        log.duration_ms ?? log.durationMs ?? 0,
        log.credits_deducted ?? log.creditsDeducted ?? 1,
        log.api_key_id ?? log.apiKeyId ?? "session",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="usage-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
