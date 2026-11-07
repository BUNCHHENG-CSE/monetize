import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getOrCreateProfile } from "@/lib/db/service";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("sample_clerk_webhook_secret")) {
    return NextResponse.json({ message: "Clerk webhook skipped in simulation mode" });
  }

  // Get the headers
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err: any) {
    console.error("Error verifying Clerk webhook:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;
  console.log(`[Clerk Webhook] Received ${eventType}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address || "";
    const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

    if (id && primaryEmail) {
      await getOrCreateProfile(id, primaryEmail, name, image_url);
    }
  }

  return NextResponse.json({ success: true });
}
