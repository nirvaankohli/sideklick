import express, { type Express } from "express";
import fs from "node:fs";
import http, { type Server as HttpServer } from "node:http";
import https, { type Server as HttpsServer } from "node:https";
import crypto from "node:crypto";

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
import { assessmentProfileRouter } from "./routes/assessment-profile";
import { authRouter } from "./routes/auth";
import { assistRouter } from "./routes/assist";
import { classesRouter } from "./routes/classes";
<<<<<<< HEAD
import { cramRouter } from "./routes/cram";
=======
import { cramPlanRouter } from "./routes/cram-plan";
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
import { feedbackRouter } from "./routes/feedback";
import { privacyRouter } from "./routes/privacy";
import { quizRouter } from "./routes/quiz";
import { assertJwtConfiguration } from "./services/auth.ts";
import { getPrivacyWorkerHandlers } from "./services/privacy";
import { startBackgroundWorkers, stopBackgroundWorkers } from "./workers";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";

export type LocalServerStatus = {
  ok: true;
  service: "big-red-hacks-local-backend";
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

export function createServer(): Express {
  assertJwtConfiguration();
  const app = express();

  app.disable("x-powered-by");
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
  app.use(express.json({ limit: "25mb" }));
  // Keep API routes grouped here so Electron/main-process startup only needs
  // to call `startServer()` and the rest of the backend stays modular.
  app.use("/api/assessment-profile", assessmentProfileRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/assist", assistRouter);
  app.use("/api/classes", classesRouter);
<<<<<<< HEAD
  app.use("/api/cram", cramRouter);
=======
  app.use("/api/cram-plan", cramPlanRouter);
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
  app.use("/api/feedback", feedbackRouter);
  app.use("/api", privacyRouter);
  app.use("/api/quiz", quizRouter);

  app.get("/health", (_request, response) => {
    const status: LocalServerStatus = {
      ok: true,
      service: "big-red-hacks-local-backend",
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

  app.get("/", async (_request, response) => {
    response.status(200).json({
      message: "Local backend is running.",
      database: await getActiveDatabaseCounts(),
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
