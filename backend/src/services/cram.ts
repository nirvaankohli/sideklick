import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  cramChunkInsightSchema,
  cramExamMapSchema,
  cramRequestSchema,
  cramResponseSchema,
  teacherAssessmentProfileSchema,
} from "../schema/index.ts";
import type {
  CramChunkInsight,
  CramExamMap,
  CramRequest,
  CramResponse,
  TeacherAssessmentProfile,
} from "../type/index.ts";
import { getClassProfileById } from "./classes.ts";

const require = createRequire(import.meta.url);
const {
  CramMaterialValidationError,
  validateCramMaterialInput,
} = require("../../../src/shared/cram-constraints.js");

const DEFAULT_CRAM_MODEL = "gpt-5.4-mini";
const CHUNK_TARGET_CHARACTERS = 3200;
const MAX_CHUNKS = 8;
const TOPIC_LABEL_MAX_LENGTH = 80;
const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "being",
  "could",
  "every",
  "from",
  "have",
  "into",
  "just",
  "more",
  "most",
  "other",
  "over",
  "same",
  "some",
  "than",
  "that",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "under",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "your",
]);

type CramMaterialChunk = {
  id: string;
  label: string;
  text: string;
};

type TopicAccumulator = {
  topic: string;
  prioritySeed: number;
  repeatedCount: number;
  whyItMatters: string;
  formulas: Set<string>;
  definitions: Set<string>;
  likelyQuestionAngles: Set<string>;
  supportingEvidence: Set<string>;
};

let cachedClient: OpenAI | null = null;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvironment(): void {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
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

function isOpenAICramDisabled(): boolean {
  return /^(1|true)$/i.test(process.env.DISABLE_OPENAI_CRAM ?? "");
}

function getOpenAIClient(): OpenAI | null {
  if (cachedClient) {
    return cachedClient;
  }

  if (isOpenAICramDisabled()) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for Cram Mode generation.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function getOpenAIModel(): string {
  return (
    process.env.OPENAI_CRAM_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_CRAM_MODEL
  );
}

function shortenText(value: string, maxLength = TOPIC_LABEL_MAX_LENGTH): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueStrings(values: Array<string | null | undefined>, limit?: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

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
    result.push(normalized);
    if (limit && result.length >= limit) {
      break;
    }
  }

  return result;
}

function tokenizeMaterial(value: string): string[] {
  return value
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9'-]{2,}/g)?.filter((token) => !STOP_WORDS.has(token)) || [];
}

function getTopKeywords(value: string, limit: number): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenizeMaterial(value)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function splitIntoSentences(value: string): string[] {
  return value
    .split(/\n+|(?<=[.!?])\s+/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitLongUnit(unit: string, maxCharacters: number): string[] {
  if (unit.length <= maxCharacters) {
    return [unit];
  }

  const sentences = splitIntoSentences(unit);
  if (sentences.length <= 1) {
    const pieces: string[] = [];
    for (let start = 0; start < unit.length; start += maxCharacters) {
      pieces.push(unit.slice(start, start + maxCharacters).trim());
    }
    return pieces.filter(Boolean);
  }

  const pieces: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxCharacters && current) {
      pieces.push(current.trim());
      current = sentence;
      continue;
    }

    if (sentence.length > maxCharacters) {
      if (current) {
        pieces.push(current.trim());
        current = "";
      }
      pieces.push(...splitLongUnit(sentence, maxCharacters));
      continue;
    }

    current = next;
  }

  if (current.trim()) {
    pieces.push(current.trim());
  }

  return pieces;
}

export function chunkCramMaterial(material: string): CramMaterialChunk[] {
  const units = material
    .split(/\n{2,}/)
    .map((unit) => unit.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((unit) => splitLongUnit(unit, CHUNK_TARGET_CHARACTERS));

  const chunks: CramMaterialChunk[] = [];
  let currentUnits: string[] = [];
  let currentLength = 0;

  for (const unit of units) {
    const projectedLength = currentLength + unit.length + (currentUnits.length > 0 ? 2 : 0);
    if (projectedLength > CHUNK_TARGET_CHARACTERS && currentUnits.length > 0) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        label: `Chunk ${chunks.length + 1}`,
        text: currentUnits.join("\n\n"),
      });
      currentUnits = [unit];
      currentLength = unit.length;
      continue;
    }

    currentUnits.push(unit);
    currentLength = projectedLength;
  }

  if (currentUnits.length > 0) {
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      label: `Chunk ${chunks.length + 1}`,
      text: currentUnits.join("\n\n"),
    });
  }

  return chunks.slice(0, MAX_CHUNKS);
}

function buildCourseContext(input: CramRequest): string | null {
  if (input.classId) {
    const classProfile = getClassProfileById(input.classId);
    if (classProfile) {
      const contextParts = [
        classProfile.className,
        input.unitPathLabel || classProfile.currentUnit || null,
      ].filter(Boolean);
      if (contextParts.length > 0) {
        return contextParts.join(" • ");
      }
    }
  }

  return [input.courseName, input.unitPathLabel].filter(Boolean).join(" • ") || null;
}

function buildCramSubtitle(input: CramRequest): string {
  return [
    input.examName,
    `${input.timeAvailable} left`,
    buildCourseContext(input),
  ]
    .filter(Boolean)
    .join(" • ");
}

function buildTeacherFocusHint(input: CramRequest): string {
  const explicitTeacherProfile = input.teacherAssessmentProfile
    ? teacherAssessmentProfileSchema.parse(input.teacherAssessmentProfile)
    : null;
  if (explicitTeacherProfile) {
    const hintParts = [
      explicitTeacherProfile.conciseSummary?.trim()
        ? `Teacher style summary: ${explicitTeacherProfile.conciseSummary.trim()}.`
        : null,
      explicitTeacherProfile.testFormat?.trim()
        ? `Expected test feel: ${explicitTeacherProfile.testFormat.trim()}.`
        : null,
      explicitTeacherProfile.gradingSignals?.[0]
        ? `Grading signal: ${explicitTeacherProfile.gradingSignals[0]}.`
        : null,
      explicitTeacherProfile.exampleQuestions?.[0]
        ? `Practice against prompts like: ${explicitTeacherProfile.exampleQuestions[0]}.`
        : null,
    ].filter(Boolean);

    if (hintParts.length > 0) {
      return hintParts.join(" ");
    }
  }

  if (input.classId) {
    const classProfile = getClassProfileById(input.classId);
    if (classProfile) {
      const hintParts = [
        classProfile.teacherFocus?.trim()
          ? `Teacher focus to keep in view: ${classProfile.teacherFocus.trim()}.`
          : null,
        classProfile.testFormat?.trim()
          ? `Expected test feel: ${classProfile.testFormat.trim()}.`
          : null,
        Array.isArray(classProfile.testExamples) && classProfile.testExamples[0]
          ? `Practice against prompts like: ${classProfile.testExamples[0]}.`
          : null,
      ].filter(Boolean);

      if (hintParts.length > 0) {
        return hintParts.join(" ");
      }
    }
  }

  if (input.additionalNotes?.trim()) {
    return `Use your note about ${input.additionalNotes.trim()} as a tiebreaker if two topics feel equally important.`;
  }

  return "If two topics feel equally important, choose the one that is harder to explain from memory.";
}

function buildTeacherProfilePromptPacket(
  teacherAssessmentProfile: TeacherAssessmentProfile | null,
) {
  if (!teacherAssessmentProfile) {
    return null;
  }

  return {
    profile_name: teacherAssessmentProfile.profileName ?? null,
    test_format: teacherAssessmentProfile.testFormat ?? null,
    concise_summary: teacherAssessmentProfile.conciseSummary ?? null,
    generic_differences: teacherAssessmentProfile.genericDifferences ?? [],
    example_questions: teacherAssessmentProfile.exampleQuestions ?? [],
    grading_signals: teacherAssessmentProfile.gradingSignals ?? [],
    wording_patterns: teacherAssessmentProfile.wordingPatterns ?? [],
    likely_question_moves: teacherAssessmentProfile.likelyQuestionMoves ?? [],
    cram_adjustments: teacherAssessmentProfile.cramAdjustments ?? [],
    source_material_names: teacherAssessmentProfile.sourceMaterialNames ?? [],
  };
}

function buildTimePlan(
  timeAvailable: CramRequest["timeAvailable"],
  focusA: string,
  focusB: string,
  focusC: string,
): string[] {
  const plans: Record<CramRequest["timeAvailable"], string[]> = {
    "30 minutes": [
      `Spend 10 minutes rebuilding ${focusA
      } from memory without rereading the material.`,
      `Spend 10 minutes locking in ${focusB} plus one concrete example, formula, or definition.`,
      `Spend 10 minutes answering likely test prompts out loud on ${focusA} and ${focusB}.`,
    ],
    "1 hour": [
      `Spend 20 minutes on ${focusA} until you can explain it cleanly without looking.`,
      `Spend 20 minutes on ${focusB} plus one worked example, diagram, or definition set.`,
      `Spend 20 minutes on ${focusC} and end with a fast self-test from memory.`,
    ],
    "2 hours": [
      `Spend 35 minutes on ${focusA}, especially the parts you would need to explain step by step.`,
      `Spend 35 minutes on ${focusB} with at least one practice answer or worked example.`,
      `Spend 25 minutes on ${focusC} and the supporting facts that make it easier to answer under pressure.`,
      `Spend 25 minutes doing a final self-test and only review what you still miss.`,
    ],
    "All night": [
      `Start with 45 minutes on ${focusA} until you can teach it back clearly.`,
      `Use 45 minutes on ${focusB}, including examples, definitions, and common traps.`,
      `Use 40 minutes on ${focusC} and any adjacent topics that appear repeatedly in the material.`,
      `Take a 30 minute self-test pass, then spend the final block only on what you miss.`,
    ],
  };

  return plans[timeAvailable];
}

function getFormulaCandidates(sentences: string[]): string[] {
  return uniqueStrings(
    sentences.filter((sentence) =>
      /=|\+|-|\*|\/|\^|→|<-|=>|\d/.test(sentence) ||
      /\b(formula|equation|calculate|solve|rate|probability|ATP|DNA|RNA)\b/i.test(sentence),
    ),
    6,
  );
}

function getDefinitionCandidates(sentences: string[]): string[] {
  return uniqueStrings(
    sentences.filter((sentence) =>
      /\b(is|are|means|refers to|defined as|called)\b/i.test(sentence),
    ),
    6,
  );
}

function sentenceToTopicLabel(sentence: string): string {
  const normalized = sentence
    .replace(/^[\-\d.)\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  return shortenText(normalized);
}

function buildLocalChunkInsight(chunk: CramMaterialChunk): CramChunkInsight {
  const sentences = splitIntoSentences(chunk.text);
  const evidenceSentences = sentences.slice(0, 6);
  const formulas = getFormulaCandidates(sentences);
  const definitions = getDefinitionCandidates(sentences);
  const repeatedIdeas = getTopKeywords(chunk.text, 5);
  const seedTopics = uniqueStrings(
    [
      ...evidenceSentences.slice(0, 4).map(sentenceToTopicLabel),
      ...repeatedIdeas.map((idea) => idea.replace(/\b\w/g, (char) => char.toUpperCase())),
    ],
    4,
  );

  const topics = seedTopics.map((topic, index) => {
    const matchingEvidence =
      evidenceSentences.find((sentence) =>
        normalizeKey(sentence).includes(normalizeKey(topic)),
      ) || evidenceSentences[index] || chunk.text;
    const topicFormulas = formulas
      .filter((candidate) =>
        normalizeKey(candidate).includes(normalizeKey(topic)) ||
        normalizeKey(matchingEvidence).includes(normalizeKey(candidate)),
      )
      .slice(0, 2);
    const topicDefinitions = definitions
      .filter((candidate) =>
        normalizeKey(candidate).includes(normalizeKey(topic)) ||
        normalizeKey(matchingEvidence).includes(normalizeKey(candidate)),
      )
      .slice(0, 2);

    const importance =
      index === 0
        ? "high"
        : topicFormulas.length > 0 || topicDefinitions.length > 0
          ? "high"
          : index === 1
            ? "medium"
            : "low";

    return {
      topic,
      importance,
      whyItMatters:
        topicFormulas.length > 0
          ? "This chunk includes a formula, calculation, or worked step that is easy to test directly."
          : topicDefinitions.length > 0
            ? "This chunk defines a concept in a way that could show up as direct recall or explanation."
            : "This idea appears explicit enough to become a short-answer or concept-connection question.",
      formulas: topicFormulas,
      definitions: topicDefinitions,
      likelyQuestionAngles: uniqueStrings(
        [
          `Explain ${topic} in your own words.`,
          topicFormulas.length > 0 ? `Work through a problem or example involving ${topic}.` : null,
          topicDefinitions.length > 0 ? `Define ${topic} and say why it matters.` : null,
        ],
        3,
      ),
      evidenceSnippets: uniqueStrings([matchingEvidence], 1),
    };
  });

  const likelyEmphasisSignals = uniqueStrings(
    [
      formulas.length > 0 ? "This chunk includes formula-style or calculation-ready material." : null,
      definitions.length > 0 ? "This chunk includes direct definition language that is easy to test." : null,
      repeatedIdeas.length > 0 ? `Repeated language around ${repeatedIdeas.slice(0, 2).join(" and ")} suggests emphasis.` : null,
    ],
    4,
  );

  return cramChunkInsightSchema.parse({
    chunkLabel: chunk.label,
    topics: topics.length > 0
      ? topics
      : [
          {
            topic: sentenceToTopicLabel(chunk.text),
            importance: "high",
            whyItMatters: "This is one of the clearest testable ideas in the chunk.",
            formulas: formulas.slice(0, 2),
            definitions: definitions.slice(0, 2),
            likelyQuestionAngles: [`Explain ${sentenceToTopicLabel(chunk.text)} in your own words.`],
            evidenceSnippets: [shortenText(chunk.text, 120)],
          },
        ],
    repeatedIdeas,
    formulas,
    definitions,
    likelyEmphasisSignals,
  });
}

async function requestChunkInsightFromOpenAI(
  client: OpenAI,
  input: CramRequest,
  chunk: CramMaterialChunk,
): Promise<CramChunkInsight> {
  const teacherAssessmentProfile = input.teacherAssessmentProfile
    ? teacherAssessmentProfileSchema.parse(input.teacherAssessmentProfile)
    : null;
  const response = await client.responses.parse({
    model: getOpenAIModel(),
    prompt_cache_key: "cram-mode-chunk-extraction-v1",
    input: [
      {
        role: "system",
        content: [
          "You are extracting chunk-level exam signals for a night-before-exam cram product.",
          "Return structured JSON only.",
          "Ground every field in the provided chunk.",
          "Prioritize testable topics, repeated ideas, formulas, definitions, and likely teacher emphasis.",
          "Keep topics specific and scannable, not broad textbook chapter names unless the chunk truly supports them.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                exam_name: input.examName,
                time_available: input.timeAvailable,
                course_name: input.courseName ?? null,
                unit_path_label: input.unitPathLabel ?? null,
                additional_notes: input.additionalNotes ?? null,
                teacher_profile: buildTeacherProfilePromptPacket(
                  teacherAssessmentProfile,
                ),
                chunk_label: chunk.label,
                chunk_text: chunk.text,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(cramChunkInsightSchema, "cram_chunk_insight"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured chunk insight for Cram Mode.");
  }

  return cramChunkInsightSchema.parse(response.output_parsed);
}

async function buildChunkInsights(
  input: CramRequest,
  chunks: CramMaterialChunk[],
): Promise<CramChunkInsight[]> {
  const client = getOpenAIClient();
  if (!client) {
    return chunks.map((chunk) => buildLocalChunkInsight(chunk));
  }

  return Promise.all(
    chunks.map((chunk) => requestChunkInsightFromOpenAI(client, input, chunk)),
  );
}

function mergeChunkInsightsToExamMap(chunkInsights: CramChunkInsight[]): CramExamMap {
  const topicMap = new Map<string, TopicAccumulator>();

  for (const chunkInsight of chunkInsights) {
    for (const topic of chunkInsight.topics) {
      const key = normalizeKey(topic.topic);
      if (!key) {
        continue;
      }

      const current = topicMap.get(key) ?? {
        topic: topic.topic,
        prioritySeed: 0,
        repeatedCount: 0,
        whyItMatters: topic.whyItMatters,
        formulas: new Set<string>(),
        definitions: new Set<string>(),
        likelyQuestionAngles: new Set<string>(),
        supportingEvidence: new Set<string>(),
      };

      current.prioritySeed +=
        topic.importance === "high"
          ? 4
          : topic.importance === "medium"
            ? 3
            : 2;
      current.repeatedCount += 1;
      if (!current.whyItMatters && topic.whyItMatters) {
        current.whyItMatters = topic.whyItMatters;
      }

      topic.formulas.forEach((formula) => current.formulas.add(formula));
      topic.definitions.forEach((definition) => current.definitions.add(definition));
      topic.likelyQuestionAngles.forEach((angle) =>
        current.likelyQuestionAngles.add(angle),
      );
      topic.evidenceSnippets.forEach((snippet) =>
        current.supportingEvidence.add(snippet),
      );

      topicMap.set(key, current);
    }
  }

  const topTopics = [...topicMap.values()]
    .map((topic) => ({
      topic: topic.topic,
      priorityScore: Math.max(
        1,
        Math.min(10, topic.prioritySeed + Math.min(topic.repeatedCount, 3)),
      ),
      whyItMatters: topic.whyItMatters,
      repeatedCount: topic.repeatedCount,
      formulas: uniqueStrings([...topic.formulas], 5),
      definitions: uniqueStrings([...topic.definitions], 5),
      likelyQuestionAngles: uniqueStrings([...topic.likelyQuestionAngles], 5),
      supportingEvidence: uniqueStrings([...topic.supportingEvidence], 5),
    }))
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        b.repeatedCount - a.repeatedCount ||
        a.topic.localeCompare(b.topic),
    )
    .slice(0, 6);

  const formulasToMemorize = uniqueStrings(
    topTopics.flatMap((topic) => topic.formulas),
    8,
  );
  const definitionsToKnow = uniqueStrings(
    topTopics.flatMap((topic) => topic.definitions),
    8,
  );
  const likelyEmphasisSignals = uniqueStrings(
    [
      ...chunkInsights.flatMap((chunkInsight) => chunkInsight.likelyEmphasisSignals),
      formulasToMemorize.length > 0
        ? "Formula-style material appears often enough to deserve explicit practice."
        : null,
      definitionsToKnow.length > 0
        ? "Definition-heavy content suggests direct recall or explanation questions."
        : null,
    ],
    8,
  );

  return cramExamMapSchema.parse({
    overview:
      topTopics.length > 0
        ? `Built from ${chunkInsights.length} chunk${chunkInsights.length === 1 ? "" : "s"} and centered on ${topTopics
            .slice(0, 3)
            .map((topic) => topic.topic)
            .join(", ")}.`
        : `Built from ${chunkInsights.length} chunk${chunkInsights.length === 1 ? "" : "s"} with one dominant study theme.`,
    topTopics,
    formulasToMemorize,
    definitionsToKnow,
    likelyEmphasisSignals,
    sourceChunkCount: chunkInsights.length,
  });
}

export async function buildCramExamMap(input: unknown): Promise<CramExamMap> {
  const parsedInput = cramRequestSchema.parse(input);
  const materialValidation = validateCramMaterialInput(parsedInput.examMaterial);
  if (!materialValidation.ok) {
    throw new CramMaterialValidationError(
      materialValidation.message,
      materialValidation.code,
    );
  }

  const chunks = chunkCramMaterial(materialValidation.normalizedMaterial);
  const chunkInsights = await buildChunkInsights(parsedInput, chunks);
  return mergeChunkInsightsToExamMap(chunkInsights);
}

function buildLocalCramPlan(
  input: CramRequest,
  examMap: CramExamMap,
): CramResponse {
  const topTopics = examMap.topTopics;
  const focusA = topTopics[0]?.topic || "the highest-yield topic in your notes";
  const focusB =
    topTopics[1]?.topic ||
    examMap.definitionsToKnow[0] ||
    "the next most testable concept";
  const focusC =
    topTopics[2]?.topic ||
    examMap.formulasToMemorize[0] ||
    "the worked example or supporting topic you still need to lock in";
  const teacherFocusHint = buildTeacherFocusHint(input);

  return cramResponseSchema.parse({
    title: `${input.examName} Cram Plan`,
    subtitle: buildCramSubtitle(input),
    studyFirst: uniqueStrings(
      [
        `${focusA} is the first move because it scores highest in the exam map and shows the strongest evidence of likely emphasis.`,
        `${focusB} comes next because it supports likely short-answer, explanation, or definition questions.`,
      ],
      4,
    ),
    studyNext: uniqueStrings(
      [
        `${focusC} once you can explain the first priorities from memory.`,
        teacherFocusHint,
      ],
      4,
    ),
    skipIfNeeded: uniqueStrings(
      [
        topTopics[3]
          ? `${topTopics[3].topic} if you are truly out of time and need to protect the highest-yield material first.`
          : null,
        "Background details that never repeat and do not change the main answer.",
        "Low-signal examples you can recognize but probably do not need to memorize word-for-word.",
      ],
      4,
    ),
    likelyQuestions: uniqueStrings(
      [
        ...topTopics.flatMap((topic) => topic.likelyQuestionAngles),
        `Explain ${focusA} in your own words and say why it matters for ${input.examName}.`,
        `Compare or connect ${focusA} and ${focusB} in one short answer.`,
        examMap.formulasToMemorize[0]
          ? `Work through ${examMap.formulasToMemorize[0]} or explain when to use it.`
          : `Walk through a likely example or scenario involving ${focusB}.`,
      ],
      4,
    ),
    quickSelfTest: uniqueStrings(
      [
        `Can you define ${focusA} without looking at your notes?`,
        `Can you explain one example that proves you understand ${focusB}?`,
        `Can you answer a likely short-response question on ${focusC} in under two minutes?`,
        examMap.definitionsToKnow[0]
          ? `Can you recall the exact idea behind ${examMap.definitionsToKnow[0]} from memory?`
          : null,
      ],
      4,
    ).slice(0, 3),
    timePlan: buildTimePlan(input.timeAvailable, focusA, focusB, focusC),
  });
}

function normalizeCramResponse(
  input: CramRequest,
  response: CramResponse,
): CramResponse {
  return cramResponseSchema.parse({
    ...response,
    title: `${input.examName} Cram Plan`,
    subtitle: buildCramSubtitle(input),
  });
}

async function requestFinalCramPlanFromOpenAI(
  client: OpenAI,
  input: CramRequest,
  examMap: CramExamMap,
): Promise<CramResponse> {
  const teacherAssessmentProfile = input.teacherAssessmentProfile
    ? teacherAssessmentProfileSchema.parse(input.teacherAssessmentProfile)
    : null;
  const response = await client.responses.parse({
    model: getOpenAIModel(),
    prompt_cache_key: "cram-mode-final-plan-v1",
    input: [
      {
        role: "system",
        content: [
          "You are generating a night-before-exam cram plan for a desktop study product.",
          "Return structured JSON only.",
          "Optimize for score maximization under time pressure, not broad coverage.",
          "Make every list short, actionable, and easy to scan during a stressed cram session.",
          "Ground likely questions and self-test items in the exam map, not in generic study advice.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                exam_name: input.examName,
                time_available: input.timeAvailable,
                course_context: buildCourseContext(input),
                teacher_focus_hint: buildTeacherFocusHint(input),
                teacher_profile: buildTeacherProfilePromptPacket(
                  teacherAssessmentProfile,
                ),
                additional_notes: input.additionalNotes ?? null,
                exam_map: examMap,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(cramResponseSchema, "cram_plan_response"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no structured cram plan.");
  }

  return normalizeCramResponse(
    input,
    cramResponseSchema.parse(response.output_parsed),
  );
}

export async function generateCramPlan(input: unknown): Promise<CramResponse> {
  const parsedInput = cramRequestSchema.parse(input);
  const examMap = await buildCramExamMap(parsedInput);
  const client = getOpenAIClient();

  if (!client) {
    return buildLocalCramPlan(parsedInput, examMap);
  }

  return requestFinalCramPlanFromOpenAI(client, parsedInput, examMap);
}
