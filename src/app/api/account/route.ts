import { NextResponse } from "next/server";
import { getAuthSession, isClerkConfigured } from "@/lib/auth/clerk";
import { getOrCreateProfile, getUserSubscription } from "@/lib/db/service";
import { monetizeConfig } from "@/../monetize.config";

export const dynamic = "force-dynamic";

/**
 * GET /api/account
 * Current user's credit balance, plan and subscription status (for the dashboard).
 * In demo mode (no Clerk keys) this resolves to the demo developer.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "unauthorized", message: "Sign in to view your account." } },
        { status: 401 }
      );
    }

    const [profile, subscription] = await Promise.all([
      getOrCreateProfile(session.userId, session.email, session.name, session.imageUrl),
      getUserSubscription(session.userId),
    ]);

    const planId =
      (subscription?.status === "active" ? subscription.plan_id || subscription.planId : null) || "free";
    const plan = monetizeConfig.plans.find((p) => p.id === planId) || monetizeConfig.plans[0];
    const periodEnd = subscription?.current_period_end ?? subscription?.currentPeriodEnd ?? null;

    return NextResponse.json({
      success: true,
      demoMode: !isClerkConfigured,
      userId: session.userId,
      email: session.email,
      name: session.name,
      creditsBalance: profile.credits_balance ?? profile.creditsBalance ?? 0,
      plan: plan.id,
      planDetails: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        creditsPerMonth: plan.creditsPerMonth,
        rateLimitPerMin: plan.rateLimitPerMin,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            provider: subscription.provider,
            currentPeriodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end ?? subscription.cancelAtPeriodEnd ?? false),
          }
        : null,
    });
  } catch (error: any) {
    console.error("[api/account] failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "internal_error", message: error?.message || "Failed to load account." } },
      { status: 500 }
    );
  }
}
