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

export const classProfileSchema = z.object({
  id: z.number().int().positive().optional(),
  className: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  currentUnit: nullableTrimmedString,
  teacherFocus: nullableTrimmedString,
  testFormat: nullableTrimmedString,
  testExamples: z.array(z.string().trim().min(1)).default([]),
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
  scope: z.enum(["session", "class"]).default("class"),
  status: z.enum(["open", "improving", "closed"]),
  weight: z.number().int().min(0),
  evidenceCount: z.number().int().min(0),
  supportSignals: z.array(z.string().trim().min(1)).default([]),
  lastConfidence: z.number().min(0).max(1).nullable().optional(),
  lastEvidenceType: z
    .enum([
      "self_doubt",
      "review_request",
      "direct_question",
      "note_capture",
      "general",
    ])
    .nullable()
    .optional(),
  lastInteractionType: nullableTrimmedString,
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
    knownStrengths: z.array(z.string().trim().min(1)),
    memorySummary: z.string().trim().min(1),
  }),
  recentSessions: z.array(
    z.object({
      title: nullableTrimmedString,
      notes: nullableTrimmedString,
      summary: nullableTrimmedString,
      keyTopics: z.array(z.string().trim().min(1)),
      carryForward: nullableTrimmedString,
      requestCount: z.number().int().min(0),
      detailedContext: z.string().trim().min(1),
      startedAt: timestampString,
      endedAt: timestampString.nullable(),
    }),
  ),
  contextGuidance: z.object({
    requestPriority: z.array(z.string().trim().min(1)),
    screenshotUsefulness: z.string().trim().min(1),
    backgroundUsefulness: z.string().trim().min(1),
  }),
  workingMemory: z.object({
    currentRequest: z.array(z.string().trim().min(1)),
    sessionWindow: z.array(z.string().trim().min(1)),
    recentInteractions: z.array(
      z.object({
        id: z.number().int().positive(),
        question: z.string().trim().min(1),
        response: nullableTrimmedString,
        interactionType: nullableTrimmedString,
        createdAt: timestampString,
      }),
    ),
    summary: z.string().trim().min(1),
  }),
  episodicMemory: z.object({
    recentSessions: z.array(
      z.object({
        title: nullableTrimmedString,
        notes: nullableTrimmedString,
        summary: nullableTrimmedString,
        keyTopics: z.array(z.string().trim().min(1)),
        carryForward: nullableTrimmedString,
        requestCount: z.number().int().min(0),
        detailedContext: z.string().trim().min(1),
        startedAt: timestampString,
        endedAt: timestampString.nullable(),
      }),
    ),
    carryForwardItems: z.array(z.string().trim().min(1)),
    summary: z.string().trim().min(1),
  }),
  semanticMemory: z.object({
    activeGaps: z.array(gapSchema),
    recurringTopics: z.array(z.string().trim().min(1)),
    preferredHelpModes: z.array(z.string().trim().min(1)),
    knownStrengths: z.array(z.string().trim().min(1)),
    summary: z.string().trim().min(1),
  }),
  contextTiers: z.object({
    immediate: z.array(z.string().trim().min(1)),
    session: z.array(z.string().trim().min(1)),
    class: z.array(z.string().trim().min(1)),
    historical: z.array(z.string().trim().min(1)),
  }),
  contextPacket: z.object({
    answering: z.array(z.string().trim().min(1)),
    coaching: z.array(z.string().trim().min(1)),
    avoid: z.array(z.string().trim().min(1)),
  }),
  sessionGoal: nullableTrimmedString,
  summary: z.string().trim().min(1),
});

export const assistRequestSchema = z.object({
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive().optional(),
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

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1),
}).strict();

export const teacherAssessmentProfileSchema = z.object({
  profileId: nullableTrimmedString,
  profileName: nullableTrimmedString,
  testFormat: nullableTrimmedString,
  conciseSummary: nullableTrimmedString,
  genericDifferences: z.array(z.string().trim().min(1)).max(6).default([]),
  exampleQuestions: z.array(z.string().trim().min(1)).max(8).default([]),
  gradingSignals: z.array(z.string().trim().min(1)).max(8).default([]),
  wordingPatterns: z.array(z.string().trim().min(1)).max(8).default([]),
  likelyQuestionMoves: z.array(z.string().trim().min(1)).max(8).default([]),
  quizAdjustments: z.array(z.string().trim().min(1)).max(6).default([]),
  cramAdjustments: z.array(z.string().trim().min(1)).max(6).default([]),
  sourceMaterialNames: z.array(z.string().trim().min(1)).max(12).default([]),
}).strict();

export const assessmentProfileMaterialSchema = z.object({
  name: z.string().trim().min(1),
  content: z.string().trim().min(1),
  handler: nullableTrimmedString,
}).strict();

export const assessmentProfileAnalysisRequestSchema = z.object({
  classId: z.number().int().positive().optional(),
  profileName: nullableTrimmedString,
  presetLabel: nullableTrimmedString,
  customFormat: nullableTrimmedString,
  exampleQuestions: z.array(z.string().trim().min(1)).max(12).default([]),
  gradingNotes: nullableTrimmedString,
  uploadedMaterials: z.array(assessmentProfileMaterialSchema).min(1).max(12),
}).strict();

export const assessmentProfileAnalysisResponseSchema =
  teacherAssessmentProfileSchema;

export const quizRequestSchema = z.object({
  classId: z.number().int().positive(),
  sessionIds: z.array(z.number().int().positive()).default([]),
  includeSessionSummary: z.boolean(),
  includeSessionNotes: z.boolean(),
  includeKeyTopics: z.boolean(),
  includeUploadedMaterial: z.boolean(),
  uploadedMaterial: nullableTrimmedString,
  gapFocus: z.number().min(0).max(100),
  questionCount: z.number().int().min(3).max(8).default(5),
  teacherAssessmentProfile: teacherAssessmentProfileSchema.nullable().optional(),
}).strict();

export const quizResponseSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  questions: z.array(quizQuestionSchema).min(3).max(8),
}).strict();

<<<<<<< HEAD
<<<<<<< HEAD
export const cramTimeAvailableSchema = z.enum([
  "30 minutes",
  "1 hour",
  "2 hours",
  "All night",
]);

export const cramRequestSchema = z.object({
  classId: z.number().int().positive().optional(),
  examName: z.string().trim().min(1),
  timeAvailable: cramTimeAvailableSchema,
  examMaterial: z.string().trim().min(1),
  additionalNotes: nullableTrimmedString,
  courseName: nullableTrimmedString,
  unitPathLabel: nullableTrimmedString,
  teacherAssessmentProfile: teacherAssessmentProfileSchema.nullable().optional(),
}).strict();

export const cramTopicImportanceSchema = z.enum(["high", "medium", "low"]);

export const cramChunkTopicSchema = z.object({
  topic: z.string().trim().min(1),
  importance: cramTopicImportanceSchema,
  whyItMatters: z.string().trim().min(1),
  formulas: z.array(z.string().trim().min(1)).max(4),
  definitions: z.array(z.string().trim().min(1)).max(4),
  likelyQuestionAngles: z.array(z.string().trim().min(1)).max(4),
  evidenceSnippets: z.array(z.string().trim().min(1)).min(1).max(4),
}).strict();

export const cramChunkInsightSchema = z.object({
  chunkLabel: z.string().trim().min(1),
  topics: z.array(cramChunkTopicSchema).min(1).max(6),
  repeatedIdeas: z.array(z.string().trim().min(1)).max(6),
  formulas: z.array(z.string().trim().min(1)).max(6),
  definitions: z.array(z.string().trim().min(1)).max(6),
  likelyEmphasisSignals: z.array(z.string().trim().min(1)).max(6),
}).strict();

export const cramExamMapTopicSchema = z.object({
  topic: z.string().trim().min(1),
  priorityScore: z.number().int().min(1).max(10),
  whyItMatters: z.string().trim().min(1),
  repeatedCount: z.number().int().min(1),
  formulas: z.array(z.string().trim().min(1)).max(5),
  definitions: z.array(z.string().trim().min(1)).max(5),
  likelyQuestionAngles: z.array(z.string().trim().min(1)).max(5),
  supportingEvidence: z.array(z.string().trim().min(1)).min(1).max(5),
}).strict();

export const cramExamMapSchema = z.object({
  overview: z.string().trim().min(1),
  topTopics: z.array(cramExamMapTopicSchema).min(1).max(8),
  formulasToMemorize: z.array(z.string().trim().min(1)).max(8),
  definitionsToKnow: z.array(z.string().trim().min(1)).max(8),
  likelyEmphasisSignals: z.array(z.string().trim().min(1)).max(8),
  sourceChunkCount: z.number().int().min(1),
}).strict();

export const cramResponseSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  studyFirst: z.array(z.string().trim().min(1)).min(1).max(4),
  studyNext: z.array(z.string().trim().min(1)).min(1).max(4),
  skipIfNeeded: z.array(z.string().trim().min(1)).min(1).max(4),
  likelyQuestions: z.array(z.string().trim().min(1)).min(3).max(6),
  quickSelfTest: z.array(z.string().trim().min(1)).min(3).max(6),
  timePlan: z.array(z.string().trim().min(1)).min(3).max(5),
=======
=======
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
export const cramTaskSchema = z.object({
  title: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  estimatedMinutes: z.number().int().min(5).max(180),
  priority: z.enum(["must-review", "quick-win", "if-time"]),
  sourceLabels: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(["not-started", "reviewing", "done", "quiz"]).default("not-started"),
  quizEnabled: z.boolean().default(true),
  quizId: z.string().trim().min(1).optional(),
  lastScore: z
    .object({
      correct: z.number().int().min(0),
      total: z.number().int().positive(),
    })
    .strict()
    .optional(),
}).strict();

export const cramPlanRequestSchema = z.object({
  classId: z.number().int().positive(),
  sessionIds: z.array(z.number().int().positive()).default([]),
  deadline: z.string().trim().min(1),
  availableMinutes: z.number().int().min(15).max(1440),
  uploadedMaterial: nullableTrimmedString,
  currentUnit: nullableTrimmedString,
  gapFocus: z.number().min(0).max(100).default(50),
}).strict();

export const cramPlanResponseSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  sourceSummary: z.string().trim().min(1),
  estimatedTotalMinutes: z.number().int().min(1),
  recommendedFirstTask: z.string().trim().min(1),
  tasks: z.array(cramTaskSchema).min(3).max(8),
<<<<<<< HEAD
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
=======
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
}).strict();

export const privacySettingsSchema = z.object({
  screenshotPolicy: z.enum(["automatic", "manual", "disabled"]),
  syncConsent: z.enum(["unknown", "granted", "denied"]),
  updatedAt: timestampString.optional(),
}).strict();

export const privacySettingsPatchSchema = privacySettingsSchema
  .omit({ updatedAt: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Privacy settings patch cannot be empty.",
  });

export const deleteAccountRequestSchema = z.object({
  confirm: z.literal(true),
}).strict();

export const exportRequestQuerySchema = z.object({
  includeContent: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value !== "false"),
}).strict();

export const authCredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(120).optional(),
}).strict();

export type ClassProfileInput = z.infer<typeof classProfileSchema>;
export type GapInput = z.infer<typeof gapSchema>;
export type ModelAssistOutputInput = z.infer<typeof modelAssistOutputSchema>;
export type ModelGapCandidateInput = z.infer<typeof modelGapCandidateSchema>;
export type BuiltContextInput = z.infer<typeof builtContextSchema>;
export type AssistRequestInput = z.infer<typeof assistRequestSchema>;
export type AssistResponseInput = z.infer<typeof assistResponseSchema>;
export type FeedbackRequestInput = z.infer<typeof feedbackRequestSchema>;
export type TeacherAssessmentProfileInput = z.infer<
  typeof teacherAssessmentProfileSchema
>;
export type AssessmentProfileMaterialInput = z.infer<
  typeof assessmentProfileMaterialSchema
>;
export type AssessmentProfileAnalysisRequestInput = z.infer<
  typeof assessmentProfileAnalysisRequestSchema
>;
export type AssessmentProfileAnalysisResponseInput = z.infer<
  typeof assessmentProfileAnalysisResponseSchema
>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizRequestInput = z.infer<typeof quizRequestSchema>;
export type QuizResponseInput = z.infer<typeof quizResponseSchema>;
<<<<<<< HEAD
<<<<<<< HEAD
export type CramTimeAvailableInput = z.infer<typeof cramTimeAvailableSchema>;
export type CramRequestInput = z.infer<typeof cramRequestSchema>;
export type CramTopicImportanceInput = z.infer<typeof cramTopicImportanceSchema>;
export type CramChunkTopicInput = z.infer<typeof cramChunkTopicSchema>;
export type CramChunkInsightInput = z.infer<typeof cramChunkInsightSchema>;
export type CramExamMapTopicInput = z.infer<typeof cramExamMapTopicSchema>;
export type CramExamMapInput = z.infer<typeof cramExamMapSchema>;
export type CramResponseInput = z.infer<typeof cramResponseSchema>;
=======
export type CramTaskInput = z.infer<typeof cramTaskSchema>;
export type CramPlanRequestInput = z.infer<typeof cramPlanRequestSchema>;
export type CramPlanResponseInput = z.infer<typeof cramPlanResponseSchema>;
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
=======
export type CramTaskInput = z.infer<typeof cramTaskSchema>;
export type CramPlanRequestInput = z.infer<typeof cramPlanRequestSchema>;
export type CramPlanResponseInput = z.infer<typeof cramPlanResponseSchema>;
>>>>>>> 69d616b (Add full-page cram mode with quiz integration)
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type PrivacySettingsPatchInput = z.infer<typeof privacySettingsPatchSchema>;
export type DeleteAccountRequestInput = z.infer<typeof deleteAccountRequestSchema>;
export type ExportRequestQueryInput = z.infer<typeof exportRequestQuerySchema>;
