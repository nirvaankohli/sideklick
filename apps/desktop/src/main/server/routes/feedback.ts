import { Router } from "express";
import { ZodError } from "zod";

import { feedbackRequestSchema } from "../schema";
import { applyFeedbackToInteraction } from "../services/memory";

export const feedbackRouter = Router();

feedbackRouter.post("/", (request, response) => {
  try {
    const feedbackInput = feedbackRequestSchema.parse(request.body);
    applyFeedbackToInteraction(feedbackInput);

    response.status(200).json({
      ok: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid feedback payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Feedback failed.",
    });
  }
});
