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
  const creditPack = !plan ? monetizeConfig.creditPacks.find((cp) => cp.id === planId) : null;

  if (!plan && !creditPack) {
    throw new Error(`Plan or credit pack with ID "${planId}" not found in monetize.config.ts`);
  }

  const provider = monetizeConfig.providers.payments;

  if (provider === "lemonsqueezy") {
    const variantId = plan?.lemonSqueezyVariantId || creditPack?.lemonSqueezyVariantId;
    if (!variantId) {
      throw new Error(`Lemon Squeezy variantId missing for "${planId}"`);
    }
    return createLemonCheckout({
      userId,
      userEmail,
      variantId,
      redirectUrl,
    });
  } else if (provider === "stripe") {
    const priceId = plan?.stripePriceId || creditPack?.stripePriceId;
    if (!priceId) {
      throw new Error(`Stripe priceId missing for "${planId}"`);
    }
    const isOneTime = Boolean(creditPack || plan?.interval === "one-time");
    return createStripeCheckout({
      userId,
      userEmail,
      priceId,
      redirectUrl,
      mode: isOneTime ? "payment" : "subscription",
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
