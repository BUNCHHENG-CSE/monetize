import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";
import { createHmac } from "crypto";

const apiKey = process.env.LEMONSQUEEZY_API_KEY || "";
const storeId = process.env.LEMONSQUEEZY_STORE_ID || "";
const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

export const isLemonSqueezyConfigured = Boolean(
  apiKey &&
  apiKey !== "lemonsqueezy_api_key_placeholder" &&
  storeId &&
  storeId !== "store_id_placeholder"
);

if (isLemonSqueezyConfigured) {
  lemonSqueezySetup({
    apiKey,
    onError: (error) => console.error("LemonSqueezy Error:", error),
  });
}

/**
 * Create a Lemon Squeezy hosted checkout session
 */
export async function createLemonCheckout({
  userId,
  userEmail,
  variantId,
  redirectUrl,
}: {
  userId: string;
  userEmail: string;
  variantId: string;
  redirectUrl: string;
}): Promise<string> {
  if (!isLemonSqueezyConfigured) {
    // Return simulated checkout URL for sandbox testing
    return `${redirectUrl}?mock_checkout=success&variant=${variantId}&user=${userId}`;
  }

  const session = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl,
      receiptButtonText: "Return to Developer Dashboard",
      receiptThankYouNote: "Thank you for subscribing to DevTool!",
    },
  });

  if (session.error) {
    console.error("LemonSqueezy checkout creation error:", session.error);
    throw new Error(session.error.message);
  }

  const checkoutUrl = session.data?.data.attributes.url;
  if (!checkoutUrl) {
    throw new Error("Failed to retrieve checkout URL from Lemon Squeezy");
  }

  return checkoutUrl;
}

/**
 * Get customer portal URL for subscription cancellation, card update, and invoices
 */
export async function getLemonPortalUrl(customerId: string): Promise<string> {
  if (!isLemonSqueezyConfigured) {
    return "/dashboard?portal_simulated=true";
  }

  const customer = await getCustomer(customerId);
  if (customer.error || !customer.data) {
    throw new Error("Failed to fetch Lemon Squeezy customer portal");
  }

  const portalUrl = customer.data.data.attributes.urls?.customer_portal;
  return portalUrl || "https://app.lemonsqueezy.com/my-orders";
}

/**
 * Verify HMAC SHA-256 signature on Lemon Squeezy Webhooks
 */
export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!webhookSecret || webhookSecret === "webhook_secret_placeholder") {
    // In local dev without secret, allow simulation
    return true;
  }

  const hmac = createHmac("sha256", webhookSecret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader || "", "utf8");

  if (digest.length !== signature.length) {
    return false;
  }

  return digest.equals(signature);
}
