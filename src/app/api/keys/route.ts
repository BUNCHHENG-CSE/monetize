import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getUserApiKeys, createApiKey } from "@/lib/supabase/service";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await getUserApiKeys(session.userId);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const keyName = body.name?.trim() || "Default API Key";

    const { rawKey, keyInfo } = await createApiKey(session.userId, keyName);

    return NextResponse.json({
      success: true,
      rawKey, // Returned only once!
      key: keyInfo,
    });
  } catch (error: any) {
    console.error("API Key generation error:", error);
    return NextResponse.json(
      { error: "Failed to create API key", message: error.message },
      { status: 500 }
    );
  }
}
