import { observeOpenAI, type LangfuseConfig } from "@langfuse/openai";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";
import { NodeSDK } from "@opentelemetry/sdk-node";
import type OpenAI from "openai";

type SideklickTraceOptions = {
  input?: unknown;
  metadata?: Record<string, unknown>;
  output?: unknown | ((result: unknown) => unknown);
  sessionId?: string | null;
  userId?: string | null;
  tags?: Array<string | null | undefined | false>;
};

type TracingState = "uninitialized" | "disabled" | "enabled";

const DATA_URL_PATTERN =
  /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
const OPENAI_KEY_PATTERN = /\bsk-[A-Za-z0-9_-]{16,}\b/g;
const LANGFUSE_KEY_PATTERN = /\b(?:pk|sk)-lf-[A-Za-z0-9_-]{16,}\b/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._-]+\b/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

let tracingState: TracingState = "uninitialized";
let nodeSdk: NodeSDK | null = null;

function isLangfuseConfigured(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY,
  );
}

function sanitizeTag(tag: string | null | undefined | false): string | null {
  const normalized = String(tag ?? "").trim();
  return normalized ? normalized.slice(0, 200) : null;
}

function buildPropagatedAttributes(options: SideklickTraceOptions) {
  const tags = (options.tags ?? [])
    .map((tag) => sanitizeTag(tag))
    .filter((tag): tag is string => Boolean(tag));

  const propagated: Record<string, unknown> = {};

  if (options.sessionId) {
    propagated.sessionId = String(options.sessionId).slice(0, 200);
  }

  if (options.userId) {
    propagated.userId = String(options.userId).slice(0, 200);
  }

  if (tags.length > 0) {
    propagated.tags = tags;
  }

  return propagated;
}

export function summarizeTextForTrace(
  value: string | null | undefined,
  maxLength = 240,
): string | null {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function maskLangfuseExportPayload({ data }: { data: unknown }) {
  if (typeof data !== "string") {
    return data;
  }

  return data
    .replace(DATA_URL_PATTERN, "[redacted-image-data-url]")
    .replace(OPENAI_KEY_PATTERN, "[redacted-openai-key]")
    .replace(LANGFUSE_KEY_PATTERN, "[redacted-langfuse-key]")
    .replace(BEARER_TOKEN_PATTERN, "Bearer [redacted-token]")
    .replace(EMAIL_PATTERN, "[redacted-email]");
}

function initializeLangfuseTracing(): boolean {
  if (tracingState === "enabled") {
    return true;
  }

  if (tracingState === "disabled") {
    return false;
  }

  if (!isLangfuseConfigured()) {
    tracingState = "disabled";
    return false;
  }

  const spanProcessor = new LangfuseSpanProcessor({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    environment:
      process.env.LANGFUSE_TRACING_ENVIRONMENT ??
      process.env.NODE_ENV ??
      "development",
    release: process.env.LANGFUSE_RELEASE ?? process.env.npm_package_version,
    mask: maskLangfuseExportPayload,
  });

  nodeSdk = new NodeSDK({
    spanProcessors: [spanProcessor],
  });
  nodeSdk.start();
  tracingState = "enabled";
  return true;
}

export function observeSideklickOpenAI<SDKType extends object>(
  sdk: SDKType,
  config?: LangfuseConfig,
): SDKType {
  if (!initializeLangfuseTracing()) {
    return sdk;
  }

  return observeOpenAI(sdk, config);
}

export async function withLangfuseObservation<T>(
  name: string,
  options: SideklickTraceOptions,
  fn: () => Promise<T>,
): Promise<T> {
  if (!initializeLangfuseTracing()) {
    return fn();
  }

  return startActiveObservation(name, async (span) => {
    span.update({
      input: options.input,
      metadata: options.metadata,
    });

    const propagatedAttributes = buildPropagatedAttributes(options);

    try {
      const result =
        Object.keys(propagatedAttributes).length > 0
          ? await propagateAttributes(propagatedAttributes, fn)
          : await fn();

      if (options.output !== undefined) {
        span.update({
          output:
            typeof options.output === "function"
              ? options.output(result)
              : options.output,
        });
      }

      return result;
    } catch (error) {
      span.update({
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}

export function getObservedOpenAIClient(
  client: OpenAI,
  config?: LangfuseConfig,
): OpenAI {
  return observeSideklickOpenAI(client, config);
}
