import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getUserSubscription } from "@/lib/db/service";
import { getBillingPortalUrl } from "@/lib/payments/unified";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await getUserSubscription(session.userId);
    const customerId = subscription?.customer_id || subscription?.customerId;
    if (!subscription || !customerId) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/dashboard`;

    const portalUrl = await getBillingPortalUrl({
      customerId,
      provider: subscription.provider as "lemonsqueezy" | "stripe",
      returnUrl,
    });

    return NextResponse.json({ portalUrl });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session", message: error.message },
      { status: 500 }
    );
  }
}
