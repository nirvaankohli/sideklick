import { createRequire } from "node:module";
import {
  cramRequestSchema,
  cramResponseSchema,
} from "../schema/index.ts";
import type { CramRequest, CramResponse } from "../type/index.ts";
import { getClassProfileById } from "./classes.ts";

const require = createRequire(import.meta.url);
const {
  CramMaterialValidationError,
  validateCramMaterialInput,
} = require("../../../src/shared/cram-constraints.js");

function normalizeMaterialSegments(material: string): string[] {
  return material
    .split(/\n+/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 10);
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

function buildTeacherFocusHint(input: CramRequest): string {
  if (input.classId) {
    const classProfile = getClassProfileById(input.classId);
    if (classProfile?.teacherFocus?.trim()) {
      return `Teacher focus to keep in view: ${classProfile.teacherFocus.trim()}.`;
    }
  }

  if (input.additionalNotes?.trim()) {
    return `Use your note about ${input.additionalNotes.trim()} as a tiebreaker if two topics feel equally important.`;
  }

  return "If two topics feel equally important, choose the one that is harder to explain from memory.";
}

function buildTimePlan(
  timeAvailable: CramRequest["timeAvailable"],
  focusA: string,
  focusB: string,
  focusC: string,
): string[] {
  const plans: Record<CramRequest["timeAvailable"], string[]> = {
    "30 minutes": [
      `Spend 10 minutes rebuilding ${focusA} from memory without rereading the material.`,
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

export function generateCramPlan(input: unknown): CramResponse {
  const parsedInput = cramRequestSchema.parse(input);
  const materialValidation = validateCramMaterialInput(parsedInput.examMaterial);
  if (!materialValidation.ok) {
    throw new CramMaterialValidationError(
      materialValidation.message,
      materialValidation.code,
    );
  }

  const compactSegments = normalizeMaterialSegments(
    materialValidation.normalizedMaterial,
  );
  const focusA = compactSegments[0] || "the main repeated concept in your notes";
  const focusB =
    compactSegments[1] ||
    "the process or definition your teacher is most likely to test";
  const focusC =
    compactSegments[2] ||
    "the example or worked step you are least confident about";
  const courseContext = buildCourseContext(parsedInput);
  const teacherFocusHint = buildTeacherFocusHint(parsedInput);
  const subtitleParts = [
    parsedInput.examName,
    `${parsedInput.timeAvailable} left`,
    courseContext,
  ].filter(Boolean);

  return cramResponseSchema.parse({
    title: `${parsedInput.examName} Cram Plan`,
    subtitle: subtitleParts.join(" • "),
    studyFirst: [
      `${focusA} is the highest-yield place to start because it appears early or repeatedly in your material.`,
      `${focusB} should be your second focus because it is likely to show up as a definition, explanation, or worked response.`,
    ],
    studyNext: [
      `${focusC} once you can explain the first two from memory.`,
      teacherFocusHint,
    ],
    skipIfNeeded: [
      "Background details that never repeat and do not change the main answer.",
      "Low-signal examples you can recognize but probably do not need to memorize word-for-word.",
    ],
    likelyQuestions: [
      `Explain ${focusA} in your own words and say why it matters for ${parsedInput.examName}.`,
      `Compare or connect ${focusA} and ${focusB} in one short answer.`,
      `Walk through a likely example or scenario involving ${focusB}.`,
    ],
    quickSelfTest: [
      `Can you define ${focusA} without looking at your notes?`,
      `Can you explain one example that proves you understand ${focusB}?`,
      `Can you answer a likely short-response question on ${focusC} in under two minutes?`,
    ],
    timePlan: buildTimePlan(parsedInput.timeAvailable, focusA, focusB, focusC),
  });
}
