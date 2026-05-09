import { Router } from "express";
import { ZodError } from "zod";

import {
  assignClassOwner,
  enforceClassOwnershipFromBody,
  getAuthenticatedUserId,
  requireJwtAuth,
} from "../middleware/auth";
import { classProfileSchema } from "../schema";
import { saveClassProfile } from "../services/classes";

export const classesRouter = Router();

classesRouter.use(requireJwtAuth);
classesRouter.use(enforceClassOwnershipFromBody("id"));

classesRouter.post("/", (request, response) => {
  try {
    // This route handles both create and update.
    // If `id` is present in the payload we update that class profile.
    const classProfile = classProfileSchema.parse(request.body);
    const savedClassProfile = saveClassProfile(classProfile);
    if (savedClassProfile.id) {
      assignClassOwner(savedClassProfile.id, getAuthenticatedUserId(request));
    }

    response.status(200).json({
      classProfile: savedClassProfile,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid class profile payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: "Failed to save class profile.",
    });
  }
});
