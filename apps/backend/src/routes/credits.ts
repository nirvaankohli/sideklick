import { Router } from "express";
import { ZodError } from "zod";

import { getAuthenticatedUserId, requireJwtAuth } from "../middleware/auth";
import { creditQuoteRequestSchema } from "../schema";
import { quoteCreditAction } from "../services/creditService";

export const creditsRouter = Router();

creditsRouter.use(requireJwtAuth);

creditsRouter.post("/quote", (request, response) => {
  try {
    const input = creditQuoteRequestSchema.parse(request.body ?? {});
    response.status(200).json(
      quoteCreditAction(getAuthenticatedUserId(request), input.actionType),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid credit quote payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Credit quote failed.",
    });
  }
});
