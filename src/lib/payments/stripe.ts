import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const isStripeConfigured = Boolean(
  stripeSecretKey &&
  stripeSecretKey !== "stripe_secret_key_placeholder"
);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })
  : null;

/**
 * Create a Stripe Checkout Session
 */
export async function createStripeCheckout({
  userId,
  userEmail,
  priceId,
  redirectUrl,
  mode = "subscription",
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  redirectUrl: string;
  mode?: "subscription" | "payment";
}): Promise<string> {
  if (!isStripeConfigured || !stripe) {
    return `${redirectUrl}?mock_checkout=stripe_success&price=${priceId}&user=${userId}`;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      priceId,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${redirectUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${redirectUrl}?canceled=true`,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout URL");
  }

  return session.url;
}

/**
 * Create Stripe Customer Portal Session
 */
export async function createStripePortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  if (!isStripeConfigured || !stripe) {
    return "/dashboard?portal_simulated=true";
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portalSession.url;
}

/**
 * Verify Stripe webhook event
 */
export function constructStripeWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe || !stripeWebhookSecret) {
    throw new Error("Stripe or webhook secret is not configured");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
}
