import { getDatabase } from "../db/index.ts";

type SessionRow = {
  id: number;
  class_id: number | null;
  started_at: string;
  ended_at: string | null;
  title: string | null;
  notes: string | null;
  summary: string | null;
  key_topics: string;
  carry_forward: string | null;
  request_count: number;
  screenshot_preview: string | null;
};

type SessionInteractionRow = {
  prompt: string;
  response: string | null;
  interaction_type: string | null;
  response_payload: string | null;
};

export type SessionRecord = {
  id: number;
  classId: number | null;
  startedAt: string;
  endedAt: string | null;
  title: string | null;
  notes: string | null;
  summary: string | null;
  keyTopics: string[];
  carryForward: string | null;
  requestCount: number;
  screenshotPreview: string | null;
};

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
  "with",
]);

function mapSessionRow(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    classId: row.class_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    title: row.title,
    notes: row.notes,
    summary: row.summary,
    keyTopics: JSON.parse(row.key_topics) as string[],
    carryForward: row.carry_forward,
    requestCount: row.request_count,
    screenshotPreview: row.screenshot_preview,
  };
}

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function extractTopTopics(
  interactions: SessionInteractionRow[],
  limit = 5,
): string[] {
  const counts = new Map<string, number>();

  for (const interaction of interactions) {
    const combinedText = [interaction.prompt, interaction.response ?? null]
      .filter(Boolean)
      .join(" ");

    for (const token of tokenizeText(combinedText)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
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

function extractCarryForward(
  interactions: SessionInteractionRow[],
): string | null {
  const nextSteps: string[] = [];

  for (const interaction of interactions) {
    if (!interaction.response_payload) {
      continue;
    }

    try {
      const parsed = JSON.parse(interaction.response_payload) as {
        nextStep?: unknown;
      };
      if (
        typeof parsed.nextStep === "string" &&
        parsed.nextStep.trim().length > 0
      ) {
        nextSteps.push(parsed.nextStep.trim());
      }
    } catch {
      continue;
    }
  }

  return nextSteps.length > 0 ? nextSteps[nextSteps.length - 1] : null;
}

function buildSessionSummary(
  title: string | null,
  notes: string | null,
  interactions: SessionInteractionRow[],
): {
  summary: string;
  keyTopics: string[];
  carryForward: string | null;
} {
  const keyTopics = extractTopTopics(interactions);
  const carryForward = extractCarryForward(interactions);
  const interactionTypes = [
    ...new Set(
      interactions
        .map((interaction) => interaction.interaction_type?.trim())
        .filter(
          (interactionType): interactionType is string =>
            Boolean(interactionType),
        ),
    ),
  ];

  const topicText =
    keyTopics.length > 0 ? keyTopics.slice(0, 3).join(", ") : "the class material";
  const requestCount = interactions.length;
  const requestLabel = `${requestCount} help request${requestCount === 1 ? "" : "s"}`;
  const modeText =
    interactionTypes.length > 0
      ? interactionTypes.join(", ")
      : "general question support";

  const sentenceOne = title
    ? `${title} focused on ${topicText}.`
    : `This session focused on ${topicText}.`;
  const sentenceTwo = notes
    ? `The student worked through ${requestLabel} around ${modeText} with the goal of ${notes}.`
    : `The student worked through ${requestLabel} around ${modeText}.`;
  const sentenceThree = carryForward
    ? `The main next step is ${carryForward}.`
    : keyTopics.length > 0
      ? `The clearest follow-up is to keep reviewing ${keyTopics[0]}.`
      : "The clearest follow-up is to continue the next review session from the same point.";

  return {
    summary: [sentenceOne, sentenceTwo, sentenceThree].join(" "),
    keyTopics,
    carryForward,
  };
}

function getSessionInteractions(sessionId: number): SessionInteractionRow[] {
  const db = getDatabase();
  return db.prepare(
    `
      SELECT
        prompt,
        response,
        interaction_type,
        response_payload
      FROM interactions
      WHERE session_id = ?
      ORDER BY created_at ASC
    `,
  ).all(sessionId) as SessionInteractionRow[];
}

export function createSession(
  classId: number,
  title: string,
  notes?: string | null,
): SessionRecord {
  const db = getDatabase();
  const classOwner = db.prepare(
    `
      SELECT owner_user_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(classId) as { owner_user_id: string | null } | undefined;
  const result = db.prepare(
    `
      INSERT INTO sessions (
        class_id,
        owner_user_id,
        title,
        notes
      ) VALUES (
        @classId,
        @ownerUserId,
        @title,
        @notes
      )
    `,
  ).run({
    classId,
    ownerUserId: classOwner?.owner_user_id ?? null,
    title,
    notes: notes ?? null,
  });

  const sessionRow = db.prepare(
    `
      SELECT
        id,
        class_id,
        started_at,
        ended_at,
        title,
        notes,
        summary,
        key_topics,
        carry_forward,
        request_count,
        screenshot_preview
      FROM sessions
      WHERE id = ?
    `,
  ).get(Number(result.lastInsertRowid)) as SessionRow | undefined;

  if (!sessionRow) {
    throw new Error("Failed to create session.");
  }

  return mapSessionRow(sessionRow);
}

export function endSession(sessionId: number): SessionRecord | null {
  const db = getDatabase();
  const existingSession = db.prepare(
    `
      SELECT
        id,
        class_id,
        started_at,
        ended_at,
        title,
        notes,
        summary,
        key_topics,
        carry_forward,
        request_count,
        screenshot_preview
      FROM sessions
      WHERE id = ?
    `,
  ).get(sessionId) as SessionRow | undefined;

  if (!existingSession) {
    return null;
  }

  const interactions = getSessionInteractions(sessionId);
  const generatedSummary = buildSessionSummary(
    existingSession.title,
    existingSession.notes,
    interactions,
  );

  db.prepare(
    `
      UPDATE sessions
      SET
        ended_at = CURRENT_TIMESTAMP,
        summary = @summary,
        key_topics = @keyTopics,
        carry_forward = @carryForward,
        request_count = @requestCount
      WHERE id = @sessionId AND ended_at IS NULL
    `,
  ).run({
    summary: generatedSummary.summary,
    keyTopics: JSON.stringify(generatedSummary.keyTopics),
    carryForward: generatedSummary.carryForward,
    requestCount: interactions.length,
    sessionId,
  });

  const sessionRow = db.prepare(
    `
      SELECT
        id,
        class_id,
        started_at,
        ended_at,
        title,
        notes,
        summary,
        key_topics,
        carry_forward,
        request_count,
        screenshot_preview
      FROM sessions
      WHERE id = ?
    `,
  ).get(sessionId) as SessionRow | undefined;

  return sessionRow ? mapSessionRow(sessionRow) : null;
}

export function saveSessionScreenshotPreview(
  sessionId: number,
  screenshotDataUrl: string,
  db = getDatabase(),
): void {
  db.prepare(
    `
      UPDATE sessions
      SET screenshot_preview = @screenshotPreview
      WHERE id = @sessionId
        AND screenshot_preview IS NULL
        AND ended_at IS NULL
    `,
  ).run({
    sessionId,
    screenshotPreview: screenshotDataUrl,
  });
}
