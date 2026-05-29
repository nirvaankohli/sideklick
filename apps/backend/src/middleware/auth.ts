import type { NextFunction, Request, Response } from "express";

import { getDatabase } from "../db/index.ts";
import type { AuthenticatedJwtClaims } from "../services/auth.ts";
import { verifyAuthenticatedToken } from "../services/auth.ts";

type AuthenticatedRequest = Request & {
  auth?: AuthenticatedJwtClaims;
};
type AuthorizationFailure = {
  status: 403 | 404;
  error: string;
};

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

function readIntegerIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = value.map((entry) => readIntegerId(entry));
  if (ids.some((entry) => entry === null)) {
    return null;
  }

  return ids as number[];
}

export function authorizeClassAccess(
  classId: number,
  userId: string,
  db = getDatabase(),
): AuthorizationFailure | null {
  const row = db.prepare(
    `
      SELECT owner_user_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(classId) as { owner_user_id: string | null } | undefined;

  if (!row) {
    return {
      status: 404,
      error: "Class resource not found.",
    };
  }

  if (row.owner_user_id !== userId) {
    return {
      status: 403,
      error: "Forbidden class resource access.",
    };
  }

  return null;
}

export function authorizeSessionAccess(
  sessionId: number,
  userId: string,
  db = getDatabase(),
): AuthorizationFailure | null {
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
    return {
      status: 404,
      error: "Session resource not found.",
    };
  }

  if (row.session_owner_id !== userId && row.class_owner_id !== userId) {
    return {
      status: 403,
      error: "Forbidden session resource access.",
    };
  }

  return null;
}

export function authorizeSessionIdsForClassAccess(
  sessionIds: number[],
  classId: number,
  userId: string,
  db = getDatabase(),
): AuthorizationFailure | null {
  for (const sessionId of sessionIds) {
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
      return {
        status: 404,
        error: "Session resource not found.",
      };
    }

    if (row.session_owner_id !== userId && row.class_owner_id !== userId) {
      return {
        status: 403,
        error: "Forbidden session resource access.",
      };
    }

    if (row.class_id !== classId) {
      return {
        status: 403,
        error: "Session does not belong to the requested class.",
      };
    }
  }

  return null;
}

export function authorizeInteractionAccess(
  interactionId: number,
  userId: string,
  db = getDatabase(),
): AuthorizationFailure | null {
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
    return {
      status: 404,
      error: "Interaction resource not found.",
    };
  }

  if (
    row.interaction_owner_id !== userId &&
    row.class_owner_id !== userId &&
    row.session_owner_id !== userId
  ) {
    return {
      status: 403,
      error: "Forbidden interaction resource access.",
    };
  }

  return null;
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

    (request as AuthenticatedRequest).auth = verifyAuthenticatedToken(token);
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

      const failure = authorizeClassAccess(
        classId,
        getAuthSubject(request as AuthenticatedRequest),
      );
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
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

      const failure = authorizeSessionAccess(
        sessionId,
        getAuthSubject(request as AuthenticatedRequest),
      );
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
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

export function enforceSessionArrayOwnershipForClassFromBody(
  sessionIdsFieldName = "sessionIds",
  classIdFieldName = "classId",
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const body = request.body as Record<string, unknown> | undefined;
      const classId = readIntegerId(body?.[classIdFieldName]);
      const sessionIds = readIntegerIds(body?.[sessionIdsFieldName]);
      if (!classId || !sessionIds || sessionIds.length === 0) {
        next();
        return;
      }

      const failure = authorizeSessionIdsForClassAccess(
        sessionIds,
        classId,
        getAuthSubject(request as AuthenticatedRequest),
      );
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
        return;
      }

      next();
    } catch (error) {
      response.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate session ownership.",
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

      const failure = authorizeInteractionAccess(
        interactionId,
        getAuthSubject(request as AuthenticatedRequest),
      );
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
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

export function getAuthenticatedUserId(request: Request): string {
  return getAuthSubject(request as AuthenticatedRequest);
}
