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
  status: "open" | "improving" | "closed";
  weight: number;
  evidenceCount: number;
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
    memorySummary: string;
  };
  recentSessions: Array<{
    title: string | null;
    notes: string | null;
    summary: string | null;
    keyTopics: string[];
    carryForward: string | null;
    startedAt: string;
    endedAt: string | null;
  }>;
  contextGuidance: {
    requestPriority: string[];
    screenshotUsefulness: string;
    backgroundUsefulness: string;
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
};

export type QuizResponse = {
  title: string;
  subtitle: string;
  questions: QuizQuestion[];
};
