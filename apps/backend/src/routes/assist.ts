import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  enforceSessionOwnershipFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { handleAssistRequest } from "../services/assist";

export const assistRouter = Router();

assistRouter.use(requireJwtAuth);
assistRouter.use(enforceClassOwnershipFromBody("classId"));
assistRouter.use(enforceSessionOwnershipFromBody("sessionId"));

assistRouter.post("/", async (request, response) => {
  try {
    const assistResponse = await handleAssistRequest(request.body);

    response.status(200).json(assistResponse);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid assist payload or model output.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Assist request failed.",
    });
  }
});
