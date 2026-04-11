import "dotenv/config";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { modelAssistOutputSchema } from "../schema";
import type {
  AssistRequest,
  BuiltContext,
  ModelAssistOutput,
} from "../type";

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openAIClient) {
    return openAIClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for the local backend.");
  }

  openAIClient = new OpenAI({ apiKey });
  return openAIClient;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
}

function buildSystemPrompt(): string {
  return [
    "You are a study assistant inside a local Electron app.",
    "Use the provided class context and browser selection metadata to help the student.",
    "Return concise, actionable help.",
    "Possible gaps should only include likely recurring weak spots supported by the context or the current request.",
    "Keep possible_gaps empty when there is not enough evidence.",
    "next_step should be one concrete thing the student should do immediately.",
  ].join(" ");
}

function buildUserPayload(
  builtContext: BuiltContext,
  requestInput: AssistRequest,
): string {
  return JSON.stringify(
    {
      current_request: {
        action_type: requestInput.actionType,
        selected_text: requestInput.selectedText,
        surrounding_text: requestInput.surroundingText ?? null,
        page_title: requestInput.pageTitle ?? null,
        page_url: requestInput.pageUrl ?? null,
        user_note: requestInput.userNote ?? null,
        session_id: requestInput.sessionId ?? null,
        class_id: requestInput.classId ?? null,
      },
      built_context: builtContext,
    },
    null,
    2,
  );
}

export async function requestAssistFromOpenAI(
  builtContext: BuiltContext,
  requestInput: AssistRequest,
): Promise<ModelAssistOutput> {
  const client = getOpenAIClient();

  // The SDK parses and validates the response against the Zod schema so the
  // rest of the app receives predictable JSON, not free-form text.
  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: buildUserPayload(builtContext, requestInput),
      },
    ],
    text: {
      format: zodTextFormat(modelAssistOutputSchema, "assist_response"),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "OpenAI returned no structured result for the assist request.",
    );
  }

  // Validate again locally before normalizing, even though the SDK already
  // parsed against the schema. The backend should not trust model text.
  return modelAssistOutputSchema.parse(response.output_parsed);
}
