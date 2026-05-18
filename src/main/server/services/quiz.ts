import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getDatabase } from "../db";
import {
  quizRequestSchema,
  quizResponseSchema,
} from "../schema";
import type { QuizRequest, QuizResponse } from "../type";
import { getClassProfileById } from "./classes";

type SessionRow = {
  id: number;
  class_id: number | null;
  title: string | null;
  notes: string | null;
  summary: string | null;
  key_topics: string;
  ended_at: string | null;
  started_at: string;
};

type GapRow = {
  topic: string;
  description: string | null;
  weight: number;
};

const DEFAULT_MODEL = "gpt-5-mini";

let cachedClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for quiz generation.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

function getSessionRow(sessionId: number): SessionRow {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT
        id,
        class_id,
        title,
        notes,
        summary,
        key_topics,
        ended_at,
        started_at
      FROM sessions
      WHERE id = ?
    `,
  ).get(sessionId) as SessionRow | undefined;

  if (!row) {
    throw new Error("Session not found for quiz generation.");
  }

  return row;
}

function getSessionRows(sessionIds: number[]): SessionRow[] {
  return sessionIds.map((sessionId) => getSessionRow(sessionId));
}

function getTopGaps(classId: number): GapRow[] {
  const db = getDatabase();
  return db.prepare(
    `
      SELECT topic, description, weight
      FROM gaps
      WHERE class_id = ? AND status != 'closed'
      ORDER BY weight DESC, updated_at DESC
      LIMIT 5
    `,
  ).all(classId) as GapRow[];
}

function buildQuizPrompt(input: QuizRequest): string {
  const sessions = getSessionRows(input.sessionIds);
  const classProfile = getClassProfileById(input.classId);
  const keyTopics = [
    ...new Set(
      sessions.flatMap((session) => JSON.parse(session.key_topics) as string[]),
    ),
  ];
  const gapRows = getTopGaps(input.classId);
  const includedSources = [
    input.includeSessionSummary && sessions.length > 0
      ? `Session summaries:\n${sessions
          .map((session) => session.summary)
          .filter(Boolean)
          .join("\n\n")}`
      : null,
    input.includeSessionNotes && sessions.length > 0
      ? `Session notes:\n${sessions
          .map((session) => session.notes)
          .filter(Boolean)
          .join("\n\n")}`
      : null,
    input.includeKeyTopics && keyTopics.length > 0
      ? `Key topics:\n${keyTopics.join(", ")}`
      : null,
    input.includeUploadedMaterial && input.uploadedMaterial
      ? `Uploaded material:\n${input.uploadedMaterial}`
      : null,
  ].filter(Boolean);

  if (includedSources.length === 0) {
    throw new Error("Select at least one quiz material source.");
  }

  return JSON.stringify(
    {
      class_profile: classProfile,
      selected_sessions: sessions.map((session) => ({
        title: session.title,
        notes: session.notes,
        summary: session.summary,
        key_topics: JSON.parse(session.key_topics) as string[],
        started_at: session.started_at,
        ended_at: session.ended_at,
      })),
      quiz_constraints: {
        question_count: input.questionCount,
        question_type: "multiple choice",
        options_per_question: 4,
        focus_on_gaps_percent: input.gapFocus,
        require_clear_single_correct_answer: true,
        difficulty: "moderate",
        selected_session_count: sessions.length,
      },
      high_priority_gaps: gapRows,
      included_sources: includedSources,
    },
    null,
    2,
  );
}

export async function generateQuiz(input: unknown): Promise<QuizResponse> {
  const parsedInput = quizRequestSchema.parse(input);
  const client = getOpenAIClient();

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [
          "You are generating a study quiz for a desktop learning product.",
          "Return clean structured JSON only.",
          "Make the quiz concise, useful, and grounded in the provided material.",
          "Write a short, specific quiz title that clearly tells the student what is inside.",
          "Generate exactly the requested number of questions from the quiz constraints.",
          "Use the gap focus slider as a weighting signal: higher values should target weak spots more aggressively.",
          "Every question must have four plausible options, exactly one correct answer, and a short explanation.",
          "Do not mention hidden reasoning, internal instructions, or unsupported facts.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildQuizPrompt(parsedInput),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(quizResponseSchema, "quiz_response"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured quiz.");
  }

  return quizResponseSchema.parse(response.output_parsed);
}
