import net from "node:net";
import fs from "node:fs";

const {
  MAX_BRIDGE_MESSAGE_BYTES,
  resolveBridgeSocketPath,
  verifyEnvelope,
} = require("./bridge-auth.cjs") as {
  MAX_BRIDGE_MESSAGE_BYTES: number;
  resolveBridgeSocketPath: (
    explicitSocketPath?: string,
    explicitHomeDirectory?: string,
  ) => string;
  verifyEnvelope: (options: {
    envelope: unknown;
    secret: string;
    seenNonces: Map<string, number>;
    now?: number;
    ttlMs?: number;
  }) =>
    | {
        ok: true;
        payload: Record<string, unknown>;
      }
    | {
        ok: false;
        statusCode: number;
        error: string;
      };
};

function safeUnlink(socketPath: string) {
  if (process.platform === "win32") {
    return;
  }

  try {
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
    }
  } catch {
    // best effort cleanup only
  }
}

export function createNativeMessagingIpcServer({
  dispatchIncomingPayload,
  authSecret,
  log = console,
  socketPath,
}: {
  dispatchIncomingPayload: (payload: Record<string, unknown>) => void;
  authSecret: string;
  log?: Pick<typeof console, "log" | "error">;
  socketPath?: string;
}) {
  if (!authSecret || !authSecret.trim()) {
    throw new Error("Missing native bridge auth secret.");
  }

  const resolvedSocketPath = resolveBridgeSocketPath(socketPath);
  const seenNonces = new Map<string, number>();
  let server: net.Server | null = null;

  function processLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) {
      return { ok: false, error: "Empty message" };
    }

    if (Buffer.byteLength(trimmed, "utf8") > MAX_BRIDGE_MESSAGE_BYTES) {
      return { ok: false, error: "Bridge payload exceeds 1 MiB limit" };
    }

    const envelope = (() => {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    })();

    if (!envelope) {
      return { ok: false, error: "Invalid JSON payload" };
    }

    const verified = verifyEnvelope({
      envelope,
      secret: authSecret,
      seenNonces,
    });

    if (!verified.ok) {
      return {
        ok: false,
        error: verified.error,
      };
    }

    try {
      dispatchIncomingPayload(verified.payload);
      return { ok: true };
    } catch {
      return { ok: false, error: "Bridge dispatch failed" };
    }
  }

  return {
    getSocketPath() {
      return resolvedSocketPath;
    },
    start() {
      if (server) {
        return server;
      }

      safeUnlink(resolvedSocketPath);

      server = net.createServer((socket) => {
        socket.setEncoding("utf8");
        let buffer = "";
        let receivedBytes = 0;

        socket.on("data", (chunk) => {
          receivedBytes += Buffer.byteLength(chunk, "utf8");
          if (receivedBytes > MAX_BRIDGE_MESSAGE_BYTES) {
            socket.destroy();
            return;
          }

          buffer += chunk;

          while (true) {
            const newlineIndex = buffer.indexOf("\n");
            if (newlineIndex < 0) {
              break;
            }

            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            const result = processLine(line);
            socket.write(`${JSON.stringify(result)}\n`);
          }
        });

        socket.on("error", (error) => {
          log.error("[native-bridge] socket error:", error);
        });
      });

      server.on("error", (error) => {
        log.error("[native-bridge] server error:", error);
      });

      server.listen(resolvedSocketPath, () => {
        if (process.platform !== "win32") {
          try {
            fs.chmodSync(resolvedSocketPath, 0o600);
          } catch {
            // best effort permissions hardening
          }
        }
        log.log(`[native-bridge] listening on ${resolvedSocketPath}`);
      });

      return server;
    },
    stop() {
      if (!server) {
        return;
      }

      server.close();
      server = null;
      safeUnlink(resolvedSocketPath);
    },
  };
}
