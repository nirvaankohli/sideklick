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
  support_signals?: string | null;
};

type RelatedGapRow = {
  gap_id: number;
};

type PersistedAssistPayload = Omit<AssistResponse, "interactionId">;
type DatabaseLike = ReturnType<typeof getDatabase>;

const MAX_PERSISTED_TEXT_LENGTH = 8000;
const SELF_DOUBT_PATTERNS = [
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
const REVIEW_PATTERNS = [
  "review",
  "revise",
  "study",
  "focus on",
  "what should i focus on",
  "what should i review",
];

function truncateText(value: string, maxLength = MAX_PERSISTED_TEXT_LENGTH): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
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

function compactText(value: string | null | undefined, maxLength = 240): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 3)}...`;
}

function inferGapScope(
  requestInput: AssistRequest,
): "session" | "class" {
  return requestInput.sessionId ? "session" : "class";
}

function inferGapEvidenceType(
  requestInput: AssistRequest,
): "self_doubt" | "review_request" | "direct_question" | "note_capture" | "general" {
  const combinedRequestText = [
    requestInput.selectedText,
    requestInput.surroundingText,
    requestInput.userNote,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  if (SELF_DOUBT_PATTERNS.some((pattern) => combinedRequestText.includes(pattern))) {
    return "self_doubt";
  }

  if (
    requestInput.actionType === "focus_page" ||
    REVIEW_PATTERNS.some((pattern) => combinedRequestText.includes(pattern))
  ) {
    return "review_request";
  }

  if (requestInput.actionType === "add_notes") {
    return "note_capture";
  }

  if (requestInput.selectedText.trim().length > 0) {
    return "direct_question";
  }

  return "general";
}

function inferSupportSignals(
  requestInput: AssistRequest,
  builtContext: BuiltContext,
): string[] {
  const combinedRequestText = [
    requestInput.selectedText,
    requestInput.surroundingText,
    requestInput.userNote,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  const signals = [
    requestInput.sessionId ? "session_scope" : "class_scope",
    requestInput.userNote ? "user_note_present" : null,
    requestInput.screenshotDataUrl ? "screenshot_present" : null,
    SELF_DOUBT_PATTERNS.some((pattern) => combinedRequestText.includes(pattern))
      ? "self_doubt_signal"
      : null,
    REVIEW_PATTERNS.some((pattern) => combinedRequestText.includes(pattern))
      ? "review_request"
      : null,
    builtContext.contextTiers.session.length > 0 ? "session_memory_available" : null,
    builtContext.contextTiers.historical.length > 0 ? "historical_memory_available" : null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(signals)];
}

function safeParseStringArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
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
): GapRecordRow | null {
  const row = classId === null
    ? db.prepare(
        `
          SELECT id, support_signals
          FROM gaps
          WHERE class_id IS NULL AND lower(topic) = lower(?)
          LIMIT 1
        `,
      ).get(topic)
    : db.prepare(
        `
          SELECT id, support_signals
          FROM gaps
          WHERE class_id = ? AND lower(topic) = lower(?)
          LIMIT 1
        `,
      ).get(classId, topic);

  return (row as GapRecordRow | undefined) ?? null;
}

function upsertGap(
  classId: number | null,
  gapCandidate: ModelGapCandidate,
  requestInput: AssistRequest,
  builtContext: BuiltContext,
  ownerUserId: string | null,
  db: DatabaseLike,
): number {
  const existingGap = findExistingGapId(classId, gapCandidate.topic, db);
  const weightIncrement = getGapWeightIncrement(gapCandidate.confidence);
  const supportSignals = inferSupportSignals(requestInput, builtContext);
  const mergedSupportSignals = existingGap
    ? [...new Set([
        ...safeParseStringArray(existingGap.support_signals),
        ...supportSignals,
      ])]
    : supportSignals;
  const scope = inferGapScope(requestInput);
  const evidenceType = inferGapEvidenceType(requestInput);

  if (existingGap) {
    db.prepare(
      `
        UPDATE gaps
        SET
          description = COALESCE(description, @description),
          scope = @scope,
          status = 'open',
          weight = weight + @weightIncrement,
          evidence_count = evidence_count + 1,
          support_signals = @supportSignals,
          last_confidence = @lastConfidence,
          last_evidence_type = @lastEvidenceType,
          last_interaction_type = @lastInteractionType,
          last_seen_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `,
      ).run({
      id: existingGap.id,
      description: gapCandidate.description,
      scope,
      weightIncrement,
      supportSignals: JSON.stringify(mergedSupportSignals),
      lastConfidence: gapCandidate.confidence,
      lastEvidenceType: evidenceType,
      lastInteractionType: requestInput.actionType,
    });

    return existingGap.id;
  }

  const result = db.prepare(
    `
      INSERT INTO gaps (
        owner_user_id,
        class_id,
        topic,
        description,
        scope,
        status,
        weight,
        evidence_count,
        support_signals,
        last_confidence,
        last_evidence_type,
        last_interaction_type,
        last_seen_at
      ) VALUES (
        @ownerUserId,
        @classId,
        @topic,
        @description,
        @scope,
        'open',
        @weight,
        1,
        @supportSignals,
        @lastConfidence,
        @lastEvidenceType,
        @lastInteractionType,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    ownerUserId,
    classId,
    topic: gapCandidate.topic,
    description: gapCandidate.description,
    scope,
    weight: weightIncrement,
    supportSignals: JSON.stringify(mergedSupportSignals),
    lastConfidence: gapCandidate.confidence,
    lastEvidenceType: evidenceType,
    lastInteractionType: requestInput.actionType,
  });

  return Number(result.lastInsertRowid);
}

function createGapEvent(
  gapId: number,
  interactionId: number,
  sessionId: number | undefined,
  gapCandidate: ModelGapCandidate,
  requestInput: AssistRequest,
  builtContext: BuiltContext,
  db: DatabaseLike,
): void {
  const evidenceType = inferGapEvidenceType(requestInput);
  const supportSignals = inferSupportSignals(requestInput, builtContext);
  const requestExcerpt = compactText(
    [requestInput.selectedText, requestInput.userNote ?? null]
      .filter((value): value is string => Boolean(value))
      .join(" | "),
    240,
  );

  db.prepare(
    `
      INSERT INTO gap_events (
        gap_id,
        interaction_id,
        session_id,
        evidence,
        confidence,
        evidence_type,
        support_signals,
        request_excerpt
      ) VALUES (
        @gapId,
        @interactionId,
        @sessionId,
        @evidence,
        @confidence,
        @evidenceType,
        @supportSignals,
        @requestExcerpt
      )
    `,
  ).run({
    gapId,
    interactionId,
    sessionId: sessionId ?? null,
    evidence: gapCandidate.evidence,
    confidence: gapCandidate.confidence,
    evidenceType,
    supportSignals: JSON.stringify(supportSignals),
    requestExcerpt,
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
      const gapId = upsertGap(
        classId,
        gapCandidate,
        requestInput,
        builtContext,
        ownerUserId,
        db,
      );
      createGapEvent(
        gapId,
        interactionId,
        requestInput.sessionId,
        gapCandidate,
        requestInput,
        builtContext,
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
