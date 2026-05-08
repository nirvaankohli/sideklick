import { getDatabase } from "../db";
import type { AssistRequest, BuiltContext, Gap } from "../type";
import { getClassProfileById } from "./classes";

const GAP_CANDIDATE_LIMIT = 20;
const TOP_GAP_LIMIT = 5;
const RECENT_WINDOW_DAYS = 14;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "what",
  "why",
  "with",
]);

type GapRow = {
  id: number;
  class_id: number | null;
  topic: string;
  description: string | null;
  status: "open" | "improving" | "closed";
  weight: number;
  evidence_count: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

type InteractionRow = {
  id: number;
  prompt: string;
  response: string | null;
  interaction_type: string | null;
  created_at: string;
};

type SessionRow = {
  title: string | null;
  notes: string | null;
};

type RecentSessionRow = {
  title: string | null;
  notes: string | null;
  summary: string | null;
  key_topics: string;
  carry_forward: string | null;
  request_count: number;
  ended_at: string | null;
  started_at: string;
};

function uniqueOrdered(items: string[], limit?: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
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

function mapGapRow(row: GapRow): Gap {
  return {
    id: row.id,
    classId: row.class_id,
    topic: row.topic,
    description: row.description,
    status: row.status,
    weight: row.weight,
    evidenceCount: row.evidence_count,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function extractTopTokens(textBlocks: Array<string | null | undefined>, limit = 6): string[] {
  const counts = new Map();

  for (const textBlock of textBlocks) {
    if (!textBlock) {
      continue;
    }

    for (const token of tokenizeText(textBlock)) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([token]) => token);
}

function buildKeywordSet(requestInput: AssistRequest): Set<string> {
  const combinedText = [
    requestInput.selectedText,
    requestInput.surroundingText,
    requestInput.pageTitle,
    requestInput.userNote,
    requestInput.actionType,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return new Set(tokenizeText(combinedText));
}

function getDaysSince(dateString?: string | null): number | null {
  if (!dateString) {
    return null;
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const elapsedMilliseconds = Date.now() - parsedDate.getTime();
  return elapsedMilliseconds / (1000 * 60 * 60 * 24);
}

function getRecencyScore(gap: Gap): number {
  const daysSinceSeen = getDaysSince(gap.lastSeenAt ?? gap.updatedAt);
  if (daysSinceSeen === null) {
    return 0;
  }

  if (daysSinceSeen <= 2) {
    return 3;
  }

  if (daysSinceSeen <= 7) {
    return 2;
  }

  if (daysSinceSeen <= RECENT_WINDOW_DAYS) {
    return 1;
  }

  return 0;
}

function getKeywordMatchScore(gap: Gap, requestKeywords: Set<string>): number {
  if (requestKeywords.size === 0) {
    return 0;
  }

  const gapKeywords = new Set(
    tokenizeText([gap.topic, gap.description].filter(Boolean).join(" ")),
  );

  let matchCount = 0;
  for (const keyword of requestKeywords) {
    if (gapKeywords.has(keyword)) {
      matchCount += 1;
    }
  }

  if (matchCount >= 3) {
    return 4;
  }

  if (matchCount === 2) {
    return 3;
  }

  if (matchCount === 1) {
    return 2;
  }

  return 0;
}

function getWeightScore(gap: Gap): number {
  if (gap.weight >= 8) {
    return 4;
  }

  if (gap.weight >= 5) {
    return 3;
  }

  if (gap.weight >= 3) {
    return 2;
  }

  if (gap.weight >= 1) {
    return 1;
  }

  return 0;
}

function compareGaps(
  left: { gap: Gap; score: number },
  right: { gap: Gap; score: number },
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const rightUpdatedAt = right.gap.lastSeenAt ?? right.gap.updatedAt ?? "";
  const leftUpdatedAt = left.gap.lastSeenAt ?? left.gap.updatedAt ?? "";

  if (rightUpdatedAt !== leftUpdatedAt) {
    return rightUpdatedAt.localeCompare(leftUpdatedAt);
  }

  if (right.gap.weight !== left.gap.weight) {
    return right.gap.weight - left.gap.weight;
  }

  return right.gap.evidenceCount - left.gap.evidenceCount;
}

function rankGaps(gaps: Gap[], requestInput: AssistRequest): Gap[] {
  const requestKeywords = buildKeywordSet(requestInput);

  // Score gaps with a transparent heuristic:
  // recurring weak spots + recent evidence + overlap with the current ask.
  return gaps
    .map((gap) => ({
      gap,
      score:
        getWeightScore(gap) +
        getRecencyScore(gap) +
        getKeywordMatchScore(gap, requestKeywords),
    }))
    .sort(compareGaps)
    .slice(0, TOP_GAP_LIMIT)
    .map(({ gap }) => gap);
}

function getTopActiveGaps(
  classId: number | undefined,
  requestInput: AssistRequest,
): Gap[] {
  if (!classId) {
    return [];
  }

  const db = getDatabase();
  const rows = db.prepare(
    `
      SELECT
        id,
        class_id,
        topic,
        description,
        status,
        weight,
        evidence_count,
        last_seen_at,
        created_at,
        updated_at
      FROM gaps
      WHERE class_id = ? AND status != 'closed'
      ORDER BY weight DESC, last_seen_at DESC, updated_at DESC
      LIMIT ?
    `,
  ).all(classId, GAP_CANDIDATE_LIMIT) as GapRow[];

  return rankGaps(rows.map(mapGapRow), requestInput);
}

function getRecentInteractions(
  classId?: number,
  sessionId?: number,
): BuiltContext["recentInteractions"] {
  const db = getDatabase();

  if (sessionId) {
    // Session-specific history is usually the best short-term context.
    const rows = db.prepare(
      `
        SELECT id, prompt, response, created_at
        , interaction_type
        FROM interactions
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT 6
      `,
    ).all(sessionId) as InteractionRow[];

    return rows.map((row) => ({
      id: row.id,
      question: row.prompt,
      response: row.response,
      interactionType: row.interaction_type,
      createdAt: row.created_at,
    }));
  }

  if (!classId) {
    return [];
  }

  // Fall back to recent class-level history when there is no active session.
  const rows = db.prepare(
    `
      SELECT id, prompt, response, created_at
      , interaction_type
      FROM interactions
      WHERE class_id = ?
      ORDER BY created_at DESC
      LIMIT 6
    `,
  ).all(classId) as InteractionRow[];

  return rows.map((row) => ({
      id: row.id,
      question: row.prompt,
      response: row.response,
      interactionType: row.interaction_type,
      createdAt: row.created_at,
    }));
}

function buildStudentMemory(
  recentInteractions: BuiltContext["recentInteractions"],
  recentSessions: BuiltContext["recentSessions"],
  activeGaps: Gap[],
): BuiltContext["studentMemory"] {
  const recurringTopics = extractTopTokens([
    ...recentInteractions.map((interaction) => interaction.question),
    ...recentInteractions.map((interaction) => interaction.response ?? null),
    ...activeGaps.map((gap) => gap.topic),
    ...activeGaps.map((gap) => gap.description ?? null),
  ]);

  const preferredModeCounts = new Map();
  for (const interaction of recentInteractions) {
    if (!interaction.interactionType) {
      continue;
    }

    preferredModeCounts.set(
      interaction.interactionType,
      (preferredModeCounts.get(interaction.interactionType) || 0) + 1,
    );
  }

  const preferredHelpModes = [...preferredModeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([interactionType]) => interactionType);

  const gapKeywords = new Set(
    activeGaps.flatMap((gap) => tokenizeText([gap.topic, gap.description].filter(Boolean).join(" "))),
  );
  const knownStrengths = uniqueOrdered(
    recentSessions
      .flatMap((session) => session.keyTopics)
      .filter((topic) => !gapKeywords.has(topic.toLowerCase())),
    6,
  );
  const recentCoverage = uniqueOrdered(
    recentSessions.flatMap((session) => session.keyTopics),
    8,
  );

  const summaryParts = [
    recurringTopics.length > 0
      ? `Recurring topics: ${recurringTopics.join(", ")}`
      : null,
    preferredHelpModes.length > 0
      ? `Usually asks for: ${preferredHelpModes.join(", ")}`
      : null,
    knownStrengths.length > 0
      ? `Known strengths or covered ideas: ${knownStrengths.join(", ")}`
      : null,
    activeGaps.length > 0
      ? `Most active gaps: ${activeGaps.slice(0, 3).map((gap) => gap.topic).join(", ")}`
      : null,
    recentCoverage.length > 0
      ? `Recently covered: ${recentCoverage.join(", ")}`
      : null,
  ].filter(Boolean);

  return {
    recurringTopics,
    preferredHelpModes,
    knownStrengths,
    memorySummary:
      summaryParts.length > 0
        ? summaryParts.join(" | ")
        : "Very little prior memory yet.",
  };
}

function getSessionGoal(sessionId?: number): string | null {
  if (!sessionId) {
    return null;
  }

  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT title, notes
      FROM sessions
      WHERE id = ?
    `,
  ).get(sessionId) as SessionRow | undefined;

  if (!row) {
    return null;
  }

  return row.title ?? row.notes ?? null;
}

function getRecentSessionContext(
  classId?: number,
): BuiltContext["recentSessions"] {
  if (!classId) {
    return [];
  }

  const db = getDatabase();
  const rows = db.prepare(
    `
      SELECT title, notes, summary, key_topics, carry_forward, ended_at, started_at
      , request_count
      FROM sessions
      WHERE class_id = ?
      ORDER BY COALESCE(ended_at, started_at) DESC
      LIMIT 3
    `,
  ).all(classId) as RecentSessionRow[];

  return rows.map((row) => {
    const keyTopics = JSON.parse(row.key_topics) as string[];
    const requestLabel = `${row.request_count} request${row.request_count === 1 ? "" : "s"}`;
    const detailedParts = [
      row.title ? `Session: ${row.title}` : "Session available",
      row.summary ? `Summary: ${row.summary}` : null,
      keyTopics.length > 0 ? `Covered topics: ${keyTopics.join(", ")}` : null,
      row.carry_forward ? `Carry forward: ${row.carry_forward}` : null,
      `Workload: ${requestLabel}`,
      row.ended_at
        ? `Ended: ${row.ended_at}`
        : `Started: ${row.started_at}`,
    ].filter((part): part is string => Boolean(part));

    return {
      title: row.title,
      notes: row.notes,
      summary: row.summary,
      keyTopics,
      carryForward: row.carry_forward,
      requestCount: row.request_count,
      detailedContext: detailedParts.join(" | "),
      startedAt: row.started_at,
      endedAt: row.ended_at,
    };
  });
}

function buildContextGuidance(
  requestInput: AssistRequest,
): BuiltContext["contextGuidance"] {
  const combinedRequestText = [
    requestInput.selectedText,
    requestInput.surroundingText,
    requestInput.userNote,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  const selfDoubtPatterns = [
    "i don't know",
    "i dont know",
    "not sure",
    "unsure",
    "confused",
    "don't remember",
    "dont remember",
    "forget",
    "might not know",
    "do i know",
  ];
  const reviewPatterns = [
    "review",
    "revise",
    "study",
    "focus on",
    "what should i focus on",
    "what should i review",
  ];
  const hasSelfDoubtSignal = selfDoubtPatterns.some((pattern) =>
    combinedRequestText.includes(pattern),
  );
  const isReviewRequest =
    requestInput.actionType === "focus_page" ||
    reviewPatterns.some((pattern) => combinedRequestText.includes(pattern));

  const requestPriority = [
    "Answer the selected text and explicit action first.",
    requestInput.surroundingText
      ? "Use surrounding page text to disambiguate the question."
      : "There is little surrounding text, so avoid over-assuming page context.",
    requestInput.pageTitle
      ? `Use page title as lightweight background: ${requestInput.pageTitle}`
      : "There is no strong page-title context.",
    requestInput.userNote
      ? "User note may carry the student's goal or extra constraints."
      : "There is no extra user note.",
    hasSelfDoubtSignal
      ? "The student sounds unsure, so treat that uncertainty as likely evidence of a real gap."
      : "Do not infer a gap unless the request or memory supports it.",
    isReviewRequest
      ? "This is a review-oriented request, so use the most relevant past gaps and unresolved topics."
      : "Past gaps are supporting context, not the main answer unless they clearly apply.",
  ];

  const screenshotUsefulness = requestInput.screenshotDataUrl
    ? requestInput.selectedText.length >= 180 || Boolean(requestInput.surroundingText)
      ? "A screenshot is available, but it may only be secondary evidence if the text already gives enough detail."
      : "A screenshot is available and may be important if the ask depends on layout, diagrams, or non-textual cues."
    : "No screenshot is available.";

  const backgroundUsefulness =
    "Use class profile, prior sessions, and active gaps when they sharpen the answer. Do not let old memory override the current request.";

  return {
    requestPriority,
    screenshotUsefulness,
    backgroundUsefulness,
  };
}

function buildSummary(parts: Array<string | null | undefined>): string {
  const filteredParts = parts.filter(
    (part): part is string => Boolean(part && part.trim().length > 0),
  );

  return filteredParts.length > 0
    ? filteredParts.join(" | ")
    : "No saved class context yet.";
}

export function buildContext(
  classId: number | undefined,
  requestInput: AssistRequest,
): BuiltContext {
  // Prefer the explicit function argument, but still allow the request payload
  // to carry the class ID when the caller only has one object in hand.
  const resolvedClassId = classId ?? requestInput.classId;
  const classProfile = resolvedClassId
    ? getClassProfileById(resolvedClassId)
    : null;
  const activeGaps = getTopActiveGaps(resolvedClassId, requestInput);
  const recentInteractions = getRecentInteractions(
    resolvedClassId,
    requestInput.sessionId,
  );
  const recentSessionContext = getRecentSessionContext(resolvedClassId);
  const studentMemory = buildStudentMemory(
    recentInteractions,
    recentSessionContext,
    activeGaps,
  );
  if (recentSessionContext.length > 0) {
    const sessionSummaries = recentSessionContext.map((session) => session.detailedContext);
    studentMemory.memorySummary = [
      studentMemory.memorySummary,
      sessionSummaries.length > 0
        ? `Recent sessions: ${sessionSummaries.join(" || ")}`
        : null,
    ].join(" | ");
  }
  const sessionGoal = getSessionGoal(requestInput.sessionId);
  const contextGuidance = buildContextGuidance(requestInput);

  // Keep the summary compact so it can be dropped straight into a model prompt.
  const summary = buildSummary([
    classProfile
      ? `${classProfile.className} (${classProfile.subject})`
      : null,
    `Action: ${requestInput.actionType}`,
    classProfile?.currentUnit
      ? `Unit: ${classProfile.currentUnit}`
      : null,
    classProfile?.teacherFocus
      ? `Teacher focus: ${classProfile.teacherFocus}`
      : null,
    classProfile && classProfile.keyConcepts.length > 0
      ? `Key concepts: ${classProfile.keyConcepts.slice(0, 4).join(", ")}`
      : null,
    activeGaps.length > 0
      ? `Top gaps: ${activeGaps.map((gap) => gap.topic).join(", ")}`
      : null,
    studentMemory.knownStrengths.length > 0
      ? `Known strengths: ${studentMemory.knownStrengths.join(", ")}`
      : null,
    studentMemory.memorySummary,
    recentSessionContext.length > 0
      ? `Recent session topics: ${recentSessionContext.flatMap((session) => session.keyTopics).slice(0, 6).join(", ")}`
      : null,
    requestInput.pageTitle ? `Page: ${requestInput.pageTitle}` : null,
    sessionGoal ? `Session goal: ${sessionGoal}` : null,
    contextGuidance.screenshotUsefulness,
  ]);

  return {
    classProfile,
    activeGaps,
    recentInteractions,
    studentMemory,
    recentSessions: recentSessionContext,
    contextGuidance,
    sessionGoal,
    summary,
  };
}
