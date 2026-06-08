export type ClassProfile = {
  id?: number;
  className: string;
  subject: string;
  currentUnit?: string | null;
  teacherFocus?: string | null;
  testFormat?: string | null;
  testExamples: string[];
  keyConcepts: string[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AssistRequest = {
  classId: number;
  sessionId?: number;
  actionType: string;
  selectedText: string;
  surroundingText?: string | null;
  pageTitle?: string | null;
  pageUrl?: string | null;
  userNote?: string | null;
  screenshotDataUrl?: string | null;
  requestMode?: "smart";
  screenshotPolicy?: "automatic" | "manual" | "disabled";
  tracingConsent?: {
    requestSyncConsent: "unknown" | "granted" | "denied";
    serverSyncConsent: "unknown" | "granted" | "denied";
    langfuseEnabled: boolean;
  };
};

export type Gap = {
  id?: number;
  classId?: number | null;
  topic: string;
  description?: string | null;
  scope: "session" | "class";
  status: "open" | "improving" | "closed";
  weight: number;
  evidenceCount: number;
  supportSignals: string[];
  lastConfidence?: number | null;
  lastEvidenceType?:
    | "self_doubt"
    | "review_request"
    | "direct_question"
    | "note_capture"
    | "general"
    | null;
  lastInteractionType?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ModelGapCandidate = {
  topic: string;
  description: string;
  evidence: string;
  confidence: number;
};

export type ModelAssistOutput = {
  student_response: string;
  possible_gaps: ModelGapCandidate[];
  next_step: string;
};

export type BuiltContext = {
  classProfile?: ClassProfile | null;
  activeGaps: Gap[];
  recentInteractions: Array<{
    id: number;
    question: string;
    response?: string | null;
    interactionType?: string | null;
    createdAt: string;
  }>;
  studentMemory: {
    recurringTopics: string[];
    preferredHelpModes: string[];
    knownStrengths: string[];
    memorySummary: string;
  };
  recentSessions: Array<{
    title: string | null;
    notes: string | null;
    summary: string | null;
    keyTopics: string[];
    carryForward: string | null;
    requestCount: number;
    detailedContext: string;
    startedAt: string;
    endedAt: string | null;
  }>;
  contextGuidance: {
    requestPriority: string[];
    screenshotUsefulness: string;
    backgroundUsefulness: string;
  };
  workingMemory: {
    currentRequest: string[];
    sessionWindow: string[];
    recentInteractions: Array<{
      id: number;
      question: string;
      response?: string | null;
      interactionType?: string | null;
      createdAt: string;
    }>;
    summary: string;
  };
  episodicMemory: {
    recentSessions: Array<{
      title: string | null;
      notes: string | null;
      summary: string | null;
      keyTopics: string[];
      carryForward: string | null;
      requestCount: number;
      detailedContext: string;
      startedAt: string;
      endedAt: string | null;
    }>;
    carryForwardItems: string[];
    summary: string;
  };
  semanticMemory: {
    activeGaps: Gap[];
    recurringTopics: string[];
    preferredHelpModes: string[];
    knownStrengths: string[];
    summary: string;
  };
  contextTiers: {
    immediate: string[];
    session: string[];
    class: string[];
    historical: string[];
  };
  contextPacket: {
    answering: string[];
    coaching: string[];
    avoid: string[];
  };
  sessionGoal?: string | null;
  summary: string;
};

export type AssistResponse = {
  interactionId: number;
  answer: string;
  nextStep: string;
  context: BuiltContext;
  gapCandidates: ModelGapCandidate[];
  screenViewed?: boolean;
};

export type SmartAssistNeedsScreenshotResponse = {
  requestMode: "smart";
  needsScreenshot: true;
  reason: string;
};

export type AssistRouteResponse =
  | AssistResponse
  | SmartAssistNeedsScreenshotResponse;

export type ModelScreenDecision = {
  wants_screen: boolean;
  reason: string;
};

export type FeedbackRequest = {
  interactionId: number;
  helped: boolean;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type TeacherAssessmentProfile = {
  profileId?: string | null;
  profileName?: string | null;
  testFormat?: string | null;
  conciseSummary?: string | null;
  genericDifferences: string[];
  exampleQuestions: string[];
  gradingSignals: string[];
  wordingPatterns: string[];
  likelyQuestionMoves: string[];
  quizAdjustments: string[];
  cramAdjustments: string[];
  sourceMaterialNames: string[];
};

export type AssessmentProfileMaterial = {
  name: string;
  content: string;
  handler?: string | null;
};

export type AssessmentProfileAnalysisRequest = {
  classId?: number;
  profileName?: string | null;
  presetLabel?: string | null;
  customFormat?: string | null;
  exampleQuestions: string[];
  gradingNotes?: string | null;
  uploadedMaterials: AssessmentProfileMaterial[];
};

export type AssessmentProfileAnalysisResponse = TeacherAssessmentProfile;

export type QuizRequest = {
  classId: number;
  sessionIds: number[];
  includeSessionSummary: boolean;
  includeSessionNotes: boolean;
  includeKeyTopics: boolean;
  includeUploadedMaterial: boolean;
  uploadedMaterial?: string | null;
  titleHint?: string | null;
  gapFocus: number;
  questionCount: number;
  teacherAssessmentProfile?: TeacherAssessmentProfile | null;
};

export type QuizResponse = {
  title: string;
  subtitle: string;
  questions: QuizQuestion[];
};

export type CramTimeAvailable =
  | "30 minutes"
  | "1 hour"
  | "2 hours"
  | "All night";

export type CramRequest = {
  classId?: number;
  examName: string;
  timeAvailable: CramTimeAvailable;
  examMaterial: string;
  additionalNotes?: string | null;
  courseName?: string | null;
  unitPathLabel?: string | null;
  teacherAssessmentProfile?: TeacherAssessmentProfile | null;
};

export type CramTopicImportance = "high" | "medium" | "low";

export type CramChunkTopic = {
  topic: string;
  importance: CramTopicImportance;
  whyItMatters: string;
  formulas: string[];
  definitions: string[];
  likelyQuestionAngles: string[];
  evidenceSnippets: string[];
};

export type CramChunkInsight = {
  chunkLabel: string;
  topics: CramChunkTopic[];
  repeatedIdeas: string[];
  formulas: string[];
  definitions: string[];
  likelyEmphasisSignals: string[];
};

export type CramExamMapTopic = {
  topic: string;
  priorityScore: number;
  whyItMatters: string;
  repeatedCount: number;
  formulas: string[];
  definitions: string[];
  likelyQuestionAngles: string[];
  supportingEvidence: string[];
};

export type CramExamMap = {
  overview: string;
  topTopics: CramExamMapTopic[];
  formulasToMemorize: string[];
  definitionsToKnow: string[];
  likelyEmphasisSignals: string[];
  sourceChunkCount: number;
};

export type CramResponse = {
  title: string;
  subtitle: string;
  studyFirst: string[];
  studyNext: string[];
  skipIfNeeded: string[];
  likelyQuestions: string[];
  quickSelfTest: string[];
  timePlan: string[];
};

export type CramTask = {
  title: string;
  topic: string;
  body: string;
  keyTakeaways: string[];
  vocabToKnow: string[];
  estimatedMinutes: number;
  priority: "must-review" | "quick-win" | "if-time";
  sourceLabels: string[];
  status: "not-started" | "reviewing" | "done" | "quiz";
  quizEnabled: boolean;
  quizPreview: {
    title: string;
    description: string;
    questionCount: number;
  } | null;
  quizId: string | null;
  lastScore: {
    correct: number;
    total: number;
  } | null;
};

export type CramPlanRequest = {
  classId: number;
  sessionIds: number[];
  examName?: string | null;
  deadline: string;
  availableMinutes: number;
  uploadedMaterial?: string | null;
  additionalNotes?: string | null;
  currentUnit?: string | null;
  gapFocus: number;
  teacherAssessmentProfile?: TeacherAssessmentProfile | null;
};

export type CramPlanResponse = {
  title: string;
  summary: string;
  sourceSummary: string;
  estimatedTotalMinutes: number;
  recommendedFirstTask: string;
  tasks: CramTask[];
};

export type PrivacySettings = {
  screenshotPolicy: "automatic" | "manual" | "disabled";
  syncConsent: "unknown" | "granted" | "denied";
  updatedAt?: string;
};

export type PrivacySettingsPatch = Partial<
  Pick<PrivacySettings, "screenshotPolicy" | "syncConsent">
>;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type RetentionJobType =
  | "retention_cleanup"
  | "account_deletion"
  | "export_user_data"
  | "summary_compaction";

export type RetentionJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type RetentionJob = {
  id: number;
  userId: string | null;
  jobType: RetentionJobType;
  status: RetentionJobStatus;
  runAfter: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};
