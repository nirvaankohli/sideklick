import { Router } from "express";
import { ZodError } from "zod";

import { generateQuiz } from "../services/quiz";

export const quizRouter = Router();

quizRouter.post("/", async (request, response) => {
  try {
    const quizResponse = await generateQuiz(request.body);
    response.status(200).json(quizResponse);
  } catch (error) {
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
