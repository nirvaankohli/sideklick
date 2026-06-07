import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { runChargedAction, sendCreditError } from "./credit-charge";
import { analyzeAssessmentProfile } from "../services/assessment-profile";

export const assessmentProfileRouter = Router();

assessmentProfileRouter.use(requireJwtAuth);
assessmentProfileRouter.use(enforceClassOwnershipFromBody("classId"));

assessmentProfileRouter.post("/analyze", async (request, response) => {
  try {
    const result = await runChargedAction(
      request,
      {
        actionType: "graded_work_analysis",
        relatedEntityType:
          typeof request.body?.classId === "number" ? "class" : null,
        relatedEntityId:
          typeof request.body?.classId === "number"
            ? request.body.classId
            : null,
      },
      () => analyzeAssessmentProfile(request.body),
    );
    response.status(200).json(result);
  } catch (error) {
    if (sendCreditError(response, error)) {
      return;
    }

    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid assessment profile payload or model output.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Assessment profile analysis failed.",
    });
  }
});
