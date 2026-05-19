import { getDatabase } from "../db/index.ts";
import { writeAuditEvent } from "../observability/audit.ts";
import { incrementMetric, recordDurationMetric } from "../observability/metrics.ts";
import type { PrivacySettings, RetentionJob, RetentionJobType } from "../type/index.ts";

type DatabaseLike = ReturnType<typeof getDatabase>;

type QueueHandlerContext = {
  db: DatabaseLike;
};

type QueueHandler = (
  job: RetentionJob,
  context: QueueHandlerContext,
) => void;

type QueueHandlers = Partial<Record<RetentionJobType, QueueHandler>>;

type RawRetentionJobRow = {
  id: number;
  user_id: string | null;
  job_type: RetentionJobType;
  status: RetentionJob["status"];
  run_after: string;
  payload: string | null;
  created_at: string;
  updated_at: string;
};

type StartWorkerOptions = {
  db?: DatabaseLike;
  handlers?: QueueHandlers;
  pollIntervalMs?: number;
};

const DEFAULT_POLL_INTERVAL_MS = 30_000;

let workerTimer: NodeJS.Timeout | null = null;

function parseJobPayload(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function mapRetentionJob(row: RawRetentionJobRow): RetentionJob {
  return {
    id: row.id,
    userId: row.user_id,
    jobType: row.job_type,
    status: row.status,
    runAfter: row.run_after,
    payload: parseJobPayload(row.payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function enqueueRetentionJob(input: {
  userId?: string | null;
  jobType: RetentionJobType;
  payload?: Record<string, unknown> | null;
  runAfter?: string;
  db?: DatabaseLike;
}): number {
  const db = input.db ?? getDatabase();
  const result = db.prepare(
    `
      INSERT INTO retention_jobs (
        user_id,
        job_type,
        status,
        run_after,
        payload,
        created_at,
        updated_at
      ) VALUES (
        @userId,
        @jobType,
        'pending',
        COALESCE(@runAfter, CURRENT_TIMESTAMP),
        @payload,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    userId: input.userId ?? null,
    jobType: input.jobType,
    runAfter: input.runAfter ?? null,
    payload: input.payload ? JSON.stringify(input.payload) : null,
  });

  const jobId = Number(result.lastInsertRowid);
  incrementMetric("worker", "jobs_enqueued");
  writeAuditEvent({
    event: "worker.job_enqueued",
    jobId,
    jobType: input.jobType,
    userId: input.userId ?? null,
  });
  return jobId;
}

export function markJobRunning(jobId: number, db = getDatabase()): void {
  db.prepare(
    `
      UPDATE retention_jobs
      SET
        status = 'running',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(jobId);
}

export function markJobCompleted(jobId: number, db = getDatabase()): void {
  db.prepare(
    `
      UPDATE retention_jobs
      SET
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(jobId);
}

export function markJobFailed(
  jobId: number,
  db = getDatabase(),
  errorMessage?: string,
): void {
  db.prepare(
    `
      UPDATE retention_jobs
      SET
        status = 'failed',
        payload = CASE
          WHEN payload IS NULL THEN json_object('error', @errorMessage)
          ELSE json_set(payload, '$.error', @errorMessage)
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @jobId
    `,
  ).run({
    jobId,
    errorMessage: errorMessage ?? "Job failed.",
  });
}

export function listPendingRetentionJobs(options: {
  db?: DatabaseLike;
  limit?: number;
  jobTypes?: RetentionJobType[];
} = {}): RetentionJob[] {
  const db = options.db ?? getDatabase();
  const limit = options.limit ?? 25;
  const jobTypes = options.jobTypes ?? [];

  if (jobTypes.length > 0) {
    const placeholders = jobTypes.map(() => "?").join(", ");
    const rows = db.prepare(
      `
        SELECT
          id,
          user_id,
          job_type,
          status,
          run_after,
          payload,
          created_at,
          updated_at
        FROM retention_jobs
        WHERE status = 'pending'
          AND run_after <= CURRENT_TIMESTAMP
          AND job_type IN (${placeholders})
        ORDER BY created_at ASC
        LIMIT ?
      `,
    ).all(...jobTypes, limit) as RawRetentionJobRow[];
    return rows.map(mapRetentionJob);
  }

  const rows = db.prepare(
    `
      SELECT
        id,
        user_id,
        job_type,
        status,
        run_after,
        payload,
        created_at,
        updated_at
      FROM retention_jobs
      WHERE status = 'pending'
        AND run_after <= CURRENT_TIMESTAMP
      ORDER BY created_at ASC
      LIMIT ?
    `,
  ).all(limit) as RawRetentionJobRow[];

  return rows.map(mapRetentionJob);
}

export function compactUserInteractions(
  userId: string,
  options: {
    db?: DatabaseLike;
    keepLatestPerSession?: number;
  } = {},
): number {
  const db = options.db ?? getDatabase();
  const keepLatestPerSession = options.keepLatestPerSession ?? 8;
  const rows = db.prepare(
    `
      SELECT
        id,
        session_id,
        class_id,
        interaction_type,
        created_at,
        request_payload,
        response_payload,
        built_context
      FROM interactions
      WHERE owner_user_id = ?
      ORDER BY COALESCE(session_id, 0), created_at DESC, id DESC
    `,
  ).all(userId) as Array<{
    id: number;
    session_id: number | null;
    class_id: number | null;
    interaction_type: string | null;
    created_at: string;
    request_payload: string | null;
    response_payload: string | null;
    built_context: string | null;
  }>;

  const keptCounts = new Map<string, number>();
  let compactedCount = 0;

  const updateStatement = db.prepare(
    `
      UPDATE interactions
      SET
        request_payload = @requestPayload,
        response_payload = @responsePayload,
        built_context = @builtContext
      WHERE id = @id
    `,
  );

  for (const row of rows) {
    const bucketKey = row.session_id ? `session:${row.session_id}` : `class:${row.class_id ?? 0}`;
    const seenCount = keptCounts.get(bucketKey) ?? 0;
    keptCounts.set(bucketKey, seenCount + 1);

    if (seenCount < keepLatestPerSession) {
      continue;
    }

    const compactRequest = {
      compacted: true,
      interactionType: row.interaction_type,
      createdAt: row.created_at,
    };
    const compactResponse = {
      compacted: true,
      createdAt: row.created_at,
    };
    const compactContext = {
      compacted: true,
      createdAt: row.created_at,
    };

    updateStatement.run({
      id: row.id,
      requestPayload: JSON.stringify(compactRequest),
      responsePayload: JSON.stringify(compactResponse),
      builtContext: JSON.stringify(compactContext),
    });
    compactedCount += 1;
  }

  if (compactedCount > 0) {
    incrementMetric("worker", "interaction_compactions", compactedCount);
  }

  return compactedCount;
}

export function cleanupCompletedJobs(options: {
  db?: DatabaseLike;
  keepLatest?: number;
} = {}): number {
  const db = options.db ?? getDatabase();
  const keepLatest = options.keepLatest ?? 200;
  const result = db.prepare(
    `
      DELETE FROM retention_jobs
      WHERE status IN ('completed', 'failed')
        AND id NOT IN (
          SELECT id
          FROM retention_jobs
          ORDER BY updated_at DESC, id DESC
          LIMIT ?
        )
    `,
  ).run(keepLatest);

  return result.changes;
}

export function processPendingRetentionJobs(options: {
  db?: DatabaseLike;
  handlers?: QueueHandlers;
  limit?: number;
  jobTypes?: RetentionJobType[];
} = {}): {
  processed: number;
  failed: number;
} {
  const db = options.db ?? getDatabase();
  const handlers = options.handlers ?? {};
  const jobs = listPendingRetentionJobs({
    db,
    limit: options.limit,
    jobTypes: options.jobTypes,
  });
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    const startedAt = Date.now();
    try {
      const handler = handlers[job.jobType];
      if (!handler) {
        throw new Error(`No worker handler registered for ${job.jobType}.`);
      }

      markJobRunning(job.id, db);
      handler(job, { db });
      markJobCompleted(job.id, db);
      processed += 1;
      recordDurationMetric("worker", job.jobType, Date.now() - startedAt);
      writeAuditEvent({
        event: "worker.job_completed",
        jobId: job.id,
        jobType: job.jobType,
        userId: job.userId,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      failed += 1;
      incrementMetric("worker", "jobs_failed");
      markJobFailed(
        job.id,
        db,
        error instanceof Error ? error.message : "Worker job failed.",
      );
      writeAuditEvent({
        event: "worker.job_failed",
        level: "error",
        jobId: job.id,
        jobType: job.jobType,
        userId: job.userId,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  return { processed, failed };
}

export function startBackgroundWorkers(options: StartWorkerOptions = {}): void {
  if (workerTimer) {
    return;
  }

  const handlers = options.handlers ?? {};
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  workerTimer = setInterval(() => {
    processPendingRetentionJobs({
      db: options.db,
      handlers,
    });
  }, pollIntervalMs);
  workerTimer.unref?.();
}

export function stopBackgroundWorkers(): void {
  if (!workerTimer) {
    return;
  }

  clearInterval(workerTimer);
  workerTimer = null;
}
