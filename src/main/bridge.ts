import http from "node:http";
import crypto from "node:crypto";
import { z } from "zod";

const DEFAULT_PORT = 4353;
const DEFAULT_HOST = "localhost";
const DEFAULT_ALLOWED_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const BRIDGE_TOKEN_HEADER = "x-sideclick-token";
const BRIDGE_NONCE_HEADER = "x-sideclick-nonce";
const BRIDGE_TIMESTAMP_HEADER = "x-sideclick-timestamp";

const incomingPayloadSchema = z.object({
  action_type: z.string().trim().min(1),
  selected_text: z.string(),
  surrounding_text: z.string().nullable(),
  page_title: z.string(),
  page_url: z.union([z.string().url(), z.literal(""), z.null()]),
  user_note: z.string(),
  screenshot_data_url: z
    .union([
      z.string().regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/),
      z.null(),
    ]),
  click_function: z.string(),
});

function getHeaderValue(
  req: http.IncomingMessage,
  headerName: string,
): string | null {
  const headerValue = req.headers[headerName];
  if (typeof headerValue === "string") {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue) && headerValue.length > 0) {
    return String(headerValue[0]).trim();
  }

  return null;
}

function parseTimestamp(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidNonce(value: string | null): value is string {
  return typeof value === "string" && /^[A-Za-z0-9:_-]{16,128}$/.test(value);
}

function tokensMatch(expectedToken: string, providedToken: string | null): boolean {
  if (!providedToken) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const providedBuffer = Buffer.from(providedToken, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function readRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function normalizeIncomingPayload(parsed: Record<string, unknown>) {
  return {
    action_type:
      typeof parsed.action_type === "string"
        ? parsed.action_type
        : typeof parsed.actionType === "string"
          ? parsed.actionType
          : "chat",
    selected_text:
      typeof parsed.selected_text === "string"
        ? parsed.selected_text
        : typeof parsed.selectedText === "string"
          ? parsed.selectedText
          : typeof parsed.text === "string"
            ? parsed.text
            : "",
    surrounding_text:
      typeof parsed.surrounding_text === "string"
        ? parsed.surrounding_text
        : typeof parsed.surroundingText === "string"
          ? parsed.surroundingText
          : null,
    page_title:
      typeof parsed.page_title === "string"
        ? parsed.page_title
        : typeof parsed.pageTitle === "string"
          ? parsed.pageTitle
          : "",
    page_url:
      typeof parsed.page_url === "string"
        ? parsed.page_url
        : typeof parsed.pageUrl === "string"
          ? parsed.pageUrl
          : "",
    user_note:
      typeof parsed.user_note === "string"
        ? parsed.user_note
        : typeof parsed.userNote === "string"
          ? parsed.userNote
          : "",
    screenshot_data_url:
      typeof parsed.screenshot_data_url === "string"
        ? parsed.screenshot_data_url
        : typeof parsed.screenshotDataUrl === "string"
          ? parsed.screenshotDataUrl
          : null,
    click_function:
      typeof parsed.click_function === "string" ? parsed.click_function : "",
  };
}

function validateIncomingPayload(parsed: Record<string, unknown>) {
  return incomingPayloadSchema.parse(normalizeIncomingPayload(parsed));
}

export function createIncomingMessageBridge({
  dispatchIncomingPayload,
  authToken,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  log = console,
  allowedTimestampSkewMs = DEFAULT_ALLOWED_TIMESTAMP_SKEW_MS,
}: {
  dispatchIncomingPayload: (payload: Record<string, unknown>) => void;
  authToken: string;
  host?: string;
  port?: number;
  log?: Pick<typeof console, "log" | "error">;
  allowedTimestampSkewMs?: number;
}) {
  let server: http.Server | null = null;
  const seenNonces = new Map<string, number>();

  function pruneSeenNonces(now = Date.now()) {
    for (const [nonce, expiresAt] of seenNonces.entries()) {
      if (expiresAt <= now) {
        seenNonces.delete(nonce);
      }
    }
  }

  function authenticateRequest(req: http.IncomingMessage) {
    const providedToken = getHeaderValue(req, BRIDGE_TOKEN_HEADER);
    if (!tokensMatch(authToken, providedToken)) {
      return { ok: false, statusCode: 401, error: "Unauthorized caller" };
    }

    const nonce = getHeaderValue(req, BRIDGE_NONCE_HEADER);
    if (!isValidNonce(nonce)) {
      return { ok: false, statusCode: 401, error: "Missing or invalid nonce" };
    }

    const timestamp = parseTimestamp(getHeaderValue(req, BRIDGE_TIMESTAMP_HEADER));
    if (timestamp === null) {
      return {
        ok: false,
        statusCode: 401,
        error: "Missing or invalid request timestamp",
      };
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > allowedTimestampSkewMs) {
      return { ok: false, statusCode: 401, error: "Expired request timestamp" };
    }

    pruneSeenNonces(now);
    if (seenNonces.has(nonce)) {
      return { ok: false, statusCode: 409, error: "Replay detected for nonce" };
    }

    seenNonces.set(nonce, now + allowedTimestampSkewMs);
    return { ok: true };
  }

  return {
    start() {
      if (server) {
        return server;
      }

      server = http.createServer(async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
          return;
        }

        const authResult = authenticateRequest(req);
        if (!authResult.ok) {
          res.statusCode = authResult.statusCode;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: authResult.error }));
          return;
        }

        try {
          const rawBody = await readRequestBody(req);
          const parsed = rawBody ? JSON.parse(rawBody) : {};
          dispatchIncomingPayload(validateIncomingPayload(parsed as Record<string, unknown>));
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              ok: false,
              error:
                error instanceof z.ZodError
                  ? "Invalid bridge payload"
                  : "Invalid JSON payload",
            }),
          );
        }
      });

      server.on("error", (error) => {
        log.error("Incoming message server error:", error);
      });

      server.listen(port, host, () => {
        log.log(`Incoming message server listening on http://${host}:${port}`);
      });

      return server;
    },
    stop() {
      if (!server) {
        return;
      }

      server.close();
      server = null;
    },
  };
}
