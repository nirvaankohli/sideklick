import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

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

function loadEnvironment(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../../../.env"),
  ];

  for (const envPath of candidatePaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    dotenv.config({ path: envPath });
    return;
  }
}

loadEnvironment();

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
    "Use the provided class context, browser selection metadata, optional screenshot, recent session summaries, and saved student memory to help the student.",
    "Answer the student's exact prompt directly and as briefly as possible while still being useful.",
    "Lead with the answer, not a preamble.",
    "Write the response in clean Markdown.",
    "Default to a short direct answer that fully answers the question.",
    "Use Markdown like a real markdown answer: short headings only when needed, tight bullets, blockquotes only when quoting, and fenced code blocks only for code.",
    "Prefer multiple short paragraphs over one wide dense paragraph.",
    "Keep each paragraph compact so it reads naturally inside a narrow chat bubble.",
    "When the answer has steps, comparisons, examples, or takeaways, use Markdown bullets or numbered lists.",
    "Make the response as clear as possible.",
    "Prefer 1 to 4 short sentences unless the request clearly needs more.",
    "If one sentence can answer the question well, use one sentence.",
    "Treat context sources differently: the current selected text and action are highest priority, surrounding text and page metadata come next, older memory is supporting context.",
    "Decide whether the screenshot actually matters. Use it when visual layout, diagrams, equations, tables, or non-text clues matter. Ignore it when the text alone is enough.",
    "Use background information only when it improves the answer or avoids repeating past confusion.",
    "If the action asks for an example, give an example quickly instead of explaining at length first.",
    "If the action asks to connect to prior knowledge, explicitly connect to the closest known concept from memory.",
    "If the action is flag_confusing, already_know, or add_notes, respond briefly and directly to that action.",
    "When the student sounds unsure, doubtful, or says they might not know something, treat that as meaningful evidence of a likely gap.",
    "If the student asks to review, revise, or focus on what to study, surface the most relevant past gaps first.",
    "Use the saved student memory to stay consistent with what the student has struggled with before.",
    "Use recent session summaries and carry-forward items to remember what happened before this session.",
    "Possible gaps should only include likely recurring weak spots supported by the context or the current request.",
    "Keep possible_gaps empty when there is not enough evidence.",
    "next_step should be one concrete thing the student should do immediately.",
    "Do not give filler, throat-clearing, or generic encouragement.",
    "Do not solve graded work outright if the request appears to ask for a final answer; explain the idea instead.",
  ].join(" ");
}

function buildUserTextPayload(
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
        has_screenshot: Boolean(requestInput.screenshotDataUrl),
        session_id: requestInput.sessionId ?? null,
        class_id: requestInput.classId ?? null,
      },
      response_style: {
        desired_tone: "direct, concise, specific",
        answer_first: true,
        avoid_filler: true,
        markdown: true,
        maximize_clarity: true,
        render_like_real_markdown: true,
        treat_self_doubt_as_gap_signal: true,
        prioritize_past_gaps_for_review_requests: true,
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
  const userContent: Array<
    | {
        type: "input_text";
        text: string;
      }
    | {
        type: "input_image";
        image_url: string;
        detail: "auto";
      }
  > = [
    {
      type: "input_text" as const,
      text: buildUserTextPayload(builtContext, requestInput),
    },
  ];

  if (requestInput.screenshotDataUrl) {
    userContent.push({
      type: "input_image",
      image_url: requestInput.screenshotDataUrl,
      detail: "auto",
    });
  }

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
        content: userContent,
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
