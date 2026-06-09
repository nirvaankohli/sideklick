import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../middleware/auth";
import {
  EntitlementError,
  InsufficientCreditsError,
  runWithCreditCharge,
} from "../services/creditService";
import type { CreditActionType } from "../services/entitlementService";

export function getCreditIdempotencyKey(request: Request): string | null {
  const headerValue = request.get("x-idempotency-key")?.trim();
  return headerValue || null;
}

export async function runChargedAction<T>(
  request: Request,
  input: {
    actionType: CreditActionType;
    relatedEntityType?: string | null;
    relatedEntityId?: string | number | null;
  },
  action: () => Promise<T>,
): Promise<T> {
  return runWithCreditCharge(
    {
      userId: getAuthenticatedUserId(request),
      actionType: input.actionType,
      idempotencyKey: getCreditIdempotencyKey(request),
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
    action,
  );
}

export function sendCreditError(response: Response, error: unknown): boolean {
  if (error instanceof InsufficientCreditsError) {
    response.status(error.statusCode).json({
      error: error.message,
      quote: error.quote,
    });
    return true;
  }

  if (error instanceof EntitlementError) {
    response.status(error.statusCode).json({
      error: error.message,
      quote: error.quote,
    });
    return true;
  }

  return false;
}
