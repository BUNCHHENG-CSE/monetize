import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { revokeApiKey } from "@/lib/db/service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = await revokeApiKey(session.userId, id);

  if (!success) {
    return NextResponse.json(
      { error: "Key not found or could not be revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "API key revoked successfully" });
}
