import { Router } from "express";
import { ZodError } from "zod";

import { webVisitRequestSchema } from "../schema";
import {
  queueWebVisitNotification,
  recordWebVisit,
} from "../services/webAnalyticsService";

export const webAnalyticsRouter = Router();

function getForwardedClientAddress(value: string | undefined): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

webAnalyticsRouter.post("/visit", (request, response) => {
  try {
    const input = webVisitRequestSchema.parse(request.body ?? {});
    const visit = recordWebVisit(input, {
      ipAddress:
        getForwardedClientAddress(request.get("x-forwarded-for")) ||
        request.ip ||
        request.socket.remoteAddress,
      userAgent: request.get("user-agent"),
    });

    queueWebVisitNotification(visit);
    response.status(202).json({
      ok: true,
      visitId: visit.id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid web visit payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Web visit tracking failed.",
    });
  }
});
