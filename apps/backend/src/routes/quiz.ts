import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  enforceSessionArrayOwnershipForClassFromBody,
  requireJwtAuth,
} from "../middleware/auth";
import { runChargedAction, sendCreditError } from "./credit-charge";
import { generateQuiz } from "../services/quiz";

export const quizRouter = Router();

quizRouter.use(requireJwtAuth);
quizRouter.use(enforceClassOwnershipFromBody("classId"));
quizRouter.use(enforceSessionArrayOwnershipForClassFromBody("sessionIds", "classId"));

quizRouter.post("/", async (request, response) => {
  try {
    const quizResponse = await runChargedAction(
      request,
      {
        actionType: "basic_quiz",
        relatedEntityType: "class",
        relatedEntityId:
          typeof request.body?.classId === "number"
            ? request.body.classId
            : null,
      },
      () => generateQuiz(request.body),
    );
    response.status(200).json(quizResponse);
  } catch (error) {
    if (sendCreditError(response, error)) {
      return;
    }

    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid quiz payload or model output.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Quiz generation failed.",
    });
  }
});
