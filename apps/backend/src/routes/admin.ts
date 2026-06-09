import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";

import {
  discountCodeCreateRequestSchema,
  foundingBetaGrantRequestSchema,
  webAnalyticsAdminQuerySchema,
} from "../schema";
import { grantFoundingBetaStatus } from "../services/creditService";
import { createDiscountCode } from "../services/discountCodeService";
import {
  getWebAnalyticsSummary,
  listRecentWebVisits,
} from "../services/webAnalyticsService";

export const adminRouter = Router();

function getAdminSecret(): string {
  return process.env.SIDEKLICK_ADMIN_SECRET?.trim() || "";
}

function requireAdminSecret(request: Request, response: Response): boolean {
  const expectedSecret = getAdminSecret();
  if (!expectedSecret) {
    response.status(403).json({
      error: "Admin grants require SIDEKLICK_ADMIN_SECRET.",
    });
    return false;
  }

  if (request.get("x-sideklick-admin-secret") !== expectedSecret) {
    response.status(403).json({
      error: "Invalid admin secret.",
    });
    return false;
  }

  return true;
}

adminRouter.post("/founding-beta", (request, response) => {
  if (!requireAdminSecret(request, response)) {
    return;
  }

  try {
    const input = foundingBetaGrantRequestSchema.parse(request.body ?? {});
    response.status(200).json(
      grantFoundingBetaStatus(input.userId, input.status),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid founding beta grant payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Founding beta grant failed.",
    });
  }
});

adminRouter.post("/discount-codes", (request, response) => {
  if (!requireAdminSecret(request, response)) {
    return;
  }

  try {
    const input = discountCodeCreateRequestSchema.parse(request.body ?? {});
    response.status(201).json(
      createDiscountCode({
        code: input.code,
        codeType: input.codeType,
        label: input.label,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt,
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

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Discount code creation failed.",
    });
  }
});

adminRouter.get("/web-visits", (request, response) => {
  if (!requireAdminSecret(request, response)) {
    return;
  }

  try {
    const input = webAnalyticsAdminQuerySchema.parse(request.query ?? {});
    response.status(200).json({
      summary: getWebAnalyticsSummary(input),
      recentVisits: listRecentWebVisits(input),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid web analytics query.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Web analytics query failed.",
    });
  }
});
