import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  executeToolLogic,
  estimateCreditCost,
  resolvePreset,
  validateToolInput,
  ToolInput,
  ToolContext,
  ToolOutput,
  ValidationIssue,
} from "./index";
import { AVAILABLE_PRESETS } from "./presets";
import {
  verifyApiKey,
  getUserProfile,
  getOrCreateProfile,
  getUserSubscription,
  deductCredits,
  addCredits,
  logUsage,
} from "@/lib/db/service";
import { getAuthSession } from "@/lib/auth/clerk";
import { monetizeConfig } from "@/../monetize.config";
import { dispatchOutboundAlert } from "@/lib/alerts/dispatcher";

// -----------------------------------------------------------------------------
// Rate limiting (in-memory sliding-window counter)
// -----------------------------------------------------------------------------
// NOTE: in-memory state is per server instance. On multi-instance / serverless
// deployments swap this for a shared store (e.g. Upstash Redis) with the same
// interface.
const WINDOW_MS = 60 * 1000;
const MAX_TRACKED_KEYS = 10_000;
const rateLimitMap = new Map<string, { windowStart: number; current: number; previous: number }>();

function checkRateLimit(
  key: string,
  limitPerMinute: number
): { allowed: boolean; remaining: number; resetAt: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);
  let entry = rateLimitMap.get(key);

  if (!entry || entry.windowStart < windowStart - WINDOW_MS) {
    entry = { windowStart, current: 0, previous: 0 };
  } else if (entry.windowStart < windowStart) {
    entry = { windowStart, current: 0, previous: entry.current };
  }

  // Weighted count across the previous and current fixed windows = sliding window approximation.
  const elapsedRatio = (now - windowStart) / WINDOW_MS;
  const weighted = entry.previous * (1 - elapsedRatio) + entry.current;
  const resetAt = windowStart + WINDOW_MS;

  if (weighted >= limitPerMinute) {
    rateLimitMap.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  entry.current += 1;
  rateLimitMap.set(key, entry);

  // Prevent unbounded memory growth: evict stale entries when the map gets large.
  if (rateLimitMap.size > MAX_TRACKED_KEYS) {
    for (const [k, v] of rateLimitMap) {
      if (v.windowStart < windowStart - WINDOW_MS) rateLimitMap.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, Math.floor(limitPerMinute - weighted - 1)),
    resetAt,
    retryAfterSeconds: 0,
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const MAX_BODY_BYTES = 1_000_000; // 1 MB

export type ToolErrorCode =
  | "invalid_input"
  | "unknown_preset"
  | "unauthorized"
  | "insufficient_credits"
  | "plan_required"
  | "payload_too_large"
  | "rate_limited"
  | "tool_failed"
  | "internal_error";

function errorResponse(
  requestId: string,
  status: number,
  code: ToolErrorCode,
  message: string,
  options: { hint?: string; extra?: Record<string, any>; headers?: Record<string, string> } = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      requestId,
      error: { code, message, ...(options.hint ? { hint: options.hint } : {}), docsUrl: "/docs#errors" },
      ...(options.extra || {}),
    },
    { status, headers: { "X-Request-Id": requestId, ...(options.headers || {}) } }
  );
}

class InputParseError extends Error {
  constructor(public status: 400 | 413, message: string) {
    super(message);
  }
}

async function parseInput(req: NextRequest): Promise<ToolInput> {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new InputParseError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes.`);
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return Object.fromEntries(req.nextUrl.searchParams.entries());
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new InputParseError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes.`);
  }
  if (!raw.trim()) {
    // Allow query-string params on body-less POSTs.
    return Object.fromEntries(req.nextUrl.searchParams.entries());
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InputParseError(400, "Request body is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new InputParseError(400, "Request body must be a JSON object.");
  }
  return parsed as ToolInput;
}

/** Plans are ordered cheapest → most expensive in monetize.config.ts; higher tiers include lower ones. */
function planSatisfies(activePlanId: string, requiredPlanId: string): boolean {
  if (activePlanId === "lifetime") return true;
  const ids = monetizeConfig.plans.map((p) => p.id);
  const active = ids.indexOf(activePlanId);
  const required = ids.indexOf(requiredPlanId);
  if (required === -1) return true;
  return active >= required;
}

export interface WrapperOptions {
  requirePlan?: string;
  defaultCreditCost?: number;
}

// -----------------------------------------------------------------------------
// Main wrapper
// -----------------------------------------------------------------------------
export async function handleToolExecution(
  req: NextRequest,
  options: WrapperOptions = {}
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = `req_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  // State needed for refunds / logging if something fails mid-flight.
  let userId: string | null = null;
  let apiKeyId: string | null = null;
  let reservedCredits = 0;
  let presetForLog: string | null = null;
  let activePlanId = "free";

  const audit = (statusCode: number, creditsDeducted: number, extra: Record<string, any> = {}) => {
    if (!userId) return;
    logUsage({
      userId,
      apiKeyId,
      endpoint: req.nextUrl.pathname,
      creditsDeducted,
      durationMs: Date.now() - startTime,
      statusCode,
      metadata: { requestId, preset: presetForLog, planId: activePlanId, ...extra },
    }).catch(console.error);
  };

  try {
    // 1. Identify caller: API Key (Bearer header) or Web Session (Clerk)
    const authHeader = req.headers.get("authorization");
    let authMethod: "api_key" | "session" = "api_key";
    let sessionEmail: string | null = null;
    let sessionName: string | null = null;

    if (authHeader && /^Bearer\s+/i.test(authHeader)) {
      const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();
      const verification = await verifyApiKey(rawKey);
      if (!verification.valid || !verification.userId) {
        return errorResponse(requestId, 401, "unauthorized", "Invalid, inactive, or revoked API key.", {
          hint: "Create a new key in /dashboard (API Keys tab) and send it as 'Authorization: Bearer sk_live_...'.",
        });
      }
      userId = verification.userId;
      apiKeyId = verification.keyId || null;
    } else {
      const session = await getAuthSession();
      if (!session) {
        return errorResponse(requestId, 401, "unauthorized", "Authentication required.", {
          hint: "Send 'Authorization: Bearer sk_live_...' (create a key in /dashboard) or sign in.",
        });
      }
      userId = session.userId;
      sessionEmail = session.email;
      sessionName = session.name;
      authMethod = "session";
    }

    // 2. Parse & validate input BEFORE touching credits (cheap failures cost nothing)
    let input: ToolInput;
    try {
      input = await parseInput(req);
    } catch (e) {
      if (e instanceof InputParseError) {
        return e.status === 413
          ? errorResponse(requestId, 413, "payload_too_large", e.message, { extra: { maxBytes: MAX_BODY_BYTES } })
          : errorResponse(requestId, 400, "invalid_input", e.message, {
              hint: "Send a JSON object with Content-Type: application/json.",
              extra: { issues: [{ path: "", message: e.message }] },
            });
      }
      throw e;
    }

    const preset = resolvePreset(input);
    if (preset && typeof preset === "object") {
      return errorResponse(requestId, 400, "unknown_preset", `Unknown preset '${preset.unknown}'.`, {
        hint: "Omit 'preset' to use the default, or pick one of availablePresets.",
        extra: { availablePresets: Object.keys(AVAILABLE_PRESETS) },
      });
    }
    presetForLog = preset;

    const issues: ValidationIssue[] = validateToolInput(input);
    if (issues.length > 0) {
      return errorResponse(requestId, 400, "invalid_input", issues[0].message, {
        hint: preset ? `See GET /api/v1/tool/presets for a sample '${preset}' request.` : undefined,
        extra: { issues },
      });
    }

    // 3. Fetch profile & subscription in parallel
    const [existingProfile, subscription] = await Promise.all([
      getUserProfile(userId),
      getUserSubscription(userId),
    ]);
    const profile =
      existingProfile ??
      (authMethod === "session" && sessionEmail
        ? await getOrCreateProfile(userId, sessionEmail, sessionName)
        : null);

    activePlanId =
      (subscription?.status === "active" ? subscription.plan_id || subscription.planId : "free") || "free";
    const planConfig = monetizeConfig.plans.find((p) => p.id === activePlanId) || monetizeConfig.plans[0];

    // Optional plan restriction check
    if (options.requirePlan && !planSatisfies(activePlanId, options.requirePlan)) {
      return errorResponse(
        requestId,
        403,
        "plan_required",
        `This endpoint requires the '${options.requirePlan}' plan or higher (current: '${activePlanId}').`,
        {
          hint: "Upgrade from the Billing tab in your dashboard.",
          extra: { requiredPlan: options.requirePlan, currentPlan: activePlanId, upgradeUrl: "/dashboard?tab=billing" },
        }
      );
    }

    // 4. Rate limiting (per user, shared across API keys and sessions)
    const rateLimit = checkRateLimit(userId, planConfig.rateLimitPerMin);
    const rateHeaders = {
      "X-RateLimit-Limit": planConfig.rateLimitPerMin.toString(),
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(rateLimit.resetAt / 1000).toString(),
    };
    if (!rateLimit.allowed) {
      dispatchOutboundAlert({
        event: "rate_limit.exceeded",
        userId,
        timestamp: new Date().toISOString(),
        data: { limit: planConfig.rateLimitPerMin, plan: activePlanId, requestId },
        message: `Rate limit of ${planConfig.rateLimitPerMin} requests/min exceeded for user on plan '${activePlanId}'.`,
      }).catch(console.error);
      audit(429, 0, { errorCode: "rate_limited" });

      return errorResponse(
        requestId,
        429,
        "rate_limited",
        `Rate limit of ${planConfig.rateLimitPerMin} requests/min exceeded for your plan (${planConfig.name}).`,
        {
          hint: `Retry in ${rateLimit.retryAfterSeconds}s, or upgrade for a higher limit.`,
          extra: { retryAfterSeconds: rateLimit.retryAfterSeconds },
          headers: { ...rateHeaders, "Retry-After": rateLimit.retryAfterSeconds.toString() },
        }
      );
    }

    // 5. Atomically RESERVE credits up-front (prevents concurrent overdrafts and free rides)
    const estimatedCost = Math.max(0, options.defaultCreditCost ?? estimateCreditCost(input));
    const balanceBefore = profile?.credits_balance ?? profile?.creditsBalance ?? 0;
    const insufficient = () =>
      errorResponse(
        requestId,
        402,
        "insufficient_credits",
        `This request costs ${estimatedCost} credit(s) but your balance is ${balanceBefore}.`,
        {
          hint: "Buy a credit pack or upgrade your plan in the Billing tab.",
          extra: { creditsBalance: balanceBefore, creditsRequired: estimatedCost, topUpUrl: "/dashboard?tab=billing" },
          headers: rateHeaders,
        }
      );

    if (balanceBefore < estimatedCost) return insufficient();

    let balanceAfterReserve = balanceBefore;
    if (estimatedCost > 0) {
      const reservation = await deductCredits(userId, estimatedCost);
      if (!reservation.success) return insufficient();
      reservedCredits = estimatedCost;
      balanceAfterReserve = reservation.balance;
    }

    // 6. Execute business logic
    const context: ToolContext = {
      userId,
      authMethod,
      planId: activePlanId,
      creditsRemaining: balanceAfterReserve,
      requestId,
    };
    const output: ToolOutput = await executeToolLogic(input, context);

    // 7. Settle: refund on failure, reconcile if the actual cost differs from the estimate
    if (!output.success) {
      if (reservedCredits > 0) await addCredits(userId, reservedCredits);
      reservedCredits = 0;
      audit(422, 0, { errorCode: "tool_failed" });
      return errorResponse(requestId, 422, "tool_failed", output.error || "The tool could not process this input.", {
        hint: "No credits were charged for this request.",
        extra: { data: output.data ?? null },
        headers: rateHeaders,
      });
    }

    const actualCost = Math.max(0, output.costInCredits ?? reservedCredits);
    let remainingBalance = balanceAfterReserve;
    if (actualCost < reservedCredits) {
      const refund = await addCredits(userId, reservedCredits - actualCost);
      if (refund.success) remainingBalance = refund.balance;
    } else if (actualCost > reservedCredits) {
      // Charge the extra if possible; never fail an already-completed request over it.
      const extra = await deductCredits(userId, actualCost - reservedCredits);
      if (extra.success) remainingBalance = extra.balance;
    }
    reservedCredits = 0;

    const durationMs = Date.now() - startTime;
    audit(200, actualCost, { authMethod });

    // 8. Low Balance Outbound Webhook Check
    const thresholdPercent = monetizeConfig.alerts?.lowCreditThresholdPercent ?? 15;
    const lowBalanceThreshold = Math.min(100, Math.floor(planConfig.creditsPerMonth * (thresholdPercent / 100)));
    if (remainingBalance <= lowBalanceThreshold && balanceBefore > lowBalanceThreshold) {
      // Only fire when crossing the threshold, not on every subsequent call.
      dispatchOutboundAlert({
        event: "credits.low_balance",
        userId,
        timestamp: new Date().toISOString(),
        data: { remainingBalance, threshold: lowBalanceThreshold, plan: activePlanId, lastCost: actualCost },
        message: `Low credits warning: ${remainingBalance} credits remain in your balance (threshold: ${lowBalanceThreshold}).`,
      }).catch(console.error);
    }

    // 9. Return response with rich developer headers
    return NextResponse.json(
      {
        success: true,
        requestId,
        data: output.data,
        metadata: {
          ...output.metadata,
          preset: preset ?? output.metadata?.preset ?? null,
          durationMs,
          creditsDeducted: actualCost,
          creditsRemaining: remainingBalance,
          plan: activePlanId,
          ...(remainingBalance <= lowBalanceThreshold
            ? { warning: `Low balance: ${remainingBalance} credits left. Top up at /dashboard?tab=billing` }
            : {}),
        },
      },
      {
        status: 200,
        headers: {
          ...rateHeaders,
          "X-Request-Id": requestId,
          "X-Credits-Used": actualCost.toString(),
          "X-Credits-Remaining": remainingBalance.toString(),
          "X-Execution-Time-Ms": durationMs.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] Tool execution wrapper error:`, error);
    // Never keep credits for a request that crashed.
    if (userId && reservedCredits > 0) {
      await addCredits(userId, reservedCredits).catch(console.error);
    }
    audit(500, 0, { errorCode: "internal_error" });
    return errorResponse(
      requestId,
      500,
      "internal_error",
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred during execution."
        : error?.message || "An unexpected error occurred during execution.",
      { hint: `No credits were charged. Include requestId ${requestId} when contacting support.` }
    );
  }
}
