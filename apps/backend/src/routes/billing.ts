import express, { Router } from "express";
import { ZodError } from "zod";

import { getAuthenticatedUserId, requireJwtAuth } from "../middleware/auth";
import {
  billingCheckoutRequestSchema,
  billingPortalRequestSchema,
  discountCodeRedeemRequestSchema,
} from "../schema";
import {
  createBillingPortalSession,
  createCheckout,
  handleBillingWebhook,
} from "../services/billingService";
import { getBillingSummary } from "../services/creditService";
import {
  DiscountCodeError,
  redeemDiscountCode,
} from "../services/discountCodeService";

export const billingRouter = Router();
export const billingWebhookRouter = Router();

billingRouter.use(requireJwtAuth);

billingRouter.get("/me", (request, response) => {
  response.status(200).json(
    getBillingSummary(getAuthenticatedUserId(request)),
  );
});

billingRouter.post("/checkout", async (request, response) => {
  try {
    const input = billingCheckoutRequestSchema.parse(request.body ?? {});
    const checkout = await createCheckout(getAuthenticatedUserId(request), {
      item: input.item,
      successUrl: input.successUrl ?? null,
      cancelUrl: input.cancelUrl ?? null,
    });
    response.status(200).json(checkout);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid checkout payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Checkout session failed.",
    });
  }
});

billingRouter.post("/portal", async (request, response) => {
  try {
    const input = billingPortalRequestSchema.parse(request.body ?? {});
    const portal = await createBillingPortalSession(getAuthenticatedUserId(request), {
      returnUrl: input.returnUrl ?? null,
    });
    response.status(200).json(portal);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid billing portal payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Billing portal session failed.",
    });
  }
});

billingRouter.post("/discount-codes/redeem", (request, response) => {
  try {
    const input = discountCodeRedeemRequestSchema.parse(request.body ?? {});
    response.status(200).json(
      redeemDiscountCode(getAuthenticatedUserId(request), {
        code: input.code,
      }),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid discount code payload.",
        details: error.flatten(),
      });
      return;
    }

    if (error instanceof DiscountCodeError) {
      response.status(error.statusCode).json({
        error: error.message,
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Discount code redemption failed.",
    });
  }
});

billingWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  (request, response) => {
    try {
      const rawBody = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(request.body ?? {}));
      const result = handleBillingWebhook({
        rawBody,
        signatureHeader: request.get("stripe-signature"),
      });
      response.status(200).json(result);
    } catch (error) {
      response.status(400).json({
        error:
          error instanceof Error ? error.message : "Billing webhook failed.",
      });
    }
  },
);
