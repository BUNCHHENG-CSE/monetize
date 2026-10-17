import { NextRequest, NextResponse } from "next/server";
import { executeToolLogic, ToolInput, ToolContext } from "./index";
import {
  verifyApiKey,
  getUserProfile,
  getUserSubscription,
  deductCredits,
  logUsage,
} from "@/lib/supabase/service";
import { getAuthSession } from "@/lib/auth/clerk";
import { monetizeConfig } from "@/../monetize.config";

// Simple in-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string, limitPerMinute: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowDurationMs = 60 * 1000;
  const current = rateLimitMap.get(key) || { count: 0, windowStart: now };

  if (now - current.windowStart > windowDurationMs) {
    // Reset window
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limitPerMinute - 1 };
  }

  if (current.count >= limitPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  rateLimitMap.set(key, current);
  return { allowed: true, remaining: limitPerMinute - current.count };
}

export interface WrapperOptions {
  requirePlan?: string;
  defaultCreditCost?: number;
}

export async function handleToolExecution(
  req: NextRequest,
  options: WrapperOptions = {}
): Promise<NextResponse> {
  const startTime = Date.now();
  const defaultCost = options.defaultCreditCost || monetizeConfig.toolEngine.defaultCostInCredits || 1;

  try {
    // 1. Identify caller: API Key (Bearer header) or Web Session (Clerk)
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let apiKeyId: string | null = null;
    let authMethod: "api_key" | "session" = "api_key";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawKey = authHeader.replace("Bearer ", "").trim();
      const verification = await verifyApiKey(rawKey);
      if (!verification.valid || !verification.userId) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid, inactive, or revoked API key provided in Authorization header.",
          },
          { status: 401 }
        );
      }
      userId = verification.userId;
      apiKeyId = verification.keyId || null;
      authMethod = "api_key";
    } else {
      // Check session cookie
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Authentication required. Provide an API key via 'Authorization: Bearer sk_live_...' or sign in.",
          },
          { status: 401 }
        );
      }
      userId = session.userId;
      authMethod = "session";
    }

    // 2. Fetch User Profile & Subscription
    const profile = await getUserProfile(userId);
    const subscription = await getUserSubscription(userId);
    const activePlanId: string =
      (subscription?.status === "active"
        ? subscription.plan_id || subscription.planId
        : "free") || "free";

    const planConfig =
      monetizeConfig.plans.find((p) => p.id === activePlanId) ||
      monetizeConfig.plans[0];

    // Optional plan restriction check
    if (options.requirePlan && activePlanId !== options.requirePlan && activePlanId !== "scale") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `This endpoint requires the '${options.requirePlan.toUpperCase()}' plan. Current plan: '${activePlanId.toUpperCase()}'.`,
          upgradeUrl: `${monetizeConfig.tool.githubUrl ? "/dashboard" : "/#pricing"}`,
        },
        { status: 403 }
      );
    }

    // 3. Rate Limiting Check
    const rateLimitKey = `${userId}:${authMethod}`;
    const rateLimit = checkRateLimit(rateLimitKey, planConfig.rateLimitPerMin);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit of ${planConfig.rateLimitPerMin} requests/min exceeded for your plan (${planConfig.name}).`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": planConfig.rateLimitPerMin.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 4. Pre-check Credits
    const currentBalance = profile?.credits_balance ?? 0;
    if (currentBalance < defaultCost) {
      return NextResponse.json(
        {
          error: "Insufficient Credits",
          message: `You need at least ${defaultCost} credits to execute this operation. Current balance: ${currentBalance}.`,
          creditsBalance: currentBalance,
          topUpUrl: "/dashboard?tab=billing",
        },
        { status: 402 }
      );
    }

    // 5. Parse Input
    let input: ToolInput = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        input = await req.json();
      } catch (e) {
        input = {};
      }
    } else {
      const url = new URL(req.url);
      input = Object.fromEntries(url.searchParams.entries());
    }

    // 6. Execute Business Logic
    const context: ToolContext = {
      userId,
      authMethod,
      planId: activePlanId,
      creditsRemaining: currentBalance,
    };

    const output = await executeToolLogic(input, context);
    const finalCreditCost = output.costInCredits ?? defaultCost;

    // 7. Atomic Credit Deduction
    const deduction = await deductCredits(userId, finalCreditCost);
    const remainingBalance = deduction.success ? deduction.balance : Math.max(0, currentBalance - finalCreditCost);

    const durationMs = Date.now() - startTime;

    // 8. Asynchronous Usage Audit Logging
    logUsage({
      userId,
      apiKeyId,
      endpoint: req.nextUrl.pathname,
      creditsDeducted: finalCreditCost,
      durationMs,
      statusCode: 200,
      metadata: { planId: activePlanId, authMethod },
    }).catch(console.error);

    // 9. Return Response with Rich Developer Headers
    return NextResponse.json(
      {
        success: output.success,
        data: output.data,
        metadata: {
          ...output.metadata,
          durationMs,
          creditsDeducted: finalCreditCost,
          creditsRemaining: remainingBalance,
          plan: activePlanId,
        },
      },
      {
        status: 200,
        headers: {
          "X-Credits-Used": finalCreditCost.toString(),
          "X-Credits-Remaining": remainingBalance.toString(),
          "X-Execution-Time-Ms": durationMs.toString(),
          "X-RateLimit-Limit": planConfig.rateLimitPerMin.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error("Tool execution wrapper error:", error);
    const durationMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error?.message || "An unexpected error occurred during execution.",
      },
      { status: 500 }
    );
  }
}
