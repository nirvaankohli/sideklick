import crypto from "node:crypto";

import { getDatabase } from "../db/index.ts";
import {
  addPurchasedCredits,
  grantFoundingBetaStatus,
  updateBillingProfile,
} from "./creditService.ts";
import { hasRedeemedFoundingBetaCode } from "./discountCodeService.ts";
import type { BillingPlan, SubscriptionStatus } from "./entitlementService.ts";

type StatementLike = {
  get(...args: unknown[]): unknown;
};

type DatabaseLike = {
  prepare(sql: string): StatementLike;
};

export type CheckoutItem =
  | "plus_monthly"
  | "plus_yearly"
  | "max_monthly"
  | "max_yearly"
  | "credits_50"
  | "finals_pack"
  | "founding_beta_max_lifetime";

export type CheckoutRequest = {
  item: CheckoutItem;
  successUrl?: string | null;
  cancelUrl?: string | null;
};

export type CheckoutResult = {
  provider: "stripe" | "mock";
  mode: "subscription" | "payment";
  checkoutUrl: string;
  item: CheckoutItem;
  mock: boolean;
};

export type BillingPortalRequest = {
  returnUrl?: string | null;
};

export type BillingPortalResult = {
  provider: "stripe" | "mock";
  portalUrl: string;
  mock: boolean;
};

type CheckoutItemDefinition = {
  item: CheckoutItem;
  mode: "subscription" | "payment";
  plan?: BillingPlan;
  purchasedCredits?: number;
  envPriceId: string;
};

const CHECKOUT_ITEMS: Record<CheckoutItem, CheckoutItemDefinition> = {
  plus_monthly: {
    item: "plus_monthly",
    mode: "subscription",
    plan: "plus",
    envPriceId: "STRIPE_PRICE_PLUS_MONTHLY",
  },
  plus_yearly: {
    item: "plus_yearly",
    mode: "subscription",
    plan: "plus",
    envPriceId: "STRIPE_PRICE_PLUS_YEARLY",
  },
  max_monthly: {
    item: "max_monthly",
    mode: "subscription",
    plan: "max",
    envPriceId: "STRIPE_PRICE_MAX_MONTHLY",
  },
  max_yearly: {
    item: "max_yearly",
    mode: "subscription",
    plan: "max",
    envPriceId: "STRIPE_PRICE_MAX_YEARLY",
  },
  credits_50: {
    item: "credits_50",
    mode: "payment",
    purchasedCredits: 50,
    envPriceId: "STRIPE_PRICE_CREDITS_50",
  },
  finals_pack: {
    item: "finals_pack",
    mode: "payment",
    purchasedCredits: 125,
    envPriceId: "STRIPE_PRICE_FINALS_PACK",
  },
  founding_beta_max_lifetime: {
    item: "founding_beta_max_lifetime",
    mode: "payment",
    plan: "max",
    envPriceId: "STRIPE_PRICE_FOUNDING_BETA_MAX_LIFETIME",
  },
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

function getConfiguredPublicUrl(): string {
  return (
    process.env.SIDEKLICK_PUBLIC_URL?.replace(/\/+$/, "") ||
    process.env.VITE_PUBLIC_WEB_URL?.replace(/\/+$/, "") ||
    "http://localhost:5173"
  );
}

function getUserEmail(userId: string, db: DatabaseLike): string | null {
  const row = db.prepare(
    `
      SELECT email
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  ).get(userId) as { email: string | null } | undefined;

  return row?.email ?? null;
}

function getStripePriceId(definition: CheckoutItemDefinition): string | null {
  const priceId = process.env[definition.envPriceId]?.trim();
  return priceId || null;
}

function getStripePortalConfigurationId(): string | null {
  const configurationId = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION?.trim();
  return configurationId || null;
}

function getMockCheckoutUrl(input: CheckoutRequest): string {
  const publicUrl = getConfiguredPublicUrl();
  const params = new URLSearchParams({
    item: input.item,
    mock: "true",
  });
  return `${publicUrl}/pricing?${params.toString()}`;
}

function getMockPortalUrl(): string {
  return `${getConfiguredPublicUrl()}/pricing?portal=mock`;
}

function getStoredStripeCustomerId(userId: string, db: DatabaseLike): string | null {
  const row = db.prepare(
    `
      SELECT billing_customer_id AS billingCustomerId
      FROM user_billing_profiles
      WHERE user_id = ?
      LIMIT 1
    `,
  ).get(userId) as { billingCustomerId: string | null } | undefined;

  return row?.billingCustomerId ?? null;
}

export async function createCheckout(
  userId: string,
  input: CheckoutRequest,
  db: DatabaseLike = getDatabase(),
): Promise<CheckoutResult> {
  const definition = CHECKOUT_ITEMS[input.item];
  if (!definition) {
    throw new Error("Unsupported checkout item.");
  }

  if (
    input.item === "founding_beta_max_lifetime" &&
    !hasRedeemedFoundingBetaCode(userId, db)
  ) {
    throw new Error(
      "Lifetime Max founding beta checkout requires a redeemed founding beta code.",
    );
  }

  const secretKey = getStripeSecretKey();
  const priceId = getStripePriceId(definition);
  const shouldMock =
    process.env.BILLING_MOCK_MODE === "true" ||
    (!secretKey || !priceId) && !isProduction();

  if (shouldMock) {
    return {
      provider: "mock",
      mode: definition.mode,
      checkoutUrl: getMockCheckoutUrl(input),
      item: input.item,
      mock: true,
    };
  }

  if (!secretKey || !priceId) {
    throw new Error("Stripe checkout is not configured for this item.");
  }

  const publicUrl = getConfiguredPublicUrl();
  const customerId = getStoredStripeCustomerId(userId, db);
  const body = new URLSearchParams();
  body.set("mode", definition.mode);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", input.successUrl || `${publicUrl}/pricing?checkout=success`);
  body.set("cancel_url", input.cancelUrl || `${publicUrl}/pricing?checkout=cancelled`);
  body.set("client_reference_id", userId);
  body.set("metadata[userId]", userId);
  body.set("metadata[item]", input.item);
  body.set("allow_promotion_codes", "true");
  if (definition.mode === "subscription") {
    body.set("subscription_data[metadata][userId]", userId);
    body.set("subscription_data[metadata][item]", input.item);
  } else {
    body.set("payment_intent_data[metadata][userId]", userId);
    body.set("payment_intent_data[metadata][item]", input.item);
  }

  const email = getUserEmail(userId, db);
  if (customerId) {
    body.set("customer", customerId);
  } else {
    if (definition.mode === "payment") {
      body.set("customer_creation", "always");
    }
    if (email) {
      body.set("customer_email", email);
    }
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json() as { url?: string; error?: { message?: string } };

  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error?.message || "Stripe checkout session creation failed.",
    );
  }

  return {
    provider: "stripe",
    mode: definition.mode,
    checkoutUrl: payload.url,
    item: input.item,
    mock: false,
  };
}

export async function createBillingPortalSession(
  userId: string,
  input: BillingPortalRequest = {},
  db: DatabaseLike = getDatabase(),
): Promise<BillingPortalResult> {
  const secretKey = getStripeSecretKey();
  const publicUrl = getConfiguredPublicUrl();
  const shouldMock =
    process.env.BILLING_MOCK_MODE === "true" || (!secretKey && !isProduction());
  if (shouldMock) {
    return {
      provider: "mock",
      portalUrl: getMockPortalUrl(),
      mock: true,
    };
  }

  if (!secretKey) {
    throw new Error("Stripe billing portal is not configured.");
  }

  const customerId = getStoredStripeCustomerId(userId, db);
  if (!customerId) {
    throw new Error("No Stripe customer exists for this account yet.");
  }

  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", input.returnUrl || `${publicUrl}/pricing?portal=return`);
  const configurationId = getStripePortalConfigurationId();
  if (configurationId) {
    body.set("configuration", configurationId);
  }

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json() as { url?: string; error?: { message?: string } };

  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error?.message || "Stripe billing portal session creation failed.",
    );
  }

  return {
    provider: "stripe",
    portalUrl: payload.url,
    mock: false,
  };
}

function parseStripeSignature(signatureHeader: string | null): {
  timestamp: string;
  signatures: string[];
} | null {
  if (!signatureHeader) {
    return null;
  }

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  return timestamp && signatures.length > 0
    ? { timestamp, signatures }
    : null;
}

function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
): void {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    if (isProduction()) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
    }
    return;
  }

  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) {
    throw new Error("Missing Stripe webhook signature.");
  }

  const timestampMs = Number(parsed.timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 300_000) {
    throw new Error("Stripe webhook signature timestamp is outside tolerance.");
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${parsed.timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const matched = parsed.signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return (
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });

  if (!matched) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}

function mapStripeStatus(status: unknown): SubscriptionStatus {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return status;
  }
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "canceled";
  }
  return "inactive";
}

function findUserIdBySubscriptionId(
  subscriptionId: string,
  db: DatabaseLike,
): string | null {
  const row = db.prepare(
    `
      SELECT user_id AS userId
      FROM user_billing_profiles
      WHERE billing_subscription_id = ?
      LIMIT 1
    `,
  ).get(subscriptionId) as { userId: string } | undefined;

  return row?.userId ?? null;
}

function findPlanByStripePriceId(priceId: string | null): BillingPlan | null {
  if (!priceId) {
    return null;
  }

  for (const definition of Object.values(CHECKOUT_ITEMS)) {
    if (definition.plan && getStripePriceId(definition) === priceId) {
      return definition.plan;
    }
  }

  return null;
}

function applyCheckoutSessionCompleted(
  session: Record<string, unknown>,
  db: DatabaseLike,
): void {
  const metadata = session.metadata as Record<string, string> | undefined;
  const userId =
    metadata?.userId ||
    (typeof session.client_reference_id === "string"
      ? session.client_reference_id
      : "");
  const item = metadata?.item as CheckoutItem | undefined;
  const definition = item ? CHECKOUT_ITEMS[item] : null;

  if (!userId || !definition) {
    throw new Error("Stripe checkout session is missing SideKlick metadata.");
  }

  if (definition.purchasedCredits) {
    addPurchasedCredits(userId, definition.purchasedCredits, {
      source: item,
      idempotencyKey:
        typeof session.id === "string" ? `stripe:${session.id}` : undefined,
      db,
    });
    updateBillingProfile(userId, {
      billingProvider: "stripe",
      billingCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
    }, db);
    return;
  }

  if (item === "founding_beta_max_lifetime") {
    grantFoundingBetaStatus(userId, "founding_beta_max", db);
    updateBillingProfile(userId, {
      billingProvider: "stripe",
      billingCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
    }, db);
    return;
  }

  if (definition.plan) {
    updateBillingProfile(userId, {
      plan: definition.plan,
      subscriptionStatus: "active",
      billingProvider: "stripe",
      billingCustomerId:
        typeof session.customer === "string" ? session.customer : null,
      billingSubscriptionId:
        typeof session.subscription === "string" ? session.subscription : null,
    }, db);
  }
}

function applySubscriptionEvent(
  subscription: Record<string, unknown>,
  db: DatabaseLike,
): void {
  const subscriptionId =
    typeof subscription.id === "string" ? subscription.id : "";
  if (!subscriptionId) {
    return;
  }

  const userId = findUserIdBySubscriptionId(subscriptionId, db);
  if (!userId) {
    return;
  }

  const items = subscription.items as
    | { data?: Array<{ price?: { id?: string } }> }
    | undefined;
  const priceId = items?.data?.[0]?.price?.id ?? null;
  const plan = findPlanByStripePriceId(priceId);
  updateBillingProfile(userId, {
    plan: plan ?? undefined,
    subscriptionStatus: mapStripeStatus(subscription.status),
    billingProvider: "stripe",
    billingCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : null,
    billingSubscriptionId: subscriptionId,
  }, db);
}

export function handleBillingWebhook(
  input: {
    rawBody: Buffer;
    signatureHeader: string | null;
  },
  db: DatabaseLike = getDatabase(),
): { received: true; eventType: string } {
  verifyStripeSignature(input.rawBody, input.signatureHeader);

  const event = JSON.parse(input.rawBody.toString("utf8")) as {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  const eventType = event.type || "unknown";
  const object = event.data?.object;

  if (eventType === "checkout.session.completed" && object) {
    applyCheckoutSessionCompleted(object, db);
  }

  if (
    (eventType === "customer.subscription.updated" ||
      eventType === "customer.subscription.deleted") &&
    object
  ) {
    applySubscriptionEvent(object, db);
  }

  return {
    received: true,
    eventType,
  };
}
