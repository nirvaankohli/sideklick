import { Router } from "express";
import { ZodError } from "zod";

import { getAuthenticatedUserId, requireJwtAuth } from "../middleware/auth";
import { createAuthRateLimitMiddleware } from "../middleware/rate-limit.ts";
import {
  getAuthenticatedUser,
  loginUser,
  registerUser,
  revokeUserSessions,
} from "../services/auth.ts";

export const authRouter = Router();
const authRateLimitMiddleware = createAuthRateLimitMiddleware();

authRouter.post("/register", authRateLimitMiddleware, (request, response) => {
  try {
    const session = registerUser(request.body ?? {});
    response.status(201).json(session);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid registration payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(400).json({
      error: error instanceof Error ? error.message : "Registration failed.",
    });
  }
});

authRouter.post("/login", authRateLimitMiddleware, (request, response) => {
  try {
    const session = loginUser(request.body ?? {});
    response.status(200).json(session);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: "Invalid login payload.",
        details: error.flatten(),
      });
      return;
    }

    response.status(401).json({
      error: error instanceof Error ? error.message : "Login failed.",
    });
  }
});

authRouter.get("/me", requireJwtAuth, (request, response) => {
  const user = getAuthenticatedUser(getAuthenticatedUserId(request));
  if (!user) {
    response.status(404).json({
      error: "Authenticated user not found.",
    });
    return;
  }

  response.status(200).json({ user });
});

authRouter.post("/logout", requireJwtAuth, (request, response) => {
  const revoked = revokeUserSessions(getAuthenticatedUserId(request));
  if (!revoked) {
    response.status(404).json({
      error: "Authenticated user not found.",
    });
    return;
  }

  response.status(200).json({ ok: true });
});
