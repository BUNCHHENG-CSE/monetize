import { NextResponse } from "next/server";
import { getAuthSession, isClerkConfigured } from "@/lib/auth/clerk";
import { getUserProfile, getUserSubscription } from "@/lib/db/service";
import { monetizeConfig } from "@/../monetize.config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        isClerkConfigured,
      });
    }

    const [profile, subscription] = await Promise.all([
      getUserProfile(session.userId),
      getUserSubscription(session.userId),
    ]);

    const planId =
      (subscription?.status === "active" ? subscription.plan_id || subscription.planId : null) || "free";
    const plan = monetizeConfig.plans.find((p) => p.id === planId) || monetizeConfig.plans[0];

    return NextResponse.json({
      success: true,
      authenticated: true,
      isClerkConfigured,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name || profile?.name || session.email.split("@")[0],
        role: session.role || profile?.role || "user",
        status: session.status || profile?.status || "active",
        avatarUrl: session.imageUrl || profile?.avatar_url || profile?.avatarUrl || null,
        creditsBalance: profile?.credits_balance ?? profile?.creditsBalance ?? 0,
        plan: plan.id,
        planName: plan.name,
      },
    });
  } catch (error: any) {
    console.error("[api/auth/me] error:", error);
    return NextResponse.json(
      { success: false, authenticated: false, user: null, error: error.message },
      { status: 500 }
    );
  }
}
