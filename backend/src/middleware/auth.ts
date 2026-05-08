import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { getDatabase } from "../db";

type JwtClaims = {
  sub: string;
  exp?: number;
  [key: string]: unknown;
};

type AuthenticatedRequest = Request & {
  auth?: JwtClaims;
};

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function parseJwtPayload(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT.");
  }

  const decodedHeader = JSON.parse(base64UrlDecode(parts[0]).toString("utf8")) as {
    alg?: string;
  };
  if (decodedHeader.alg !== "HS256") {
    throw new Error("Unsupported JWT algorithm.");
  }

  const payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf8")) as JwtClaims;
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("JWT is missing subject.");
  }

  return payload;
}

function getJwtSecret(): string {
  const secret =
    typeof process.env.BACKEND_JWT_SECRET === "string"
      ? process.env.BACKEND_JWT_SECRET.trim()
      : "";

  return secret || "sideclick-managed-backend-dev-secret";
}

function verifyJwtSignature(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT.");
  }

  const signatureInput = `${parts[0]}.${parts[1]}`;
  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(signatureInput)
    .digest("base64url");
  const providedSignature = parts[2];

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Invalid JWT signature.");
  }

  const payload = parseJwtPayload(token);
  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    throw new Error("JWT has expired.");
  }

  return payload;
}

function getBearerToken(request: Request): string | null {
  const authorizationHeader = request.get("authorization");
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token || null;
}

function getAuthSubject(request: AuthenticatedRequest): string {
  if (!request.auth?.sub) {
    throw new Error("Missing authenticated user context.");
  }

  return request.auth.sub;
}

function readIntegerId(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function claimClassOwnershipIfNeeded(classId: number, userId: string): string | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT owner_user_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(classId) as { owner_user_id: string | null } | undefined;

  if (!row) {
    return null;
  }

  if (!row.owner_user_id) {
    db.prepare(
      `
        UPDATE classes
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, classId);
    return userId;
  }

  return row.owner_user_id;
}

function claimSessionOwnershipIfNeeded(sessionId: number, userId: string): {
  sessionOwnerId: string | null;
  classOwnerId: string | null;
} | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT
        sessions.owner_user_id AS session_owner_id,
        classes.owner_user_id AS class_owner_id,
        sessions.class_id AS class_id
      FROM sessions
      LEFT JOIN classes ON classes.id = sessions.class_id
      WHERE sessions.id = ?
      LIMIT 1
    `,
  ).get(sessionId) as {
    session_owner_id: string | null;
    class_owner_id: string | null;
    class_id: number | null;
  } | undefined;

  if (!row) {
    return null;
  }

  if (!row.session_owner_id) {
    db.prepare(
      `
        UPDATE sessions
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, sessionId);
  }

  if (row.class_id && !row.class_owner_id) {
    db.prepare(
      `
        UPDATE classes
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, row.class_id);
  }

  return {
    sessionOwnerId: row.session_owner_id || userId,
    classOwnerId: row.class_owner_id || userId,
  };
}

function claimInteractionOwnershipIfNeeded(interactionId: number, userId: string): {
  interactionOwnerId: string | null;
  classOwnerId: string | null;
  sessionOwnerId: string | null;
} | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT
        interactions.owner_user_id AS interaction_owner_id,
        classes.owner_user_id AS class_owner_id,
        sessions.owner_user_id AS session_owner_id,
        interactions.class_id AS class_id,
        interactions.session_id AS session_id
      FROM interactions
      LEFT JOIN classes ON classes.id = interactions.class_id
      LEFT JOIN sessions ON sessions.id = interactions.session_id
      WHERE interactions.id = ?
      LIMIT 1
    `,
  ).get(interactionId) as {
    interaction_owner_id: string | null;
    class_owner_id: string | null;
    session_owner_id: string | null;
    class_id: number | null;
    session_id: number | null;
  } | undefined;

  if (!row) {
    return null;
  }

  if (!row.interaction_owner_id) {
    db.prepare(
      `
        UPDATE interactions
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, interactionId);
  }

  if (row.class_id && !row.class_owner_id) {
    db.prepare(
      `
        UPDATE classes
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, row.class_id);
  }

  if (row.session_id && !row.session_owner_id) {
    db.prepare(
      `
        UPDATE sessions
        SET owner_user_id = ?
        WHERE id = ? AND owner_user_id IS NULL
      `,
    ).run(userId, row.session_id);
  }

  return {
    interactionOwnerId: row.interaction_owner_id || userId,
    classOwnerId: row.class_owner_id || userId,
    sessionOwnerId: row.session_owner_id || userId,
  };
}

export function requireJwtAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      response.status(401).json({ error: "Missing bearer token." });
      return;
    }

    (request as AuthenticatedRequest).auth = verifyJwtSignature(token);
    next();
  } catch (error) {
    response.status(401).json({
      error: error instanceof Error ? error.message : "Invalid authentication token.",
    });
  }
}

export function enforceClassOwnershipFromBody(fieldName = "classId") {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const classId = readIntegerId((request.body as Record<string, unknown> | undefined)?.[fieldName]);
      if (!classId) {
        next();
        return;
      }

      const ownerId = claimClassOwnershipIfNeeded(classId, getAuthSubject(request as AuthenticatedRequest));
      if (!ownerId) {
        response.status(404).json({ error: "Class resource not found." });
        return;
      }

      if (ownerId !== getAuthSubject(request as AuthenticatedRequest)) {
        response.status(403).json({ error: "Forbidden class resource access." });
        return;
      }

      next();
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : "Failed to validate class ownership.",
      });
    }
  };
}

export function enforceSessionOwnershipFromBody(fieldName = "sessionId") {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const sessionId = readIntegerId((request.body as Record<string, unknown> | undefined)?.[fieldName]);
      if (!sessionId) {
        next();
        return;
      }

      const ownership = claimSessionOwnershipIfNeeded(sessionId, getAuthSubject(request as AuthenticatedRequest));
      if (!ownership) {
        response.status(404).json({ error: "Session resource not found." });
        return;
      }

      if (
        ownership.sessionOwnerId !== getAuthSubject(request as AuthenticatedRequest) &&
        ownership.classOwnerId !== getAuthSubject(request as AuthenticatedRequest)
      ) {
        response.status(403).json({ error: "Forbidden session resource access." });
        return;
      }

      next();
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : "Failed to validate session ownership.",
      });
    }
  };
}

export function enforceInteractionOwnershipFromBody(fieldName = "interactionId") {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const interactionId = readIntegerId((request.body as Record<string, unknown> | undefined)?.[fieldName]);
      if (!interactionId) {
        next();
        return;
      }

      const ownership = claimInteractionOwnershipIfNeeded(interactionId, getAuthSubject(request as AuthenticatedRequest));
      if (!ownership) {
        response.status(404).json({ error: "Interaction resource not found." });
        return;
      }

      if (
        ownership.interactionOwnerId !== getAuthSubject(request as AuthenticatedRequest) &&
        ownership.classOwnerId !== getAuthSubject(request as AuthenticatedRequest) &&
        ownership.sessionOwnerId !== getAuthSubject(request as AuthenticatedRequest)
      ) {
        response.status(403).json({ error: "Forbidden interaction resource access." });
        return;
      }

      next();
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : "Failed to validate interaction ownership.",
      });
    }
  };
}

export function assignClassOwner(classId: number, userId: string): void {
  const db = getDatabase();
  db.prepare(
    `
      UPDATE classes
      SET owner_user_id = COALESCE(owner_user_id, ?)
      WHERE id = ?
    `,
  ).run(userId, classId);
}

export function getAuthenticatedUserId(request: Request): string {
  return getAuthSubject(request as AuthenticatedRequest);
}
