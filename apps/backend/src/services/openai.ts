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
import {
  getObservedOpenAIClient,
  summarizeTextForTrace,
  withLangfuseObservation,
} from "../../../desktop/src/shared/langfuse.ts";

const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

let openAIClient: OpenAI | null = null;

function loadEnvironment(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env.backend"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../../../.env.backend"),
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
    "The app gives you explicit memory layers and context tiers. This context is important and should be treated as the app's working memory, episodic memory, and semantic memory for the student.",
    "Do not treat the provided context as optional decoration. Read it carefully and use it on purpose.",
    "Working memory is the current request and active session window. Episodic memory is recent sessions and carry-forward items. Semantic memory is stable knowledge about gaps, strengths, recurring topics, and help preferences.",
    "Answer the student's exact prompt directly and as briefly as possible while still being useful.",
    "Lead with the answer, not a preamble.",
    "Write the response in clean Markdown.",
    "Default to a short direct answer that fully answers the question.",
    "Use Markdown like a real markdown answer: short headings only when needed, tight bullets, blockquotes only when quoting, and fenced code blocks only for code.",
    "Prefer multiple short paragraphs over one wide dense paragraph.",
    "Keep each paragraph compact so it reads naturally inside a narrow chat bubble.",
    "When the answer has steps, comparisons, examples, or takeaways, use Markdown bullets or numbered lists.",
    "Make the response as clear as possible.",
    "When there is a more direct or more simple answer available, go for that instead of a longer more complex answer, even if the longer answer is more complete.",
    "However, if the question clearly calls for a more detailed answer, then give that detailed answer. Also insure the completeness of the answer when the question is complex or multi-faceted.",
    "Prefer 1 to 4 short sentences unless the request clearly needs more.",
    "If one sentence can answer the question well, use one sentence.",
    "Treat context sources differently: immediate tier first, session tier second, class tier third, and historical tier last.",
    "Assume the context tiers are already relevance-ranked by the application. Respect that ranking.",
    "When the request is a direct question, use working memory first and only pull in older memory if it sharpens the answer.",
    "When the request is about review, planning, confusion, or what to study next, emphasize episodic and semantic memory more strongly.",
    "Use saved memory actively: connect the answer to known strengths, recurring topics, recent sessions, and active gaps when relevant.",
    "If memory reveals a likely pattern of confusion, say so directly and use it to shape the explanation.",
    "Prefer memory-backed coaching over generic tutoring. If memory shows a pattern, name that pattern clearly.",
    "Decide whether the screenshot actually matters. Use it when visual layout, diagrams, equations, tables, or non-text clues matter. Ignore it when the text alone is enough.",
    "Use background information only when it improves the answer or avoids repeating past confusion.",
    "If the action asks for an example, give an example quickly instead of explaining at length first.",
    "If the action asks to connect to prior knowledge, explicitly connect to the closest known concept from memory.",
    "Prefer recent covered strengths and named topics from prior sessions when making those connections.",
    "Use gaps and strengths differently: strengths are what the student likely already knows or recently covered, while gaps are where they still need support.",
    "If the action is flag_confusing, already_know, or add_notes, respond briefly and directly to that action.",
    "When the student sounds unsure, doubtful, or says they might not know something, treat that as meaningful evidence of a likely gap.",
    "If the student asks to review, revise, or focus on what to study, surface the most relevant past gaps first.",
    "Use the saved student memory to stay consistent with what the student has struggled with before.",
    "Use recent session summaries, detailed recent-session context, and carry-forward items to remember what happened before this session.",
    "Possible gaps should only include likely recurring weak spots supported by the context or the current request.",
    "Keep possible_gaps empty when there is not enough evidence.",
    "If memory is weak or irrelevant, ignore it instead of forcing it in.",
    "next_step should be a detailed carry-forward item, not a vague reminder.",
    "Make next_step one concrete immediate action that names the topic or skill to review, what to do with it, and the intended goal.",
    "A strong next_step should read like a short study instruction the next session can continue from.",
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
        use_memory_deliberately: true,
        connect_to_saved_patterns_when_relevant: true,
        context_is_authoritative_unless_irrelevant: true,
      },
      context_packet: builtContext.contextPacket,
      context_tiers: builtContext.contextTiers,
      memory_layers: {
        working: builtContext.workingMemory,
        episodic: builtContext.episodicMemory,
        semantic: builtContext.semanticMemory,
      },
      class_profile: builtContext.classProfile ?? null,
      context_guidance: builtContext.contextGuidance,
      compact_summary: builtContext.summary,
    },
    null,
    2,
  );
}

export async function requestAssistFromOpenAI(
  builtContext: BuiltContext,
  requestInput: AssistRequest,
): Promise<ModelAssistOutput> {
  return withLangfuseObservation(
    "assist.generate-response",
    {
      input: {
        actionType: requestInput.actionType,
        sessionId: requestInput.sessionId ?? null,
        classId: requestInput.classId ?? null,
        pageTitle: requestInput.pageTitle ?? null,
        pageUrl: requestInput.pageUrl ?? null,
        selectedTextPreview: summarizeTextForTrace(requestInput.selectedText),
        surroundingTextPreview: summarizeTextForTrace(
          requestInput.surroundingText,
          320,
        ),
        userNotePreview: summarizeTextForTrace(requestInput.userNote),
        hasScreenshot: Boolean(requestInput.screenshotDataUrl),
      },
      metadata: {
        feature: "assist",
        classId: requestInput.classId ?? null,
        actionType: requestInput.actionType,
        hasScreenshot: Boolean(requestInput.screenshotDataUrl),
      },
      sessionId: requestInput.sessionId ?? null,
      tags: ["assist", "backend"],
      output: (result) => {
        const output = result as ModelAssistOutput;
        return {
          answerPreview: summarizeTextForTrace(output.answer),
          possibleGapCount: Array.isArray(output.possibleGaps)
            ? output.possibleGaps.length
            : 0,
          hasNextStep: Boolean(output.nextStep),
        };
      },
    },
    async () => {
      const client = getOpenAIClient();
      const observedClient = getObservedOpenAIClient(client, {
        generationName: "assist-openai-response",
        generationMetadata: {
          feature: "assist",
          actionType: requestInput.actionType,
          classId: requestInput.classId ?? null,
        },
      });
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
      const response = await observedClient.responses.parse({
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
    },
  );
}
