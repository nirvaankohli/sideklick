import { Router } from "express";
import { ZodError } from "zod";

import {
  deleteAccountRequestSchema,
  exportRequestQuerySchema,
  privacySettingsPatchSchema,
} from "../schema";
import { requireJwtAuth, getAuthenticatedUserId } from "../middleware/auth";
import {
  buildUserDataExport,
  getUserPrivacySettings,
  queueAccountDeletion,
  queueExportJob,
  updateUserPrivacySettings,
} from "../services/privacy";
import {
  getPrivacyWorkerHandlers,
  processPendingRetentionJobs,
} from "../workers";

export const privacyRouter = Router();

privacyRouter.use(requireJwtAuth);

privacyRouter.get("/privacy-settings", (request, response) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const settings = getUserPrivacySettings(userId);
    response.status(200).json({ settings });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to read privacy settings.",
    });
  }
});

privacyRouter.put("/privacy-settings", (request, response) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const patch = privacySettingsPatchSchema.parse(request.body);
    const settings = updateUserPrivacySettings(userId, patch);
    response.status(200).json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid privacy settings payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update privacy settings.",
    });
  }
});

privacyRouter.get("/export", (request, response) => {
  try {
    const userId = getAuthenticatedUserId(request);
    const query = exportRequestQuerySchema.parse(request.query);
    const jobId = queueExportJob(userId, {
      includeContent: query.includeContent,
    });
    processPendingRetentionJobs({
      limit: 1,
      jobTypes: ["export_user_data"],
      handlers: getPrivacyWorkerHandlers(),
    });

    response.status(200).json({
      jobId,
      export: buildUserDataExport(userId, {
        includeContent: query.includeContent,
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid export request.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to export account data.",
    });
  }
});

privacyRouter.delete("/account", (request, response) => {
  try {
    const userId = getAuthenticatedUserId(request);
    deleteAccountRequestSchema.parse(request.body ?? {});
    const jobId = queueAccountDeletion(userId);
    response.status(202).json({
      ok: true,
      jobId,
      settings: getUserPrivacySettings(userId),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Account deletion requires explicit confirmation.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to queue account deletion.",
    });
  }
});
