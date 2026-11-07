import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { updateUserPlan, getUserSubscription } from "@/lib/db/service";
import { monetizeConfig } from "@/../monetize.config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in or create an account" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "planId is required" },
        { status: 400 }
      );
    }

    const targetPlan = monetizeConfig.plans.find((p) => p.id === planId);
    if (!targetPlan) {
      return NextResponse.json(
        { success: false, error: `Plan "${planId}" not found in system configuration.` },
        { status: 404 }
      );
    }

    // Verify current subscription / rank
    const currentSub = await getUserSubscription(session.userId);
    const currentPlanId = (currentSub?.status === "active" ? currentSub.plan_id || currentSub.planId : null) || "free";

    const currentRank = monetizeConfig.plans.findIndex((p) => p.id === currentPlanId);
    const targetRank = monetizeConfig.plans.findIndex((p) => p.id === planId);

    if (currentPlanId === planId) {
      return NextResponse.json(
        { success: false, error: `You are already subscribed to the ${targetPlan.name} plan.` },
        { status: 400 }
      );
    }

    // Update the user's plan in DB / store
    await updateUserPlan(session.userId, planId, "active");

    return NextResponse.json({
      success: true,
      message: `Your subscription has been successfully downgraded to ${targetPlan.name}.`,
      plan: targetPlan.id,
      planName: targetPlan.name,
      previousPlan: currentPlanId,
      creditsPerMonth: targetPlan.creditsPerMonth,
      rateLimitPerMin: targetPlan.rateLimitPerMin,
    });
  } catch (error: any) {
    console.error("[api/billing/downgrade] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process plan downgrade." },
      { status: 500 }
    );
  }
}
