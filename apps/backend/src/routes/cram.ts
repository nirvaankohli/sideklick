import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { runChargedAction, sendCreditError } from "./credit-charge";
import { generateCramPlan } from "../services/cram";

export const cramRouter = Router();

cramRouter.use(requireJwtAuth);
cramRouter.use(enforceClassOwnershipFromBody("classId"));

cramRouter.post("/", async (request, response) => {
  try {
    const cramResponse = await runChargedAction(
      request,
      {
        actionType: "cram_plan",
        relatedEntityType:
          typeof request.body?.classId === "number" ? "class" : null,
        relatedEntityId:
          typeof request.body?.classId === "number"
            ? request.body.classId
            : null,
      },
      () => generateCramPlan(request.body),
    );
    response.status(200).json(cramResponse);
  } catch (error) {
    if (sendCreditError(response, error)) {
      return;
    }

    if (
      error instanceof ZodError ||
      (error instanceof Error &&
        error.name === "CramMaterialValidationError")
    ) {
      response.status(400).json({
        error:
          error instanceof ZodError
            ? "Invalid cram plan payload or model output."
            : error.message,
        details: error instanceof ZodError ? error.flatten() : undefined,
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Cram plan generation failed.",
    });
  }
});
