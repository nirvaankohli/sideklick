import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceEnvPath = path.join(rootDir, ".env");
const desktopEnvPath = path.join(rootDir, ".env.desktop");
const backendEnvPath = path.join(rootDir, ".env.backend");

const desktopKeys = new Set([
  "MANAGED_BACKEND_URL",
  "MANAGED_BACKEND_JWT",
  "MANAGED_BACKEND_ALLOW_HTTP",
  "MANAGED_BACKEND_ALLOW_SELF_SIGNED",
  "LOCAL_API_BASE_URL",
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
  "LANGFUSE_BASE_URL",
  "LANGFUSE_TRACING_ENVIRONMENT",
  "LANGFUSE_RELEASE",
]);

const backendKeys = new Set([
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_CRAM_MODEL",
  "OPENAI_ASSESSMENT_MODEL",
  "OPENAI_UPLOAD_VISION_MODEL",
  "DISABLE_OPENAI_CRAM",
  "DISABLE_OPENAI_ASSESSMENT_PROFILE",
  "DISABLE_OPENAI_FILE_VISION",
  "BACKEND_JWT_SECRET",
  "BACKEND_RATE_LIMIT_WINDOW_MS",
  "BACKEND_RATE_LIMIT_MAX_REQUESTS",
  "BACKEND_AUTH_RATE_LIMIT_WINDOW_MS",
  "BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS",
  "DATABASE_URL",
  "POSTGRES_SSL",
  "POSTGRES_SSL_REJECT_UNAUTHORIZED",
  "POSTGRES_CA_CERT_PATH",
  "POSTGRES_POOL_MAX",
  "POSTGRES_IDLE_TIMEOUT_MS",
  "POSTGRES_CONNECT_TIMEOUT_MS",
  "BACKEND_TLS_KEY_PATH",
  "BACKEND_TLS_CERT_PATH",
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
  "LANGFUSE_BASE_URL",
  "LANGFUSE_TRACING_ENVIRONMENT",
  "LANGFUSE_RELEASE",
]);

function parseEnv(raw) {
  const entries = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = line.indexOf("=");
    if (index <= 0) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1);
    entries.push([key, value]);
  }
  return entries;
}

function writeEnvFile(filePath, entries) {
  const content =
    entries.map(([key, value]) => `${key}=${value}`).join("\n") +
    (entries.length > 0 ? "\n" : "");
  fs.writeFileSync(filePath, content, "utf8");
}

if (!fs.existsSync(sourceEnvPath)) {
  console.error("[split-env] .env not found.");
  process.exit(1);
}

const sourceEntries = parseEnv(fs.readFileSync(sourceEnvPath, "utf8"));
const desktopEntries = sourceEntries.filter(([key]) => desktopKeys.has(key));
const backendEntries = sourceEntries.filter(([key]) => backendKeys.has(key));

writeEnvFile(desktopEnvPath, desktopEntries);
writeEnvFile(backendEnvPath, backendEntries);

console.log("[split-env] wrote .env.desktop and .env.backend from .env");
