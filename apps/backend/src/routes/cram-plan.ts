import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  enforceSessionArrayOwnershipForClassFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { runChargedAction, sendCreditError } from "./credit-charge";
import { generateCramPlan } from "../services/cram-plan";

export const cramPlanRouter = Router();

cramPlanRouter.use(requireJwtAuth);
cramPlanRouter.use(enforceClassOwnershipFromBody("classId"));
cramPlanRouter.use(
  enforceSessionArrayOwnershipForClassFromBody("sessionIds", "classId"),
);

cramPlanRouter.post("/", async (request, response) => {
  try {
    const cramPlanResponse = await runChargedAction(
      request,
      {
        actionType: "cram_plan",
        relatedEntityType: "class",
        relatedEntityId:
          typeof request.body?.classId === "number"
            ? request.body.classId
            : null,
      },
      () => generateCramPlan(request.body),
    );
    response.status(200).json(cramPlanResponse);
  } catch (error) {
    if (sendCreditError(response, error)) {
      return;
    }

    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid cram plan payload or model output.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Cram plan generation failed.",
    });
  }
});
