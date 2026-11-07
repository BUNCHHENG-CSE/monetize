import { NextRequest, NextResponse } from "next/server";
import { verifyLemonWebhookSignature } from "@/lib/payments/lemonsqueezy";
import { upsertSubscription, addCredits } from "@/lib/db/service";
import { monetizeConfig } from "@/../monetize.config";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    const isValid = verifyLemonWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Lemon Squeezy signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const data = payload.data;

    console.log(`[LemonSqueezy Webhook] Received event: ${eventName}`);

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const userId = customData?.user_id;
        const subId = data.id.toString();
        const customerId = data.attributes.customer_id.toString();
        const variantId = data.attributes.variant_id.toString();
        const status = data.attributes.status; // 'active', 'past_due', 'cancelled', etc.
        const currentPeriodEnd = data.attributes.renews_at || data.attributes.ends_at;

        // Match variant ID to plan
        const matchedPlan = monetizeConfig.plans.find(
          (p) => p.lemonSqueezyVariantId === variantId
        ) || monetizeConfig.plans[1]; // default to pro

        if (userId) {
          await upsertSubscription({
            id: subId,
            user_id: userId,
            provider: "lemonsqueezy",
            plan_id: matchedPlan.id,
            status: status === "cancelled" ? "canceled" : status,
            customer_id: customerId,
            variant_id: variantId,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: Boolean(data.attributes.cancelled),
          });

          // If new active subscription, award monthly credits
          if (eventName === "subscription_created" && status === "active") {
            await addCredits(userId, matchedPlan.creditsPerMonth);
          }
        }
        break;
      }

      case "subscription_cancelled": {
        const subId = data.id.toString();
        const userId = customData?.user_id;
        if (userId) {
          await upsertSubscription({
            id: subId,
            user_id: userId,
            provider: "lemonsqueezy",
            plan_id: "free",
            status: "canceled",
            customer_id: data.attributes.customer_id.toString(),
            variant_id: data.attributes.variant_id.toString(),
            current_period_end: data.attributes.ends_at,
            cancel_at_period_end: true,
          });
        }
        break;
      }

      case "order_created": {
        // One-time credit top-up pack purchase or Lifetime plan purchase
        const userId = customData?.user_id;
        const variantId = data.attributes.first_order_item?.variant_id?.toString();

        if (userId && variantId) {
          // Check if variant matches a lifetime or one-time plan
          const matchedPlan = monetizeConfig.plans.find(
            (p) => p.lemonSqueezyVariantId === variantId
          );
          if (matchedPlan) {
            await upsertSubscription({
              id: `sub_${userId}_${matchedPlan.id}`,
              user_id: userId,
              provider: "lemonsqueezy",
              plan_id: matchedPlan.id,
              status: "active",
              customer_id: data.attributes.customer_id?.toString() || `cust_${userId}`,
              variant_id: variantId,
              current_period_end: null,
              cancel_at_period_end: false,
            });
            await addCredits(userId, matchedPlan.creditsPerMonth);
            console.log(`[LemonSqueezy Webhook] Lifetime plan ${matchedPlan.id} activated for ${userId}`);
            break;
          }

          const pack = monetizeConfig.creditPacks.find(
            (p) => p.lemonSqueezyVariantId === variantId
          );
          if (pack) {
            await addCredits(userId, pack.credits);
            console.log(`[LemonSqueezy Webhook] Added ${pack.credits} credits to ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`[LemonSqueezy Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Lemon Squeezy webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
