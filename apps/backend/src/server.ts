import express, { type Express } from "express";
import fs from "node:fs";
import http, { type Server as HttpServer } from "node:http";
import https, { type Server as HttpsServer } from "node:https";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import {
  closePostgresPool,
  getDatabaseCounts,
  getPostgresDatabaseCounts,
  initializeDatabase,
  initializePostgres,
  isPostgresConfigured,
} from "./db/index.ts";
import { requireJwtAuth } from "./middleware/auth";
import { createApiRateLimitMiddleware } from "./middleware/rate-limit.ts";
import { writeAuditEvent } from "./observability/audit";
import { buildHealthSnapshot } from "./observability/health";
import { incrementMetric, recordDurationMetric } from "./observability/metrics";
import { adminRouter } from "./routes/admin";
import { assessmentProfileRouter } from "./routes/assessment-profile";
import { authRouter } from "./routes/auth";
import { billingRouter, billingWebhookRouter } from "./routes/billing";
import { assistRouter } from "./routes/assist";
import { classesRouter } from "./routes/classes";
import { cramRouter } from "./routes/cram";
import { cramPlanRouter } from "./routes/cram-plan";
import { creditsRouter } from "./routes/credits";
import { feedbackRouter } from "./routes/feedback";
import { privacyRouter } from "./routes/privacy";
import { quizRouter } from "./routes/quiz";
import { assertJwtConfiguration } from "./services/auth.ts";
import { getPrivacyWorkerHandlers } from "./services/privacy";
import { startBackgroundWorkers, stopBackgroundWorkers } from "./workers";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_API_JSON_LIMIT = "25mb";
const DEFAULT_AUTH_JSON_LIMIT = "16kb";
export const DEFAULT_ALLOWED_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://sideklick.app",
  "https://www.sideklick.app",
];
export const CORS_ALLOW_HEADERS = "Content-Type, Authorization";
export const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

function loadEnvironment() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(process.cwd(), ".env.backend"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(currentDir, "../../../.env.backend"),
    path.resolve(currentDir, "../../../.env"),
  ];

  for (const envPath of candidatePaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    dotenv.config({ path: envPath });
    return;
  }
}

loadEnvironment();

export type LocalServerStatus = {
  ok: true;
  service: "sideklick-local-backend";
  host: string;
  port: number;
  protocol: "http" | "https";
  authMode: "jwt";
  dbDriver: "sqlite" | "postgres";
};

export type StartServerOptions = {
  port?: number;
  host?: string;
};

type ActiveServer = HttpServer | HttpsServer;

let activeServer: ActiveServer | null = null;
let activeHost = DEFAULT_HOST;
let activePort = DEFAULT_PORT;
let activeProtocol: "http" | "https" = "http";

function createRequestId(): string {
  return crypto.randomBytes(8).toString("hex");
}

async function getActiveDatabaseCounts() {
  return isPostgresConfigured()
    ? getPostgresDatabaseCounts()
    : getDatabaseCounts();
}

function getTlsOptions() {
  const keyPath = process.env.BACKEND_TLS_KEY_PATH;
  const certPath = process.env.BACKEND_TLS_CERT_PATH;

  if (!keyPath || !certPath) {
    return null;
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

export function getAllowedCorsOrigins(
  env: Pick<NodeJS.ProcessEnv, "BACKEND_ALLOWED_ORIGINS"> = process.env,
): string[] {
  const configured = env.BACKEND_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return configured && configured.length > 0
    ? [...new Set(configured)]
    : DEFAULT_ALLOWED_CORS_ORIGINS;
}

export function resolveCorsOrigin(
  origin: string | undefined,
  allowedOrigins = getAllowedCorsOrigins(),
): string | null {
  if (!origin) {
    return null;
  }

  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  return allowedOrigins.includes(normalizedOrigin) ? normalizedOrigin : null;
}

export function createServer(): Express {
  assertJwtConfiguration();
  const app = express();
  const apiJsonLimit =
    process.env.BACKEND_JSON_LIMIT || DEFAULT_API_JSON_LIMIT;
  const authJsonLimit =
    process.env.BACKEND_AUTH_JSON_LIMIT || DEFAULT_AUTH_JSON_LIMIT;

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    const allowedOrigin = resolveCorsOrigin(request.get("origin"));

    if (allowedOrigin) {
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
      response.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
      response.setHeader("Access-Control-Max-Age", "600");
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });
  app.use(createApiRateLimitMiddleware());
  app.use((request, response, next) => {
    const requestId = createRequestId();
    const startedAt = Date.now();

    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    incrementMetric("http", "requests_total");

    response.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const routeKey =
        request.route?.path && typeof request.route.path === "string"
          ? `${request.method} ${request.baseUrl}${request.route.path}`
          : `${request.method} ${request.path}`;
      incrementMetric("http", `status_${response.statusCode}`);
      recordDurationMetric("http", routeKey, durationMs);
      writeAuditEvent({
        event: "http.request_completed",
        requestId,
        route: request.path,
        method: request.method,
        statusCode: response.statusCode,
        durationMs,
      });
    });

    next();
  });
  app.use("/api/billing/webhook", billingWebhookRouter);
  app.use("/api/auth", express.json({ limit: authJsonLimit }), authRouter);
  app.use(express.json({ limit: apiJsonLimit }));
  // Keep API routes grouped here so Electron/main-process startup only needs
  // to call `startServer()` and the rest of the backend stays modular.
  app.use("/api/admin", adminRouter);
  app.use("/api/assessment-profile", assessmentProfileRouter);
  app.use("/api/assist", assistRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/cram", cramRouter);
  app.use("/api/cram-plan", cramPlanRouter);
  app.use("/api/credits", creditsRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api", privacyRouter);
  app.use("/api/quiz", quizRouter);

  app.get(["/health", "/api/health"], (_request, response) => {
    const status: LocalServerStatus = {
      ok: true,
      service: "sideklick-local-backend",
      host: activeHost,
      port: activePort,
      protocol: activeProtocol,
      authMode: "jwt",
      dbDriver: isPostgresConfigured() ? "postgres" : "sqlite",
    };

    response.status(200).json({
      ...status,
      observability: buildHealthSnapshot({
        protocol: activeProtocol,
        authMode: "jwt",
        dbDriver: isPostgresConfigured() ? "postgres" : "sqlite",
      }),
    });
  });

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "Local backend is running.",
    });
  });

  app.get("/managed/health", requireJwtAuth, async (_request, response) => {
    response.status(200).json({
      ...buildHealthSnapshot({
        protocol: activeProtocol,
        authMode: "jwt",
        dbDriver: isPostgresConfigured() ? "postgres" : "sqlite",
      }),
      database: await getActiveDatabaseCounts(),
    });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (!error || typeof error !== "object") {
      next(error);
      return;
    }

    const candidate = error as { type?: string; status?: number; message?: string };
    if (candidate.type === "entity.too.large" || candidate.status === 413) {
      response.status(413).json({
        error: "Request body too large.",
      });
      return;
    }

    next(error);
  });

  return app;
}

export async function startServer(
  options: StartServerOptions = {},
): Promise<ActiveServer> {
  if (activeServer) {
    return activeServer;
  }

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  initializeDatabase();
  if (isPostgresConfigured()) {
    await initializePostgres();
  }
  startBackgroundWorkers({
    handlers: getPrivacyWorkerHandlers(),
  });
  const app = createServer();
  const tlsOptions = getTlsOptions();

  activeHost = host;
  activePort = port;
  activeProtocol = tlsOptions ? "https" : "http";

  activeServer = await new Promise<ActiveServer>((resolve, reject) => {
    const server = tlsOptions
      ? https.createServer(tlsOptions, app)
      : http.createServer(app);

    server.listen(port, host, () => {
      console.log(
        `[local-backend] running at ${activeProtocol}://${host}:${port}`,
      );
      resolve(server);
    });

    server.on("error", (error) => {
      activeServer = null;
      activeHost = DEFAULT_HOST;
      activePort = DEFAULT_PORT;
      reject(error);
    });
  });

  return activeServer;
}

export async function stopServer(): Promise<void> {
  stopBackgroundWorkers();
  if (!activeServer) {
    await closePostgresPool();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    activeServer?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  activeServer = null;
  activeHost = DEFAULT_HOST;
  activePort = DEFAULT_PORT;
  activeProtocol = "http";
  await closePostgresPool();
}
