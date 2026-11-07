import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import {
  getAlertConfig,
  saveAlertConfig,
  dispatchOutboundAlert,
  WebhookConfig,
} from "@/lib/alerts/dispatcher";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.userId || "user_demo_123";

    const config = getAlertConfig(userId);
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.userId || "user_demo_123";

    const body = await req.json();
    const updatedConfig: WebhookConfig = {
      userId,
      endpointUrl: body.endpointUrl?.trim() || "",
      lowCreditThreshold: Number(body.lowCreditThreshold) || 150,
      notifyOnRateLimit: Boolean(body.notifyOnRateLimit),
      notifyOnLowCredits: Boolean(body.notifyOnLowCredits),
      format: body.format || "raw_json",
      isActive: Boolean(body.isActive),
    };

    const saved = saveAlertConfig(updatedConfig);
    return NextResponse.json({ success: true, config: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.userId || "user_demo_123";

    const body = await req.json().catch(() => ({}));
    const testEvent = body.event || "test.ping";

    const dispatchResult = await dispatchOutboundAlert({
      event: testEvent,
      userId,
      timestamp: new Date().toISOString(),
      data: {
        remainingCredits: 1420,
        plan: "pro",
        sampleReason: "Diagnostic verification test triggered from Developer Console.",
      },
      message: "Test ping from TCT Monetize. Webhook connectivity is verified!",
    });

    return NextResponse.json({
      success: dispatchResult.success,
      statusCode: dispatchResult.statusCode,
      error: dispatchResult.error,
      dispatchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
