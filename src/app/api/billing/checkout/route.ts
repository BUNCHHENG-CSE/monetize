import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { createBillingCheckout } from "@/lib/payments/unified";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/dashboard?payment=success`;

    const checkoutUrl = await createBillingCheckout({
      userId: session.userId,
      userEmail: session.email,
      planId,
      redirectUrl,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", message: error.message },
      { status: 500 }
    );
  }
}
