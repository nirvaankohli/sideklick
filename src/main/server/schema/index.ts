import { z } from "zod";

// Shared helpers keep route validation and model-output validation consistent.
const nullableTrimmedString = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional();

const nullableScreenshotDataUrl = z
  .string()
  .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/)
  .nullable()
  .optional();

const timestampString = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
]);

export const sessionModeSchema = z.enum(["study", "review"]);

export const classProfileSchema = z.object({
  id: z.number().int().positive().optional(),
  className: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  currentUnit: nullableTrimmedString,
  teacherFocus: nullableTrimmedString,
  keyConcepts: z.array(z.string().trim().min(1)).default([]),
  notes: nullableTrimmedString,
  createdAt: timestampString.optional(),
  updatedAt: timestampString.optional(),
});

export const gapSchema = z.object({
  id: z.number().int().positive().optional(),
  classId: z.number().int().positive().nullable().optional(),
  topic: z.string().trim().min(1),
  description: nullableTrimmedString,
  status: z.enum(["open", "improving", "closed"]),
  weight: z.number().int().min(0),
  evidenceCount: z.number().int().min(0),
  lastSeenAt: timestampString.nullable().optional(),
  createdAt: timestampString.optional(),
  updatedAt: timestampString.optional(),
});

export const modelGapCandidateSchema = z.object({
  topic: z.string().trim().min(1),
  description: z.string().trim().min(1),
  evidence: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
}).strict();

export const modelAssistOutputSchema = z.object({
  student_response: z.string().trim().min(1),
  possible_gaps: z.array(modelGapCandidateSchema),
  next_step: z.string().trim().min(1),
}).strict();

export const builtContextSchema = z.object({
  classProfile: classProfileSchema.nullable().optional(),
  activeGaps: z.array(gapSchema),
  recentInteractions: z.array(
    z.object({
      id: z.number().int().positive(),
      question: z.string().trim().min(1),
      response: nullableTrimmedString,
      interactionType: nullableTrimmedString,
      createdAt: timestampString,
    }),
  ),
  studentMemory: z.object({
    recurringTopics: z.array(z.string().trim().min(1)),
    preferredHelpModes: z.array(z.string().trim().min(1)),
    memorySummary: z.string().trim().min(1),
  }),
  recentSessions: z.array(
    z.object({
      title: nullableTrimmedString,
      notes: nullableTrimmedString,
      summary: nullableTrimmedString,
      keyTopics: z.array(z.string().trim().min(1)),
      carryForward: nullableTrimmedString,
      startedAt: timestampString,
      endedAt: timestampString.nullable(),
    }),
  ),
  contextGuidance: z.object({
    requestPriority: z.array(z.string().trim().min(1)),
    screenshotUsefulness: z.string().trim().min(1),
    backgroundUsefulness: z.string().trim().min(1),
  }),
  sessionMode: sessionModeSchema,
  sessionGoal: nullableTrimmedString,
  summary: z.string().trim().min(1),
});

export const assistRequestSchema = z.object({
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive().optional(),
  mode: sessionModeSchema.default("study"),
  actionType: z.string().trim().min(1),
  selectedText: z.string().trim().min(1),
  surroundingText: nullableTrimmedString,
  pageTitle: nullableTrimmedString,
  pageUrl: z.string().trim().url().nullable().optional(),
  userNote: nullableTrimmedString,
  screenshotDataUrl: nullableScreenshotDataUrl,
}).strict();

export const assistResponseSchema = z.object({
  interactionId: z.number().int().positive(),
  answer: z.string().trim().min(1),
  nextStep: z.string().trim().min(1),
  context: builtContextSchema,
  // Model output is the least trustworthy input in the system, so validate it
  // as strictly as client requests.
  gapCandidates: z.array(modelGapCandidateSchema),
}).strict();

export const feedbackRequestSchema = z.object({
  interactionId: z.number().int().positive(),
  helped: z.boolean(),
}).strict();

export type ClassProfileInput = z.infer<typeof classProfileSchema>;
export type GapInput = z.infer<typeof gapSchema>;
export type ModelAssistOutputInput = z.infer<typeof modelAssistOutputSchema>;
export type ModelGapCandidateInput = z.infer<typeof modelGapCandidateSchema>;
export type BuiltContextInput = z.infer<typeof builtContextSchema>;
export type AssistRequestInput = z.infer<typeof assistRequestSchema>;
export type AssistResponseInput = z.infer<typeof assistResponseSchema>;
export type FeedbackRequestInput = z.infer<typeof feedbackRequestSchema>;
