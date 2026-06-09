import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getDatabase } from "../db";
import {
  cramPlanRequestSchema,
  cramPlanResponseSchema,
} from "../schema";
import type { CramPlanRequest, CramPlanResponse } from "../type";
import { getClassProfileById } from "./classes";
import { withLangfuseObservation } from "../../../desktop/src/shared/langfuse.ts";

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

const DEFAULT_CRAM_PLAN_MODEL = "gpt-5.4-mini";

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
  return (
    process.env.OPENAI_CRAM_PLAN_MODEL ??
    process.env.OPENAI_CRAM_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_CRAM_PLAN_MODEL
  );
}

function buildCramPlanSystemPrompt(): string {
  return [
    "You are Cram Mode, a classic study guide writer for a desktop learning product.",
    "Return clean structured JSON only.",
    "Prioritize what the student should do next with limited time.",
    "Tasks must be ordered by exam score impact and urgency.",
    "Each task must read like a clear explanation section, not a checklist label.",
    "Task body should usually be 2 to 4 short paragraphs with roughly 120 to 220 words.",
    "In each task body: explain the concept in plain language, explain why teachers test it, show the standard method, and include one reproducible mini worked example.",
    "Keep tone direct and dense. No hype, no roleplay, no motivational filler.",
    "Prioritize practical help: what it is, when to use it, how to do it, and where mistakes happen.",
    "Most tasks should include a quiz preview that can launch a fresh quiz.",
    "Use Markdown bold or italics only for high-yield terms, formulas, warnings, and memory hooks.",
    "Do not mention hidden reasoning, internal instructions, or unsupported facts.",
  ].join(" ");
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
        task_style:
          "direct, exam-ready explanation sections with minimal fluff and high practical value",
        priorities: ["must-review", "quick-win", "if-time"],
        statuses: "use not-started for every new task",
        task_body:
          "each task needs 2 to 4 short paragraphs (usually 120 to 220 words) that explain what to study, why it matters on tests, the standard method to use, and one mini worked example the student could reproduce",
        key_takeaways:
          "each task needs 3 to 5 concise bullets covering rule, trigger/when-to-use, steps, and one common mistake/trap to avoid",
        vocab_to_know:
          "each task needs 3 to 6 high-yield vocab, formula, or definition phrases the student should recognize cold",
        quiz_mix:
          "most tasks should have quizEnabled true and a quizPreview object; only a few may set quizEnabled false",
        null_fields:
          "when a task does not have a quiz preview or prior score, return quizPreview, quizId, and lastScore as null",
        emphasis:
          "body, keyTakeaways, and vocabToKnow may use Markdown bold or italics for high-yield terms, formulas, warnings, or memory hooks; do not use HTML",
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
  return withLangfuseObservation(
    "cram-plan.generate",
    {
      input: {
        classId: parsedInput.classId,
        examName: parsedInput.examName,
        currentUnit: parsedInput.currentUnit ?? null,
        availableMinutes: parsedInput.availableMinutes,
        gapFocus: parsedInput.gapFocus,
        sessionIds: parsedInput.sessionIds,
        hasUploadedMaterial: Boolean(parsedInput.uploadedMaterial),
        uploadedMaterialLength: parsedInput.uploadedMaterial?.length ?? 0,
        hasTeacherAssessmentProfile: Boolean(parsedInput.teacherAssessmentProfile),
      },
      metadata: {
        feature: "cram-plan",
        classId: parsedInput.classId,
        sessionCount: parsedInput.sessionIds.length,
      },
      tags: ["cram-plan", "backend"],
      output: (result) => {
        const plan = result as CramPlanResponse;
        return {
          title: plan.title,
          taskCount: plan.tasks.length,
        };
      },
    },
    async () => {
      const client = getOpenAIClient();
      const response = await client.responses.parse({
        model: getOpenAIModel(),
        input: [
          {
            role: "system",
            content: buildCramPlanSystemPrompt(),
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
    },
  );
}
