import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";

import { webAnalyticsAdminQuerySchema } from "../schema";
import {
  getWebAnalyticsSummary,
  listRecentWebVisits,
} from "../services/webAnalyticsService";

const ANDREAS_EMAIL = "andreastsang28@gmail.com";

export const personalRouter = Router();

function getAndreasEndpointSecret(): string {
  return process.env.SIDEKLICK_ANDREAS_ENDPOINT_SECRET?.trim() || "";
}

export function getBearerToken(authorization: string | undefined): string {
  const normalizedAuthorization = authorization?.trim() || "";
  const match = normalizedAuthorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function isAndreasEndpointSecretAuthorized(input: {
  bearerToken?: string;
  expectedSecret?: string;
  personalSecret?: string;
}): boolean {
  const expectedSecret = input.expectedSecret?.trim() || "";
  if (!expectedSecret) {
    return false;
  }

  const providedSecret =
    input.personalSecret?.trim() || input.bearerToken?.trim() || "";
  return providedSecret === expectedSecret;
}

function requireAndreasEndpointSecret(
  request: Request,
  response: Response,
): boolean {
  const expectedSecret = getAndreasEndpointSecret();
  if (!expectedSecret) {
    response.status(403).json({
      error: "Personal analytics require SIDEKLICK_ANDREAS_ENDPOINT_SECRET.",
    });
    return false;
  }

  if (!isAndreasEndpointSecretAuthorized({
    bearerToken: getBearerToken(request.get("authorization")),
    expectedSecret,
    personalSecret: request.get("x-sideklick-personal-secret"),
  })) {
    response.status(403).json({
      error: "Invalid personal endpoint secret.",
    });
    return false;
  }

  return true;
}

personalRouter.get("/andreas/web-visits", (request, response) => {
  if (!requireAndreasEndpointSecret(request, response)) {
    return;
  }

  try {
    const input = webAnalyticsAdminQuerySchema.parse(request.query ?? {});
    response.status(200).json({
      owner: {
        email: ANDREAS_EMAIL,
      },
      summary: getWebAnalyticsSummary(input),
      recentVisits: listRecentWebVisits(input),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid personal analytics query.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Personal analytics query failed.",
    });
  }
});

personalRouter.get("/andreas/web-visits/public", (request, response) => {
  try {
    const input = webAnalyticsAdminQuerySchema.parse(request.query ?? {});
    response.status(200).json({
      owner: {
        email: ANDREAS_EMAIL,
      },
      access: "public_aggregate",
      summary: getWebAnalyticsSummary(input),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid public analytics query.",
        details: error.flatten(),
      });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error ? error.message : "Public analytics query failed.",
    });
  }
});
