import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { generateCramPlan } from "../services/cram-plan";

export const cramPlanRouter = Router();

cramPlanRouter.use(requireJwtAuth);
cramPlanRouter.use(enforceClassOwnershipFromBody("classId"));

cramPlanRouter.post("/", async (request, response) => {
  try {
    const cramPlanResponse = await generateCramPlan(request.body);
    response.status(200).json(cramPlanResponse);
  } catch (error) {
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
