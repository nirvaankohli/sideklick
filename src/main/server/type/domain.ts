export type ClassProfile = {
  id?: number;
  className: string;
  subject: string;
  currentUnit?: string | null;
  teacherFocus?: string | null;
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

export type QuizRequest = {
  classId: number;
  sessionIds: number[];
  includeSessionSummary: boolean;
  includeSessionNotes: boolean;
  includeKeyTopics: boolean;
  includeUploadedMaterial: boolean;
  uploadedMaterial?: string | null;
  gapFocus: number;
  questionCount: number;
};

export type QuizResponse = {
  title: string;
  subtitle: string;
  questions: QuizQuestion[];
};

export type CramRequest = {
  classId?: number | null;
  courseName?: string | null;
  unitPathLabel?: string | null;
  examName: string;
  timeAvailable: string;
  examMaterial: string;
  additionalNotes?: string | null;
  teacherAssessmentProfile?: any | null;
};

export type CramResponse = {
  title?: string;
  subtitle: string;
  studyFirst: string[];
  studyNext: string[];
  skipIfNeeded: string[];
  timePlan: string[];
  likelyQuestions: string[];
  quickSelfTest: string[];
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
