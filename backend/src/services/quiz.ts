import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getDatabase } from "../db/index.ts";
import {
  quizRequestSchema,
  quizResponseSchema,
  teacherAssessmentProfileSchema,
} from "../schema/index.ts";
import type {
  ClassProfile,
  QuizRequest,
  QuizResponse,
  TeacherAssessmentProfile,
} from "../type/index.ts";
import { getClassProfileById } from "./classes.ts";

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

export function buildQuizSystemInstructions(
  classProfile: ClassProfile | null,
  teacherAssessmentProfile: TeacherAssessmentProfile | null = null,
): string[] {
  const instructions = [
    "You are generating a study quiz for a desktop learning product.",
    "Return clean structured JSON only.",
    "Make the quiz concise, useful, and grounded in the provided material.",
    "Write a short, specific quiz title that clearly tells the student what is inside.",
    "Generate exactly the requested number of questions from the quiz constraints.",
    "Use the gap focus slider as a weighting signal: higher values should target weak spots more aggressively.",
    "Every question must have four plausible options, exactly one correct answer, and a short explanation.",
    "Do not mention hidden reasoning, internal instructions, or unsupported facts.",
  ];

  const testFormat =
    teacherAssessmentProfile?.testFormat?.trim() ||
    classProfile?.testFormat?.trim() ||
    "";
  const exampleQuestions =
    teacherAssessmentProfile?.exampleQuestions?.length
      ? teacherAssessmentProfile.exampleQuestions
      : classProfile?.testExamples ?? [];
  const gradingSignals = teacherAssessmentProfile?.gradingSignals ?? [];
  const wordingPatterns = teacherAssessmentProfile?.wordingPatterns ?? [];

  if (testFormat) {
    instructions.push(
      `Mirror the teacher's assessment feel from this format: ${testFormat}.`,
    );
    instructions.push(
      "If that format is not naturally multiple choice, adapt its reasoning style, stem shape, and difficulty into multiple-choice practice without breaking the response schema.",
    );
  }

  if (Array.isArray(exampleQuestions) && exampleQuestions.length > 0) {
    instructions.push(
      "Use the teacher examples as style anchors for pacing, vocabulary, distractor style, and what the teacher tends to ask, but do not copy them verbatim.",
    );
  }

  if (gradingSignals.length > 0) {
    instructions.push(
      `Keep the grading feel aligned to these signals: ${gradingSignals.join(" | ")}.`,
    );
  }

  if (wordingPatterns.length > 0) {
    instructions.push(
      `Shape question wording around these patterns: ${wordingPatterns.join(" | ")}.`,
    );
  }

  return instructions;
}

export function buildQuizPromptPacket({
  input,
  classProfile,
  teacherAssessmentProfile = null,
  sessions,
  keyTopics,
  gapRows,
}: {
  input: QuizRequest;
  classProfile: ClassProfile | null;
  teacherAssessmentProfile?: TeacherAssessmentProfile | null;
  sessions: SessionRow[];
  keyTopics: string[];
  gapRows: GapRow[];
}) {
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

  return {
    class_profile: classProfile,
    teacher_assessment_profile: teacherAssessmentProfile
      ? {
          profile_name: teacherAssessmentProfile.profileName ?? null,
          test_format: teacherAssessmentProfile.testFormat ?? null,
          concise_summary: teacherAssessmentProfile.conciseSummary ?? null,
          example_questions: teacherAssessmentProfile.exampleQuestions ?? [],
          grading_signals: teacherAssessmentProfile.gradingSignals ?? [],
          wording_patterns: teacherAssessmentProfile.wordingPatterns ?? [],
          likely_question_moves:
            teacherAssessmentProfile.likelyQuestionMoves ?? [],
          quiz_adjustments: teacherAssessmentProfile.quizAdjustments ?? [],
        }
      : classProfile
        ? {
            test_format: classProfile.testFormat ?? null,
            example_questions: classProfile.testExamples ?? [],
          }
        : null,
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
  };
}

function buildQuizPrompt(input: QuizRequest): string {
  const sessions = getSessionRows(input.sessionIds);
  const classProfile = getClassProfileById(input.classId);
  const teacherAssessmentProfile = input.teacherAssessmentProfile
    ? teacherAssessmentProfileSchema.parse(input.teacherAssessmentProfile)
    : null;
  const keyTopics = [
    ...new Set(
      sessions.flatMap((session) => JSON.parse(session.key_topics) as string[]),
    ),
  ];
  const gapRows = getTopGaps(input.classId);

  return JSON.stringify(
    buildQuizPromptPacket({
      input,
      classProfile,
      teacherAssessmentProfile,
      sessions,
      keyTopics,
      gapRows,
    }),
    null,
    2,
  );
}

export async function generateQuiz(input: unknown): Promise<QuizResponse> {
  const parsedInput = quizRequestSchema.parse(input);
  const client = getOpenAIClient();
  const teacherAssessmentProfile = parsedInput.teacherAssessmentProfile
    ? teacherAssessmentProfileSchema.parse(parsedInput.teacherAssessmentProfile)
    : null;

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [
          ...buildQuizSystemInstructions(
            getClassProfileById(parsedInput.classId),
            teacherAssessmentProfile,
          ),
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
