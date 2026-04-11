import express, { type Express } from "express";
import type { Server } from "node:http";

import { getDatabaseCounts, initializeDatabase } from "./db";
import { assistRouter } from "./routes/assist";
import { classesRouter } from "./routes/classes";
import { feedbackRouter } from "./routes/feedback";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";

export type LocalServerStatus = {
  ok: true;
  service: "big-red-hacks-local-backend";
  host: string;
  port: number;
};

export type StartServerOptions = {
  port?: number;
  host?: string;
};

let activeServer: Server | null = null;
let activeHost = DEFAULT_HOST;
let activePort = DEFAULT_PORT;

export function createServer(): Express {
  const app = express();

  app.use(express.json());
  // Keep API routes grouped here so Electron/main-process startup only needs
  // to call `startServer()` and the rest of the backend stays modular.
  app.use("/api/assist", assistRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/feedback", feedbackRouter);

  app.get("/health", (_request, response) => {
    const status: LocalServerStatus = {
      ok: true,
      service: "big-red-hacks-local-backend",
      host: activeHost,
      port: activePort,
    };

    response.status(200).json(status);
  });

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "Local backend is running.",
      database: getDatabaseCounts(),
    });
  });

  return app;
}

export async function startServer(
  options: StartServerOptions = {},
): Promise<Server> {
  if (activeServer) {
    return activeServer;
  }

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  // Opening the DB here guarantees tables exist before any route touches them.
  initializeDatabase();
  const app = createServer();

  activeHost = host;
  activePort = port;

  activeServer = await new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(
        `[local-backend] running at http://${host}:${port}`,
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
  if (!activeServer) {
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
}
