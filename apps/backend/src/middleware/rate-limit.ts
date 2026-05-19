import type { NextFunction, Request, Response } from "express";

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;
const DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_AUTH_RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitBucket = {
  count: number;
  resetsAt: number;
};

type RateLimitOptions = {
  errorMessage: string;
  keyBuilder: (request: Request) => string | null;
  maxRequests: number;
  shouldLimit?: (request: Request) => boolean;
  windowMs: number;
};

function getClientAddress(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createFixedWindowRateLimitMiddleware(options: RateLimitOptions) {
  const bucket = new Map<string, RateLimitBucket>();

  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (options.shouldLimit && !options.shouldLimit(request)) {
      next();
      return;
    }

    const key = options.keyBuilder(request);
    if (!key) {
      next();
      return;
    }

    const now = Date.now();
    const existingEntry = bucket.get(key);
    const currentEntry =
      existingEntry && existingEntry.resetsAt > now
        ? existingEntry
        : { count: 0, resetsAt: now + options.windowMs };

    currentEntry.count += 1;
    bucket.set(key, currentEntry);

    if (currentEntry.count > options.maxRequests) {
      response.setHeader("Retry-After", Math.ceil((currentEntry.resetsAt - now) / 1000));
      response.status(429).json({ error: options.errorMessage });
      return;
    }

    next();
  };
}

export function createApiRateLimitMiddleware() {
  const windowMs = Number(process.env.BACKEND_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = Number(process.env.BACKEND_RATE_LIMIT_MAX_REQUESTS || DEFAULT_RATE_LIMIT_MAX_REQUESTS);

  return createFixedWindowRateLimitMiddleware({
    windowMs,
    maxRequests,
    errorMessage: "Rate limit exceeded.",
    shouldLimit(request) {
      return request.path.startsWith("/api/");
    },
    keyBuilder(request) {
      return getClientAddress(request);
    },
  });
}

export function createAuthRateLimitMiddleware() {
  const windowMs = Number(
    process.env.BACKEND_AUTH_RATE_LIMIT_WINDOW_MS || DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS,
  );
  const maxRequests = Number(
    process.env.BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS || DEFAULT_AUTH_RATE_LIMIT_MAX_REQUESTS,
  );

  return createFixedWindowRateLimitMiddleware({
    windowMs,
    maxRequests,
    errorMessage: "Too many authentication attempts.",
    keyBuilder(request) {
      const email = normalizeEmail((request.body as Record<string, unknown> | undefined)?.email);
      return `${request.method}:${request.path}:${getClientAddress(request)}:${email || "anonymous"}`;
    },
  });
}
