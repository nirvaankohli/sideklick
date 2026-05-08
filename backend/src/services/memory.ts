import { getDatabase } from "../db/index.ts";
import { redactCapturePayload } from "../../../src/main/capture.ts";
import { saveSessionScreenshotPreview } from "./sessions.ts";
import { enqueueRetentionJob } from "../workers/index.ts";
import type {
  AssistRequest,
  AssistResponse,
  BuiltContext,
  FeedbackRequest,
  ModelGapCandidate,
} from "../type/index.ts";

type GapRecordRow = {
  id: number;
};

type RelatedGapRow = {
  gap_id: number;
};

type PersistedAssistPayload = Omit<AssistResponse, "interactionId">;
type DatabaseLike = ReturnType<typeof getDatabase>;

const MAX_PERSISTED_TEXT_LENGTH = 8000;

function truncateText(value: string, maxLength = MAX_PERSISTED_TEXT_LENGTH): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}

function sanitizeValueForStorage(value: unknown): unknown {
  const redactedValue = redactCapturePayload(value);

  if (typeof redactedValue === "string") {
    return truncateText(redactedValue);
  }

  if (Array.isArray(redactedValue)) {
    return redactedValue.map((entry) => sanitizeValueForStorage(entry));
  }

  if (redactedValue && typeof redactedValue === "object") {
    return Object.fromEntries(
      Object.entries(redactedValue).map(([key, entry]) => [
        key,
        sanitizeValueForStorage(entry),
      ]),
    );
  }

  return redactedValue;
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
  db: DatabaseLike,
): number {
  const ownerUserId = resolveInteractionOwnerUserId(requestInput, db);
  const result = db.prepare(
    `
      INSERT INTO interactions (
        session_id,
        class_id,
        owner_user_id,
        prompt,
        response,
        interaction_type,
        request_payload,
        response_payload,
        built_context
      ) VALUES (
        @sessionId,
        @classId,
        @ownerUserId,
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
    ownerUserId,
    prompt: buildInteractionPrompt(requestInput),
    response: truncateText(assistResponse.answer),
    interactionType: requestInput.actionType,
    requestPayload: JSON.stringify(sanitizeValueForStorage(requestInput)),
    responsePayload: JSON.stringify(sanitizeValueForStorage(assistResponse)),
    builtContext: JSON.stringify(sanitizeValueForStorage(builtContext)),
  });

  return Number(result.lastInsertRowid);
}

function resolveInteractionOwnerUserId(
  requestInput: AssistRequest,
  db: DatabaseLike,
): string | null {
  if (requestInput.sessionId) {
    const sessionOwnerRow = db.prepare(
      `
        SELECT owner_user_id
        FROM sessions
        WHERE id = ?
        LIMIT 1
      `,
    ).get(requestInput.sessionId) as { owner_user_id: string | null } | undefined;

    if (sessionOwnerRow?.owner_user_id) {
      return sessionOwnerRow.owner_user_id;
    }
  }

  const classOwnerRow = db.prepare(
    `
      SELECT owner_user_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(requestInput.classId) as { owner_user_id: string | null } | undefined;

  return classOwnerRow?.owner_user_id ?? null;
}

function findExistingGapId(
  classId: number | null,
  topic: string,
  db: DatabaseLike,
): number | null {
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
  ownerUserId: string | null,
  db: DatabaseLike,
): number {
  const existingGapId = findExistingGapId(classId, gapCandidate.topic, db);
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
        owner_user_id,
        class_id,
        topic,
        description,
        status,
        weight,
        evidence_count,
        last_seen_at
      ) VALUES (
        @ownerUserId,
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
    ownerUserId,
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
  db: DatabaseLike,
): void {
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
  options: {
    db?: DatabaseLike;
    queueSummaryCompaction?: boolean;
  } = {},
): number {
  const db = options.db ?? getDatabase();

  // Keep interaction + gap updates in one transaction so review features never
  // see a saved interaction without the matching gap memory writes.
  const persistTransaction = db.transaction(() => {
    const ownerUserId = resolveInteractionOwnerUserId(requestInput, db);
    if (requestInput.sessionId && requestInput.screenshotDataUrl) {
      saveSessionScreenshotPreview(
        requestInput.sessionId,
        requestInput.screenshotDataUrl,
        db,
      );
    }

    const interactionId = saveInteraction(
      requestInput,
      assistResponse,
      builtContext,
      db,
    );
    const classId = requestInput.classId;

    for (const gapCandidate of assistResponse.gapCandidates) {
      const gapId = upsertGap(classId, gapCandidate, ownerUserId, db);
      createGapEvent(
        gapId,
        interactionId,
        requestInput.sessionId,
        gapCandidate,
        db,
      );
    }

    if (ownerUserId && options.queueSummaryCompaction !== false) {
      enqueueRetentionJob({
        db,
        userId: ownerUserId,
        jobType: "summary_compaction",
        payload: {
          sessionId: requestInput.sessionId ?? null,
          classId: requestInput.classId,
          interactionId,
        },
      });
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
