import { getDatabase } from "../db/index.ts";
import {
  privacySettingsPatchSchema,
  privacySettingsSchema,
} from "../schema/index.ts";
import type {
  PrivacySettings,
  PrivacySettingsPatch,
  RetentionJob,
} from "../type/index.ts";
import {
  cleanupCompletedJobs,
  compactUserInteractions,
  enqueueRetentionJob,
} from "../workers/index.ts";

type DatabaseLike = ReturnType<typeof getDatabase>;

type PrivacySettingsRow = {
  screenshot_policy: PrivacySettings["screenshotPolicy"];
  sync_consent: PrivacySettings["syncConsent"];
  updated_at: string;
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  screenshotPolicy: "automatic",
  syncConsent: "granted",
};

function mapPrivacySettings(row: PrivacySettingsRow | undefined): PrivacySettings {
  if (!row) {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }

  return privacySettingsSchema.parse({
    screenshotPolicy: row.screenshot_policy,
    syncConsent: row.sync_consent,
    updatedAt: row.updated_at,
  });
}

function ensureUserRecord(userId: string, db = getDatabase()): void {
  db.prepare(
    `
      INSERT INTO users (id, created_at, updated_at)
      VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run(userId);
}

function getRawPrivacySettings(
  userId: string,
  db = getDatabase(),
): PrivacySettingsRow | undefined {
  return db.prepare(
    `
      SELECT
        screenshot_policy,
        sync_consent,
        updated_at
      FROM privacy_settings
      WHERE user_id = ?
      LIMIT 1
    `,
  ).get(userId) as PrivacySettingsRow | undefined;
}

function buildPrivacyRetentionPolicy(settings: PrivacySettings) {
  return {
    keepLatestInteractionsPerSession: settings.syncConsent === "denied" ? 6 : 10,
    compactAfterJobCount: settings.syncConsent === "denied" ? 1 : 3,
  };
}

export function getUserPrivacySettings(
  userId: string,
  db = getDatabase(),
): PrivacySettings {
  ensureUserRecord(userId, db);
  const existing = getRawPrivacySettings(userId, db);

  if (existing) {
    return mapPrivacySettings(existing);
  }

  db.prepare(
    `
      INSERT INTO privacy_settings (
        user_id,
        screenshot_policy,
        sync_consent,
        updated_at
      ) VALUES (
        @userId,
        @screenshotPolicy,
        @syncConsent,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    userId,
    screenshotPolicy: DEFAULT_PRIVACY_SETTINGS.screenshotPolicy,
    syncConsent: DEFAULT_PRIVACY_SETTINGS.syncConsent,
  });

  return { ...DEFAULT_PRIVACY_SETTINGS };
}

export function updateUserPrivacySettings(
  userId: string,
  patch: PrivacySettingsPatch,
  db = getDatabase(),
): PrivacySettings {
  ensureUserRecord(userId, db);
  const safePatch = privacySettingsPatchSchema.parse(patch);
  const current = getUserPrivacySettings(userId, db);
  const nextSettings = privacySettingsSchema.parse({
    ...current,
    ...safePatch,
  });

  db.prepare(
    `
      INSERT INTO privacy_settings (
        user_id,
        screenshot_policy,
        sync_consent,
        updated_at
      ) VALUES (
        @userId,
        @screenshotPolicy,
        @syncConsent,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id) DO UPDATE SET
        screenshot_policy = excluded.screenshot_policy,
        sync_consent = excluded.sync_consent,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run({
    userId,
    screenshotPolicy: nextSettings.screenshotPolicy,
    syncConsent: nextSettings.syncConsent,
  });

  return getUserPrivacySettings(userId, db);
}

export function queueAccountDeletion(
  userId: string,
  db = getDatabase(),
): number {
  ensureUserRecord(userId, db);
  return enqueueRetentionJob({
    db,
    userId,
    jobType: "account_deletion",
    payload: { requestedAt: new Date().toISOString() },
  });
}

export function queueExportJob(
  userId: string,
  options: {
    includeContent?: boolean;
    db?: DatabaseLike;
  } = {},
): number {
  const db = options.db ?? getDatabase();
  ensureUserRecord(userId, db);
  return enqueueRetentionJob({
    db,
    userId,
    jobType: "export_user_data",
    payload: {
      includeContent: options.includeContent !== false,
      requestedAt: new Date().toISOString(),
    },
  });
}

export function buildUserDataExport(
  userId: string,
  options: {
    includeContent?: boolean;
    db?: DatabaseLike;
  } = {},
) {
  const db = options.db ?? getDatabase();
  const includeContent = options.includeContent !== false;
  const privacySettings = getUserPrivacySettings(userId, db);

  const classes = db.prepare(
    `
      SELECT *
      FROM classes
      WHERE owner_user_id = ?
      ORDER BY updated_at DESC, id DESC
    `,
  ).all(userId);
  const sessions = db.prepare(
    `
      SELECT *
      FROM sessions
      WHERE owner_user_id = ?
      ORDER BY started_at DESC, id DESC
    `,
  ).all(userId);
  const interactions = db.prepare(
    `
      SELECT *
      FROM interactions
      WHERE owner_user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
  ).all(userId) as Array<Record<string, unknown>>;
  const gaps = db.prepare(
    `
      SELECT *
      FROM gaps
      WHERE owner_user_id = ?
      ORDER BY updated_at DESC, id DESC
    `,
  ).all(userId);
  const jobs = db.prepare(
    `
      SELECT
        id,
        user_id,
        job_type,
        status,
        run_after,
        created_at,
        updated_at
      FROM retention_jobs
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
  ).all(userId);

  const safeInteractions = includeContent
    ? interactions
    : interactions.map((interaction) => ({
        id: interaction.id,
        session_id: interaction.session_id,
        class_id: interaction.class_id,
        interaction_type: interaction.interaction_type,
        created_at: interaction.created_at,
      }));

  return {
    exportedAt: new Date().toISOString(),
    userId,
    privacySettings,
    classes,
    sessions,
    interactions: safeInteractions,
    gaps,
    jobs,
  };
}

export function deleteUserAccountData(
  userId: string,
  db = getDatabase(),
): {
  deletedInteractions: number;
  deletedSessions: number;
  deletedClasses: number;
  deletedGaps: number;
} {
  const deleteTransaction = db.transaction(() => {
    db.prepare(
      `
        DELETE FROM gap_events
        WHERE interaction_id IN (
          SELECT id FROM interactions WHERE owner_user_id = ?
        )
        OR gap_id IN (
          SELECT id FROM gaps WHERE owner_user_id = ?
        )
        OR session_id IN (
          SELECT id FROM sessions WHERE owner_user_id = ?
        )
      `,
    ).run(userId, userId, userId);

    const deletedInteractions = db.prepare(
      `
        DELETE FROM interactions
        WHERE owner_user_id = ?
      `,
    ).run(userId).changes;
    const deletedSessions = db.prepare(
      `
        DELETE FROM sessions
        WHERE owner_user_id = ?
      `,
    ).run(userId).changes;
    const deletedGaps = db.prepare(
      `
        DELETE FROM gaps
        WHERE owner_user_id = ?
      `,
    ).run(userId).changes;
    const deletedClasses = db.prepare(
      `
        DELETE FROM classes
        WHERE owner_user_id = ?
      `,
    ).run(userId).changes;

    db.prepare("DELETE FROM privacy_settings WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);

    return {
      deletedInteractions,
      deletedSessions,
      deletedClasses,
      deletedGaps,
    };
  });

  return deleteTransaction();
}

export function performSummaryCompaction(
  userId: string,
  db = getDatabase(),
): number {
  const settings = getUserPrivacySettings(userId, db);
  const policy = buildPrivacyRetentionPolicy(settings);
  return compactUserInteractions(userId, {
    db,
    keepLatestPerSession: policy.keepLatestInteractionsPerSession,
  });
}

export function runRetentionCleanup(db = getDatabase()): {
  compactedUsers: number;
  cleanedJobs: number;
} {
  const userRows = db.prepare(
    `
      SELECT DISTINCT user_id
      FROM privacy_settings
      WHERE user_id IS NOT NULL
    `,
  ).all() as Array<{ user_id: string | null }>;

  let compactedUsers = 0;
  for (const row of userRows) {
    if (!row.user_id) {
      continue;
    }

    const compacted = performSummaryCompaction(row.user_id, db);
    if (compacted > 0) {
      compactedUsers += 1;
    }
  }

  const cleanedJobs = cleanupCompletedJobs({ db });
  return {
    compactedUsers,
    cleanedJobs,
  };
}

export function getPrivacyWorkerHandlers() {
  return {
    summary_compaction(job: RetentionJob, context: { db: DatabaseLike }) {
      if (!job.userId) {
        return;
      }

      performSummaryCompaction(job.userId, context.db);
    },
    retention_cleanup(_job: RetentionJob, context: { db: DatabaseLike }) {
      runRetentionCleanup(context.db);
    },
    account_deletion(job: RetentionJob, context: { db: DatabaseLike }) {
      if (!job.userId) {
        return;
      }

      deleteUserAccountData(job.userId, context.db);
    },
    export_user_data(job: RetentionJob, context: { db: DatabaseLike }) {
      if (!job.userId) {
        return;
      }

      const payload = buildUserDataExport(job.userId, {
        db: context.db,
        includeContent:
          job.payload?.includeContent === undefined
            ? true
            : Boolean(job.payload.includeContent),
      });
      context.db.prepare(
        `
          UPDATE retention_jobs
          SET
            payload = json_set(
              COALESCE(payload, '{}'),
              '$.result',
              json(@resultJson)
            ),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = @jobId
        `,
      ).run({
        jobId: job.id,
        resultJson: JSON.stringify(payload),
      });
    },
  } as const;
}
