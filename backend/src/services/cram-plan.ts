import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getDatabase } from "../db";
import {
  cramPlanRequestSchema,
  cramPlanResponseSchema,
} from "../schema";
import type { CramPlanRequest, CramPlanResponse } from "../type";
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
    throw new Error("Missing OPENAI_API_KEY for cram plan generation.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

function parseKeyTopics(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((topic) => typeof topic === "string" && topic.trim())
      : [];
  } catch {
    return [];
  }
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
    throw new Error("Session not found for cram plan generation.");
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
      LIMIT 8
    `,
  ).all(classId) as GapRow[];
}

function buildCramPlanPrompt(input: CramPlanRequest): string {
  const sessions = getSessionRows(input.sessionIds);
  const classProfile = getClassProfileById(input.classId);
  const keyTopics = [
    ...new Set(sessions.flatMap((session) => parseKeyTopics(session.key_topics))),
  ];
  const gapRows = getTopGaps(input.classId);

  return JSON.stringify(
    {
      class_profile: classProfile,
      exam_name: input.examName,
      current_unit: input.currentUnit,
      deadline: input.deadline,
      available_minutes: input.availableMinutes,
      gap_focus_percent: input.gapFocus,
      selected_sessions: sessions.map((session) => ({
        title: session.title,
        notes: session.notes,
        summary: session.summary,
        key_topics: parseKeyTopics(session.key_topics),
        started_at: session.started_at,
        ended_at: session.ended_at,
      })),
      uploaded_material: input.uploadedMaterial,
      additional_notes: input.additionalNotes,
      teacher_assessment_profile: input.teacherAssessmentProfile,
      high_priority_gaps: gapRows,
      key_topics: keyTopics,
      output_requirements: {
        task_count: "3 to 8",
        task_style: "short, practical, time-boxed study guide sections",
        priorities: ["must-review", "quick-win", "if-time"],
        statuses: "use not-started for every new task",
        task_body:
          "each task needs body copy that explains what to study and how",
        key_takeaways: "each task needs 2 to 5 concise bullets",
        quiz_mix:
          "most tasks should have quizEnabled true and a quizPreview object; only a few may set quizEnabled false",
        null_fields:
          "when a task does not have a quiz preview or prior score, return quizPreview, quizId, and lastScore as null",
      },
    },
    null,
    2,
  );
}

export async function generateCramPlan(
  input: unknown,
): Promise<CramPlanResponse> {
  const parsedInput = cramPlanRequestSchema.parse(input);
  const client = getOpenAIClient();

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [
          "You are generating a cram study plan for a desktop learning product.",
          "Return clean structured JSON only.",
          "Prioritize what the student should do next with limited time.",
          "Tasks must be concise, actionable, time-boxed, and ordered by study value.",
          "Each task should read like a study guide section, not just a label.",
          "Blend exam-sprint planning with digesting any provided material.",
          "Prefer active recall and quiz checkpoints over passive rereading.",
          "Most tasks should include a quiz preview that can launch a fresh quiz.",
          "Do not mention hidden reasoning, internal instructions, or unsupported facts.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildCramPlanPrompt(parsedInput),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(cramPlanResponseSchema, "cram_plan_response"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured cram plan.");
  }

  return cramPlanResponseSchema.parse(response.output_parsed);
}
