import { NextRequest, NextResponse } from "next/server";
import { constructStripeWebhookEvent, isStripeConfigured } from "@/lib/payments/stripe";
import { upsertSubscription, addCredits } from "@/lib/supabase/service";
import { monetizeConfig } from "@/../monetize.config";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const event = constructStripeWebhookEvent(rawBody, signature);
    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'trialing', 'canceled', etc.
        const priceId = subscription.items.data[0]?.price.id;

        const matchedPlan =
          monetizeConfig.plans.find((p) => p.stripePriceId === priceId) ||
          monetizeConfig.plans[1];

        // Retrieve user_id from metadata
        const userId = subscription.metadata?.userId || subscription.metadata?.user_id;

        if (userId) {
          await upsertSubscription({
            id: subscription.id,
            user_id: userId,
            provider: "stripe",
            plan_id: matchedPlan.id,
            status: status === "active" ? "active" : "past_due",
            customer_id: customerId,
            variant_id: priceId,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
          });

          if (event.type === "customer.subscription.created" && status === "active") {
            await addCredits(userId, matchedPlan.creditsPerMonth);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || subscription.metadata?.user_id;
        if (userId) {
          await upsertSubscription({
            id: subscription.id,
            user_id: userId,
            provider: "stripe",
            plan_id: "free",
            status: "canceled",
            customer_id: subscription.customer as string,
            current_period_end: null,
            cancel_at_period_end: true,
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
