import path from "node:path";
import Database from "better-sqlite3";
import { app, safeStorage } from "electron";

type OfflineQueueEntry = {
  id: number;
  requestKey: string;
  endpoint: string;
  method: string;
  payload: unknown;
  createdAt: string;
  retryAfter: string | null;
};

let database: Database.Database | null = null;

function getDatabaseFilePath(): string {
  return path.join(app.getPath("userData"), "local-cache.sqlite");
}

function getDatabase(): Database.Database {
  if (database) {
    return database;
  }

  database = new Database(getDatabaseFilePath());
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      draft_key TEXT PRIMARY KEY,
      draft_value BLOB NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_key TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload BLOB NOT NULL,
      retry_after TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return database;
}

function encodeStoredValue(value: unknown): Buffer {
  const raw = Buffer.from(JSON.stringify(value), "utf8");
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(raw.toString("utf8"))
    : raw;
}

function decodeStoredValue<T>(value: Buffer): T | null {
  try {
    const raw = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(value)
      : value.toString("utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setDraft(draftKey: string, value: unknown): void {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO drafts (draft_key, draft_value, updated_at)
      VALUES (@draftKey, @draftValue, CURRENT_TIMESTAMP)
      ON CONFLICT(draft_key) DO UPDATE SET
        draft_value = excluded.draft_value,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run({
    draftKey,
    draftValue: encodeStoredValue(value),
  });
}

export function getDraft<T>(draftKey: string): T | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT draft_value
      FROM drafts
      WHERE draft_key = ?
      LIMIT 1
    `,
  ).get(draftKey) as { draft_value: Buffer } | undefined;

  if (!row) {
    return null;
  }

  return decodeStoredValue<T>(row.draft_value);
}

export function deleteDraft(draftKey: string): void {
  const db = getDatabase();
  db.prepare(
    `
      DELETE FROM drafts
      WHERE draft_key = ?
    `,
  ).run(draftKey);
}

export function enqueueOfflineRequest(input: {
  requestKey: string;
  endpoint: string;
  method: string;
  payload: unknown;
  retryAfter?: string | null;
}): number {
  const db = getDatabase();
  const result = db.prepare(
    `
      INSERT INTO offline_queue (
        request_key,
        endpoint,
        method,
        payload,
        retry_after
      ) VALUES (
        @requestKey,
        @endpoint,
        @method,
        @payload,
        @retryAfter
      )
    `,
  ).run({
    requestKey: input.requestKey,
    endpoint: input.endpoint,
    method: input.method,
    payload: encodeStoredValue(input.payload),
    retryAfter: input.retryAfter ?? null,
  });

  return Number(result.lastInsertRowid);
}

export function listOfflineQueueEntries(): OfflineQueueEntry[] {
  const db = getDatabase();
  const rows = db.prepare(
    `
      SELECT
        id,
        request_key,
        endpoint,
        method,
        payload,
        created_at,
        retry_after
      FROM offline_queue
      ORDER BY created_at ASC
    `,
  ).all() as Array<{
    id: number;
    request_key: string;
    endpoint: string;
    method: string;
    payload: Buffer;
    created_at: string;
    retry_after: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    requestKey: row.request_key,
    endpoint: row.endpoint,
    method: row.method,
    payload: decodeStoredValue(row.payload),
    createdAt: row.created_at,
    retryAfter: row.retry_after,
  }));
}

export function removeOfflineQueueEntry(id: number): void {
  const db = getDatabase();
  db.prepare(
    `
      DELETE FROM offline_queue
      WHERE id = ?
    `,
  ).run(id);
}
