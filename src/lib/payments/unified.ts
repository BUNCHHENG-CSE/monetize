import { monetizeConfig } from "@/../monetize.config";
import { createLemonCheckout, getLemonPortalUrl } from "./lemonsqueezy";
import { createStripeCheckout, createStripePortalSession } from "./stripe";

export async function createBillingCheckout({
  userId,
  userEmail,
  planId,
  redirectUrl,
}: {
  userId: string;
  userEmail: string;
  planId: string;
  redirectUrl: string;
}): Promise<string> {
  const plan = monetizeConfig.plans.find((p) => p.id === planId);
  if (!plan) {
    throw new Error(`Plan with ID "${planId}" not found in monetize.config.ts`);
  }

  const provider = monetizeConfig.providers.payments;

  if (provider === "lemonsqueezy") {
    const variantId = plan.lemonSqueezyVariantId;
    if (!variantId) {
      throw new Error(`Lemon Squeezy variantId missing for plan "${planId}"`);
    }
    return createLemonCheckout({
      userId,
      userEmail,
      variantId,
      redirectUrl,
    });
  } else if (provider === "stripe") {
    const priceId = plan.stripePriceId;
    if (!priceId) {
      throw new Error(`Stripe priceId missing for plan "${planId}"`);
    }
    return createStripeCheckout({
      userId,
      userEmail,
      priceId,
      redirectUrl,
    });
  }

  throw new Error(`Unsupported payment provider: ${provider}`);
}

export async function getBillingPortalUrl({
  customerId,
  provider,
  returnUrl,
}: {
  customerId: string;
  provider: "lemonsqueezy" | "stripe";
  returnUrl: string;
}): Promise<string> {
  if (provider === "lemonsqueezy") {
    return getLemonPortalUrl(customerId);
  } else if (provider === "stripe") {
    return createStripePortalSession({
      customerId,
      returnUrl,
    });
  }

  throw new Error(`Unknown payment provider: ${provider}`);
}
