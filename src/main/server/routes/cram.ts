import { Router } from "express";
import { ZodError } from "zod";

import { generateCramPlan } from "../services/cram";

export const cramRouter = Router();

cramRouter.post("/", async (request, response) => {
  try {
    const cramResponse = await generateCramPlan(request.body);

    response.status(200).json(cramResponse);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid cram plan payload.", details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Cram Plan Error:", error);
    response.status(500).json({ error: message });
  }
});
