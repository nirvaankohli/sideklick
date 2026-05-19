import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

const nativePayloadSchema = z.object({
  action_type: z.string().trim().min(1),
  selected_text: z.string().default(""),
  surrounding_text: z.string().nullable().optional().default(null),
  page_title: z.string().default(""),
  page_url: z.union([z.string().url(), z.literal(""), z.null()]).default(""),
  user_note: z.string().default(""),
  screenshot_data_url: z.union([z.string(), z.null()]).default(null),
  click_function: z.string().default("restore-window"),
});

function getSocketPath(explicitPath?: string) {
  if (explicitPath && explicitPath.trim()) {
    return explicitPath.trim();
  }

  if (process.platform === "win32") {
    return "\\\\.\\pipe\\sideklick-native-bridge";
  }

  const baseDir = path.join(os.homedir(), ".sideklick");
  fs.mkdirSync(baseDir, { recursive: true });
  return path.join(baseDir, "native-bridge.sock");
}

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
  log = console,
  socketPath,
}: {
  dispatchIncomingPayload: (payload: Record<string, unknown>) => void;
  log?: Pick<typeof console, "log" | "error">;
  socketPath?: string;
}) {
  const resolvedSocketPath = getSocketPath(socketPath);
  let server: net.Server | null = null;

  function processLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) {
      return { ok: false, error: "Empty message" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: "Invalid JSON payload" };
    }

    try {
      const payload = nativePayloadSchema.parse(parsed);
      dispatchIncomingPayload(payload as Record<string, unknown>);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof z.ZodError ? "Invalid bridge payload" : "Bridge dispatch failed",
      };
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

        socket.on("data", (chunk) => {
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
