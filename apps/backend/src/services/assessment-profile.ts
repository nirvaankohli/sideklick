import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  assessmentProfileAnalysisRequestSchema,
  assessmentProfileAnalysisResponseSchema,
} from "../schema/index.ts";
import type {
  AssessmentProfileAnalysisRequest,
  AssessmentProfileAnalysisResponse,
  AssessmentProfileMaterial,
} from "../type/index.ts";
import {
  getObservedOpenAIClient,
  withLangfuseObservation,
} from "../../../desktop/src/shared/langfuse.ts";

const DEFAULT_ASSESSMENT_MODEL = "gpt-5.4-mini";
const MAX_SOURCE_SNIPPETS = 8;

let cachedClient: OpenAI | null = null;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvironment(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env.backend"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(currentDir, "../../../../.env.backend"),
    path.resolve(currentDir, "../../../../.env"),
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

function getOpenAIClient(): OpenAI | null {
  if (cachedClient) {
    return cachedClient;
  }

  if (/^(1|true)$/i.test(process.env.DISABLE_OPENAI_ASSESSMENT_PROFILE ?? "")) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function getOpenAIModel(): string {
  return (
    process.env.OPENAI_ASSESSMENT_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_ASSESSMENT_MODEL
  );
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 8): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!normalized) {
      continue;
    }

    const key = normalizeKey(normalized);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
    if (output.length >= limit) {
      break;
    }
  }

  return output;
}

function splitSentences(value: string): string[] {
  return String(value || "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function formatLabel(value: string): string {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : "Teacher profile";
}

function deriveExampleQuestions(
  exampleQuestions: string[],
  uploadedMaterials: AssessmentProfileMaterial[],
): string[] {
  return uniqueStrings(
    [
      ...exampleQuestions,
      ...uploadedMaterials.flatMap((material) =>
        splitSentences(material.content)
          .filter(
            (line) =>
              line.length >= 18 &&
              (/[?]$/.test(line) ||
                /^(explain|compare|justify|solve|evaluate|predict|describe|label)\b/i.test(
                  line,
                )),
          )
          .slice(0, 2),
      ),
    ],
    6,
  );
}

function deriveGradingSignals(gradingNotes: string, customFormat: string): string[] {
  return uniqueStrings(
    [
      ...splitSentences(gradingNotes),
      customFormat ? `Format cue: ${customFormat}` : null,
    ],
    6,
  );
}

function deriveWordingPatterns(
  uploadedMaterials: AssessmentProfileMaterial[],
  examples: string[],
): string[] {
  const sourceLines = uniqueStrings(
    [
      ...examples,
      ...uploadedMaterials.flatMap((material) =>
        splitSentences(material.content).filter((line) => line.length >= 18).slice(0, 3),
      ),
    ],
    10,
  );

  const patterns: string[] = [];
  if (sourceLines.some((line) => /justify|explain why|support/i.test(line))) {
    patterns.push("Prompts often ask for justification, not just a final answer.");
  }
  if (sourceLines.some((line) => /compare|contrast|difference|similar/i.test(line))) {
    patterns.push("The teacher likes compare-and-contrast phrasing.");
  }
  if (sourceLines.some((line) => /calculate|solve|show your work|work/i.test(line))) {
    patterns.push("Work shown and step order likely matter.");
  }
  if (sourceLines.some((line) => /label|diagram|graph|figure/i.test(line))) {
    patterns.push("Visual interpretation or labeling likely appears.");
  }
  if (sourceLines.some((line) => /scenario|case|patient|experiment|data/i.test(line))) {
    patterns.push("Question stems lean on scenarios, experiments, or data.");
  }

  return uniqueStrings(patterns, 5);
}

function deriveLikelyQuestionMoves(
  testFormat: string,
  wordingPatterns: string[],
  examples: string[],
): string[] {
  return uniqueStrings(
    [
      testFormat ? `Mirror ${testFormat.toLowerCase()} instead of generic recall.` : null,
      ...wordingPatterns.map((pattern) => pattern.replace(/^The teacher /, "").replace(/^Prompts /, "")),
      ...examples.slice(0, 2).map((example) => `Practice stems like: ${example}`),
    ],
    5,
  );
}

function buildFallbackAnalysis(
  input: AssessmentProfileAnalysisRequest,
): AssessmentProfileAnalysisResponse {
  const profileName = formatLabel(input.profileName || input.presetLabel || "Teacher profile");
  const testFormat =
    input.customFormat?.trim() ||
    input.presetLabel?.trim() ||
    "Teacher-specific mixed assessment style";
  const exampleQuestions = deriveExampleQuestions(
    input.exampleQuestions,
    input.uploadedMaterials,
  );
  const gradingSignals = deriveGradingSignals(
    input.gradingNotes ?? "",
    input.customFormat ?? "",
  );
  const wordingPatterns = deriveWordingPatterns(
    input.uploadedMaterials,
    exampleQuestions,
  );
  const likelyQuestionMoves = deriveLikelyQuestionMoves(
    testFormat,
    wordingPatterns,
    exampleQuestions,
  );
  const genericDifferences = uniqueStrings(
    [
      input.customFormat
        ? `This class is not just generic multiple choice; it leans toward ${input.customFormat.trim()}.`
        : null,
      gradingSignals[0] ? `Grading appears shaped by: ${gradingSignals[0]}` : null,
      wordingPatterns[0] ? wordingPatterns[0] : null,
    ],
    4,
  );

  return assessmentProfileAnalysisResponseSchema.parse({
    profileId: null,
    profileName,
    testFormat,
    conciseSummary:
      genericDifferences[0] ||
      `Use ${profileName} to keep quiz stems and cram advice closer to this teacher's actual style.`,
    genericDifferences,
    exampleQuestions,
    gradingSignals,
    wordingPatterns,
    likelyQuestionMoves,
    quizAdjustments: uniqueStrings(
      [
        testFormat ? `Match the quiz to ${testFormat.toLowerCase()}.` : null,
        gradingSignals[0] ? `Reward answers that reflect: ${gradingSignals[0]}` : null,
        wordingPatterns[0] ? `Keep stems consistent with: ${wordingPatterns[0]}` : null,
      ],
      4,
    ),
    cramAdjustments: uniqueStrings(
      [
        likelyQuestionMoves[0]
          ? `Prioritize rehearsal for ${likelyQuestionMoves[0].toLowerCase()}.`
          : null,
        gradingSignals[0]
          ? `Tell the student what the teacher rewards: ${gradingSignals[0]}`
          : null,
      ],
      4,
    ),
    sourceMaterialNames: uniqueStrings(
      input.uploadedMaterials.map((material) => material.name),
      12,
    ),
  });
}

function buildPromptPacket(input: AssessmentProfileAnalysisRequest) {
  return {
    task: "Summarize how this teacher's real assessments differ from generic study content.",
    class_id: input.classId ?? null,
    profile_name: input.profileName ?? null,
    preset_label: input.presetLabel ?? null,
    custom_format: input.customFormat ?? null,
    example_questions: input.exampleQuestions,
    grading_notes: input.gradingNotes ?? null,
    source_materials: input.uploadedMaterials.slice(0, MAX_SOURCE_SNIPPETS).map((material) => ({
      name: material.name,
      handler: material.handler ?? null,
      content: material.content,
    })),
    output_goals: [
      "Identify the teacher's actual test format and what makes it non-generic.",
      "Capture wording patterns, grading signals, and what practice should imitate.",
      "Return concise guidance that quiz generation and cram mode can directly use.",
    ],
  };
}

export async function analyzeAssessmentProfile(
  input: unknown,
): Promise<AssessmentProfileAnalysisResponse> {
  const parsedInput = assessmentProfileAnalysisRequestSchema.parse(input);
  const client = getOpenAIClient();

  if (!client) {
    return buildFallbackAnalysis(parsedInput);
  }

  return withLangfuseObservation(
    "assessment-profile.analyze",
    {
      input: {
        classId: parsedInput.classId ?? null,
        profileName: parsedInput.profileName ?? null,
        presetLabel: parsedInput.presetLabel ?? null,
        customFormat: parsedInput.customFormat ?? null,
        exampleQuestionCount: parsedInput.exampleQuestions.length,
        uploadedMaterialCount: parsedInput.uploadedMaterials.length,
        uploadedMaterialNames: parsedInput.uploadedMaterials.map(
          (material) => material.name,
        ),
      },
      metadata: {
        feature: "assessment-profile",
        classId: parsedInput.classId ?? null,
        uploadedMaterialCount: parsedInput.uploadedMaterials.length,
      },
      tags: ["assessment-profile", "backend"],
      output: (result) => {
        const analysis = result as AssessmentProfileAnalysisResponse;
        return {
          profileName: analysis.profileName,
          testFormat: analysis.testFormat,
          quizAdjustmentCount: analysis.quizAdjustments.length,
          cramAdjustmentCount: analysis.cramAdjustments.length,
        };
      },
    },
    async () => {
      const observedClient = getObservedOpenAIClient(client, {
        generationName: "assessment-profile-openai-response",
        generationMetadata: {
          feature: "assessment-profile",
          classId: parsedInput.classId ?? null,
          uploadedMaterialCount: parsedInput.uploadedMaterials.length,
        },
      });
      const response = await observedClient.responses.parse({
        model: getOpenAIModel(),
        prompt_cache_key: "assessment-profile-analysis-v1",
        input: [
          {
            role: "system",
            content: [
              "You analyze uploaded teacher assessments for a study app.",
              "Return structured JSON only.",
              "Focus on the differences between generic practice and this teacher's actual style.",
              "Infer the most likely test format, wording habits, grading priorities, and what quiz/cram generation should imitate.",
              "Be concise, specific, and grounded in the provided evidence.",
              "Do not copy long passages from uploaded material.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(buildPromptPacket(parsedInput), null, 2),
              },
            ],
          },
        ],
        text: {
          format: zodTextFormat(
            assessmentProfileAnalysisResponseSchema,
            "assessment_profile_analysis",
          ),
        },
      });

      if (!response.output_parsed) {
        throw new Error(
          "OpenAI returned no structured assessment profile analysis.",
        );
      }

      return assessmentProfileAnalysisResponseSchema.parse(response.output_parsed);
    },
  );
}
