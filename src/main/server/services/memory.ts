import { getDatabase } from "../db";
import { saveSessionScreenshotPreview } from "./sessions";
import type {
  AssistRequest,
  AssistResponse,
  BuiltContext,
  FeedbackRequest,
  ModelGapCandidate,
} from "../type";

type GapRecordRow = {
  id: number;
};

type RelatedGapRow = {
  gap_id: number;
};

type PersistedAssistPayload = Omit<AssistResponse, "interactionId">;

const MAX_PERSISTED_TEXT_LENGTH = 8000;

function truncateText(value: string, maxLength = MAX_PERSISTED_TEXT_LENGTH): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}

function sanitizeValueForStorage(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.startsWith("data:image/")) {
      return "[omitted image payload]";
    }

    return truncateText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValueForStorage(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeValueForStorage(entry),
      ]),
    );
  }

  return value;
}

function buildInteractionPrompt(requestInput: AssistRequest): string {
  return [
    `Action: ${requestInput.actionType}`,
    `Selected text: ${truncateText(requestInput.selectedText, 2000)}`,
    requestInput.surroundingText
      ? `Surrounding text: ${truncateText(requestInput.surroundingText, 2000)}`
      : null,
    requestInput.pageTitle
      ? `Page title: ${truncateText(requestInput.pageTitle, 300)}`
      : null,
    requestInput.pageUrl
      ? `Page URL: ${truncateText(requestInput.pageUrl, 500)}`
      : null,
    requestInput.userNote
      ? `User note: ${truncateText(requestInput.userNote, 2000)}`
      : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n");
}

function getGapWeightIncrement(confidence: number): number {
  if (confidence >= 0.85) {
    return 3;
  }

  if (confidence >= 0.6) {
    return 2;
  }

  return 1;
}

function saveInteraction(
  requestInput: AssistRequest,
  assistResponse: PersistedAssistPayload,
  builtContext: BuiltContext,
): number {
  const db = getDatabase();
  const result = db.prepare(
    `
      INSERT INTO interactions (
        session_id,
        class_id,
        prompt,
        response,
        interaction_type,
        request_payload,
        response_payload,
        built_context
      ) VALUES (
        @sessionId,
        @classId,
        @prompt,
        @response,
        @interactionType,
        @requestPayload,
        @responsePayload,
        @builtContext
      )
    `,
  ).run({
    sessionId: requestInput.sessionId ?? null,
    classId: requestInput.classId ?? null,
    prompt: buildInteractionPrompt(requestInput),
    response: truncateText(assistResponse.answer),
    interactionType: requestInput.actionType,
    requestPayload: JSON.stringify(sanitizeValueForStorage(requestInput)),
    responsePayload: JSON.stringify(sanitizeValueForStorage(assistResponse)),
    builtContext: JSON.stringify(sanitizeValueForStorage(builtContext)),
  });

  return Number(result.lastInsertRowid);
}

function findExistingGapId(
  classId: number | null,
  topic: string,
): number | null {
  const db = getDatabase();

  const row = classId === null
    ? db.prepare(
        `
          SELECT id
          FROM gaps
          WHERE class_id IS NULL AND lower(topic) = lower(?)
          LIMIT 1
        `,
      ).get(topic)
    : db.prepare(
        `
          SELECT id
          FROM gaps
          WHERE class_id = ? AND lower(topic) = lower(?)
          LIMIT 1
        `,
      ).get(classId, topic);

  return (row as GapRecordRow | undefined)?.id ?? null;
}

function upsertGap(
  classId: number | null,
  gapCandidate: ModelGapCandidate,
): number {
  const db = getDatabase();
  const existingGapId = findExistingGapId(classId, gapCandidate.topic);
  const weightIncrement = getGapWeightIncrement(gapCandidate.confidence);

  if (existingGapId) {
    db.prepare(
      `
        UPDATE gaps
        SET
          description = COALESCE(description, @description),
          status = 'open',
          weight = weight + @weightIncrement,
          evidence_count = evidence_count + 1,
          last_seen_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `,
    ).run({
      id: existingGapId,
      description: gapCandidate.description,
      weightIncrement,
    });

    return existingGapId;
  }

  const result = db.prepare(
    `
      INSERT INTO gaps (
        class_id,
        topic,
        description,
        status,
        weight,
        evidence_count,
        last_seen_at
      ) VALUES (
        @classId,
        @topic,
        @description,
        'open',
        @weight,
        1,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    classId,
    topic: gapCandidate.topic,
    description: gapCandidate.description,
    weight: weightIncrement,
  });

  return Number(result.lastInsertRowid);
}

function createGapEvent(
  gapId: number,
  interactionId: number,
  sessionId: number | undefined,
  gapCandidate: ModelGapCandidate,
): void {
  const db = getDatabase();

  db.prepare(
    `
      INSERT INTO gap_events (
        gap_id,
        interaction_id,
        session_id,
        evidence,
        confidence
      ) VALUES (
        @gapId,
        @interactionId,
        @sessionId,
        @evidence,
        @confidence
      )
    `,
  ).run({
    gapId,
    interactionId,
    sessionId: sessionId ?? null,
    evidence: gapCandidate.evidence,
    confidence: gapCandidate.confidence,
  });
}

export function persistAssistMemory(
  requestInput: AssistRequest,
  assistResponse: PersistedAssistPayload,
  builtContext: BuiltContext,
): number {
  const db = getDatabase();

  // Keep interaction + gap updates in one transaction so review features never
  // see a saved interaction without the matching gap memory writes.
  const persistTransaction = db.transaction(() => {
    if (requestInput.sessionId && requestInput.screenshotDataUrl) {
      saveSessionScreenshotPreview(
        requestInput.sessionId,
        requestInput.screenshotDataUrl,
      );
    }

    const interactionId = saveInteraction(
      requestInput,
      assistResponse,
      builtContext,
    );
    const classId = requestInput.classId;

    for (const gapCandidate of assistResponse.gapCandidates) {
      const gapId = upsertGap(classId, gapCandidate);
      createGapEvent(
        gapId,
        interactionId,
        requestInput.sessionId,
        gapCandidate,
      );
    }

    return interactionId;
  });

  return persistTransaction();
}

export function applyFeedbackToInteraction(
  feedbackInput: FeedbackRequest,
): void {
  const db = getDatabase();
  const weightDelta = feedbackInput.helped ? -1 : 1;

  // Feedback adjusts only the gaps that were linked to this exact interaction
  // via `gap_events`, which keeps the heuristic simple and explainable.
  const applyTransaction = db.transaction(() => {
    const relatedGaps = db.prepare(
      `
        SELECT DISTINCT gap_id
        FROM gap_events
        WHERE interaction_id = ?
      `,
    ).all(feedbackInput.interactionId) as RelatedGapRow[];

    for (const relatedGap of relatedGaps) {
      db.prepare(
        `
          UPDATE gaps
          SET
            weight = MAX(weight + ?, 0),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      ).run(weightDelta, relatedGap.gap_id);
    }
  });

  applyTransaction();
}
