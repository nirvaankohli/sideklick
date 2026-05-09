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
} from "./db";
import { requireJwtAuth } from "./middleware/auth";
import { writeAuditEvent } from "./observability/audit";
import { buildHealthSnapshot } from "./observability/health";
import { incrementMetric, recordDurationMetric } from "./observability/metrics";
import { authRouter } from "./routes/auth";
import { assistRouter } from "./routes/assist";
import { classesRouter } from "./routes/classes";
import { feedbackRouter } from "./routes/feedback";
import { privacyRouter } from "./routes/privacy";
import { quizRouter } from "./routes/quiz";
import { getPrivacyWorkerHandlers } from "./services/privacy";
import { startBackgroundWorkers, stopBackgroundWorkers } from "./workers";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;

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

function getClientAddress(request: express.Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function createRateLimitMiddleware() {
  const bucket = new Map<string, { count: number; resetsAt: number }>();
  const windowMs = Number(process.env.BACKEND_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS);
  const maxRequests = Number(process.env.BACKEND_RATE_LIMIT_MAX_REQUESTS || DEFAULT_RATE_LIMIT_MAX_REQUESTS);

  return (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    if (!request.path.startsWith("/api/")) {
      next();
      return;
    }

    const now = Date.now();
    const clientAddress = getClientAddress(request);
    const existingEntry = bucket.get(clientAddress);
    const currentEntry =
      existingEntry && existingEntry.resetsAt > now
        ? existingEntry
        : { count: 0, resetsAt: now + windowMs };

    currentEntry.count += 1;
    bucket.set(clientAddress, currentEntry);

    if (currentEntry.count > maxRequests) {
      response.setHeader("Retry-After", Math.ceil((currentEntry.resetsAt - now) / 1000));
      response.status(429).json({ error: "Rate limit exceeded." });
      return;
    }

    next();
  };
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
  const app = express();

  app.disable("x-powered-by");
  app.use(createRateLimitMiddleware());
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
  app.use("/api/auth", authRouter);
  app.use("/api/assist", assistRouter);
  app.use("/api/classes", classesRouter);
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
