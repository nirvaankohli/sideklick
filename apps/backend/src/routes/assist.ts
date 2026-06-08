import { Router } from "express";
import { ZodError } from "zod";

import {
  enforceClassOwnershipFromBody,
  enforceSessionOwnershipFromBody,
  getAuthenticatedUserId,
  requireJwtAuth,
} from "../middleware/auth";
import { getUserPrivacySettings } from "../services/privacy";
import { handleAssistRequest } from "../services/assist";

export const assistRouter = Router();

assistRouter.use(requireJwtAuth);
assistRouter.use(enforceClassOwnershipFromBody("classId"));
assistRouter.use(enforceSessionOwnershipFromBody("sessionId"));

assistRouter.post("/", async (request, response) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const serverPrivacySettings = getUserPrivacySettings(userId);
    const requestBody =
      request.body && typeof request.body === "object" ? request.body : {};
    const requestSyncConsent =
      requestBody.tracingConsent &&
      typeof requestBody.tracingConsent === "object" &&
      ["unknown", "granted", "denied"].includes(
        requestBody.tracingConsent.requestSyncConsent,
      )
        ? requestBody.tracingConsent.requestSyncConsent
        : "unknown";

    const normalizedTracingConsent = {
      requestSyncConsent,
      serverSyncConsent: serverPrivacySettings.syncConsent,
      langfuseEnabled:
        requestSyncConsent === "granted" &&
        serverPrivacySettings.syncConsent === "granted",
    };

    const assistResponse = await handleAssistRequest({
      ...requestBody,
      tracingConsent: normalizedTracingConsent,
    });

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
