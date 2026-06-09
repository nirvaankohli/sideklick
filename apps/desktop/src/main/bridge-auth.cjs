const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MAX_BRIDGE_MESSAGE_BYTES = 1024 * 1024;
const BRIDGE_NONCE_TTL_MS = 30 * 1000;
const BRIDGE_SECRET_FILE = "native-bridge-secret.txt";
const BRIDGE_SOCKET_FILE = "native-bridge.sock";
const BRIDGE_NONCE_REGEX = /^[A-Za-z0-9:_-]{16,128}$/;

const ALLOWED_ACTION_TYPES = new Set([
  "chat",
  "explain",
  "connect",
  "example",
  "flag_confusing",
  "already_know",
  "add_notes",
  "summarize_page",
  "focus_page",
]);

function resolveBridgeDirectory(explicitHomeDirectory) {
  const homeDirectory =
    typeof explicitHomeDirectory === "string" && explicitHomeDirectory.trim()
      ? explicitHomeDirectory.trim()
      : os.homedir();
  return path.join(homeDirectory, ".sideklick");
}

function resolveBridgeSecretPath(explicitHomeDirectory) {
  return path.join(resolveBridgeDirectory(explicitHomeDirectory), BRIDGE_SECRET_FILE);
}

function resolveBridgeSocketPath(explicitSocketPath, explicitHomeDirectory) {
  if (typeof explicitSocketPath === "string" && explicitSocketPath.trim()) {
    return explicitSocketPath.trim();
  }

  if (process.platform === "win32") {
    return "\\\\.\\pipe\\sideklick-native-bridge";
  }

  return path.join(resolveBridgeDirectory(explicitHomeDirectory), BRIDGE_SOCKET_FILE);
}

function safeJsonStringify(value) {
  return JSON.stringify(value);
}

function safeJsonParse(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function createEnvelopeSignature({ body, expiresAt, nonce, secret }) {
  return crypto
    .createHmac("sha256", secret)
    .update([String(expiresAt), nonce, body].join("\n"))
    .digest("hex");
}

function signaturesMatch(expectedSignature, providedSignature) {
  if (typeof providedSignature !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function sanitizePayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }

  const candidate = rawPayload;

  const actionType =
    typeof candidate.action_type === "string"
      ? candidate.action_type.trim()
      : "";
  const selectedText =
    typeof candidate.selected_text === "string"
      ? candidate.selected_text
      : "";
  const surroundingText =
    typeof candidate.surrounding_text === "string"
      ? candidate.surrounding_text
      : null;
  const pageTitle = typeof candidate.page_title === "string" ? candidate.page_title : "";
  const pageUrl = typeof candidate.page_url === "string" ? candidate.page_url.trim() : "";
  const userNote = typeof candidate.user_note === "string" ? candidate.user_note : "";
  const clickFunction =
    typeof candidate.click_function === "string"
      ? candidate.click_function.trim()
      : "";

  if (!actionType || !ALLOWED_ACTION_TYPES.has(actionType)) {
    return null;
  }

  if (selectedText.length > 32768 || pageTitle.length > 2048 || userNote.length > 8192) {
    return null;
  }

  if (surroundingText !== null && surroundingText.length > 32768) {
    return null;
  }

  if (pageUrl) {
    let parsedUrl;
    try {
      parsedUrl = new URL(pageUrl);
    } catch {
      return null;
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }
  }

  if (clickFunction !== "restore-window") {
    return null;
  }

  if (
    candidate.screenshot_data_url !== undefined &&
    candidate.screenshot_data_url !== null &&
    String(candidate.screenshot_data_url).trim()
  ) {
    return null;
  }

  return {
    action_type: actionType,
    selected_text: selectedText,
    surrounding_text: surroundingText,
    page_title: pageTitle,
    page_url: pageUrl,
    user_note: userNote,
    screenshot_data_url: null,
    click_function: clickFunction,
  };
}

function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== "object") {
    return { ok: false, error: "Malformed bridge envelope" };
  }

  const body = typeof envelope.body === "string" ? envelope.body : "";
  const nonce = typeof envelope.nonce === "string" ? envelope.nonce.trim() : "";
  const signature =
    typeof envelope.signature === "string" ? envelope.signature.trim() : "";
  const expiresAt = Number(envelope.expires_at);

  if (!body || body.length > MAX_BRIDGE_MESSAGE_BYTES) {
    return { ok: false, error: "Malformed bridge envelope" };
  }

  if (!BRIDGE_NONCE_REGEX.test(nonce)) {
    return { ok: false, error: "Missing or invalid nonce" };
  }

  if (!Number.isFinite(expiresAt)) {
    return { ok: false, error: "Missing or invalid request expiry" };
  }

  if (!signature) {
    return { ok: false, error: "Unauthorized caller" };
  }

  return {
    ok: true,
    envelope: {
      body,
      nonce,
      signature,
      expiresAt,
    },
  };
}

function verifyEnvelope({
  envelope,
  secret,
  seenNonces,
  now = Date.now(),
  ttlMs = BRIDGE_NONCE_TTL_MS,
}) {
  const envelopeValidation = validateEnvelope(envelope);
  if (!envelopeValidation.ok) {
    return { ok: false, statusCode: 401, error: envelopeValidation.error };
  }

  const { body, nonce, signature, expiresAt } = envelopeValidation.envelope;

  if (expiresAt < now) {
    return { ok: false, statusCode: 401, error: "Expired request" };
  }

  if (expiresAt - now > ttlMs) {
    return { ok: false, statusCode: 401, error: "Request expiry too far in future" };
  }

  for (const [seenNonce, seenExpiry] of seenNonces.entries()) {
    if (seenExpiry <= now) {
      seenNonces.delete(seenNonce);
    }
  }

  if (seenNonces.has(nonce)) {
    return { ok: false, statusCode: 409, error: "Replay detected for nonce" };
  }

  const expectedSignature = createEnvelopeSignature({
    body,
    expiresAt,
    nonce,
    secret,
  });

  if (!signaturesMatch(expectedSignature, signature)) {
    return { ok: false, statusCode: 401, error: "Unauthorized caller" };
  }

  const parsedBody = safeJsonParse(body);
  const payload = sanitizePayload(parsedBody);
  if (!payload) {
    return { ok: false, statusCode: 400, error: "Invalid bridge payload" };
  }

  seenNonces.set(nonce, expiresAt);
  return {
    ok: true,
    payload,
  };
}

function createEnvelope({ payload, secret, now = Date.now(), ttlMs = BRIDGE_NONCE_TTL_MS }) {
  const body = safeJsonStringify(payload);
  if (!body || Buffer.byteLength(body, "utf8") > MAX_BRIDGE_MESSAGE_BYTES) {
    throw new Error("Bridge payload exceeds 1 MiB limit");
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = now + ttlMs;

  return {
    body,
    nonce,
    expires_at: expiresAt,
    signature: createEnvelopeSignature({
      body,
      expiresAt,
      nonce,
      secret,
    }),
  };
}

function ensureBridgeDirectoryPermissions(baseDirectory) {
  fs.mkdirSync(baseDirectory, { recursive: true, mode: 0o700 });
  if (process.platform !== "win32") {
    try {
      fs.chmodSync(baseDirectory, 0o700);
    } catch {
      // best effort only
    }
  }
}

function ensureBridgeSecret({ secretPath = resolveBridgeSecretPath() } = {}) {
  const directory = path.dirname(secretPath);
  ensureBridgeDirectoryPermissions(directory);

  if (fs.existsSync(secretPath)) {
    const existingSecret = fs.readFileSync(secretPath, "utf8").trim();
    if (existingSecret) {
      if (process.platform !== "win32") {
        try {
          fs.chmodSync(secretPath, 0o600);
        } catch {
          // best effort only
        }
      }
      return existingSecret;
    }
  }

  const generatedSecret = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretPath, `${generatedSecret}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  if (process.platform !== "win32") {
    try {
      fs.chmodSync(secretPath, 0o600);
    } catch {
      // best effort only
    }
  }

  return generatedSecret;
}

function readBridgeSecret({ secretPath = resolveBridgeSecretPath() } = {}) {
  if (!fs.existsSync(secretPath)) {
    return null;
  }

  const secret = fs.readFileSync(secretPath, "utf8").trim();
  return secret || null;
}

module.exports = {
  ALLOWED_ACTION_TYPES,
  BRIDGE_NONCE_TTL_MS,
  BRIDGE_SECRET_FILE,
  BRIDGE_SOCKET_FILE,
  MAX_BRIDGE_MESSAGE_BYTES,
  createEnvelope,
  ensureBridgeSecret,
  readBridgeSecret,
  resolveBridgeDirectory,
  resolveBridgeSecretPath,
  resolveBridgeSocketPath,
  verifyEnvelope,
};
