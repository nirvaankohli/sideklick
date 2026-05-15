import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { cramRequestSchema, cramResponseSchema } from "../schema";
import type { CramRequest, CramResponse } from "../type";

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

function buildCramPrompt(input: CramRequest): string {
  return JSON.stringify(
    {
      course_name: input.courseName,
      unit_path_label: input.unitPathLabel,
      exam_name: input.examName,
      time_available: input.timeAvailable,
      exam_material: input.examMaterial,
      additional_notes: input.additionalNotes,
      teacher_assessment_profile: input.teacherAssessmentProfile,
    },
    null,
    2,
  );
}

export async function generateCramPlan(input: unknown): Promise<CramResponse> {
  const parsedInput = cramRequestSchema.parse(input);
  const client = getOpenAIClient();

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "system",
        content: [
          "You are an expert tutor creating a highly actionable, high-yield 'Cram Plan' for a student.",
          "The student has limited time to prepare for an upcoming exam.",
          "Based on their provided time available, exam material, and any teacher notes/profile, generate a concise study timeline.",
          "The 'studyFirst' array should contain the absolute highest-yield concepts (1-3 sentences each).",
          "The 'studyNext' array should contain secondary priorities if time permits.",
          "The 'skipIfNeeded' array should identify low-yield or overly complex topics that are safe to ignore if running out of time.",
          "The 'timePlan' array should break their available time into concrete, manageable chunks (e.g., 'First 30m: Review unit 4 core concepts', 'Next 15m: Rehearse short-answer responses').",
          "The 'likelyQuestions' array should predict 2-4 questions they are most likely to see on the exam.",
          "The 'quickSelfTest' array should provide 2-4 rapid-fire questions for them to answer mentally right now to gauge readiness.",
          "Ensure your plan fits realistically within the 'timeAvailable' limit specified.",
          "Return clean structured JSON only."
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildCramPrompt(parsedInput),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(cramResponseSchema, "cram_response"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured cram plan.");
  }

  return cramResponseSchema.parse(response.output_parsed);
}
