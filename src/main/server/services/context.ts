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
  created_at: string;
};

type SessionRow = {
  title: string | null;
  notes: string | null;
};

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
    createdAt: row.created_at,
  }));
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
  const sessionGoal = getSessionGoal(requestInput.sessionId);

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
    requestInput.pageTitle ? `Page: ${requestInput.pageTitle}` : null,
    sessionGoal ? `Session goal: ${sessionGoal}` : null,
  ]);

  return {
    classProfile,
    activeGaps,
    recentInteractions,
    sessionGoal,
    summary,
  };
}
