import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";

import type { DatabaseCounts } from "../type/database";

const DATABASE_FILE_NAME = "big-red-hacks.sqlite";

type DatabaseLike = BetterSqlite3.Database;

let DatabaseCtor: typeof BetterSqlite3 | null = null;
let database: DatabaseLike | null = null;

function getBetterSqlite3() {
  if (DatabaseCtor) {
    return DatabaseCtor;
  }

  // Defer the native module load so Node-only tests can import backend code
  // paths that use injected DBs without requiring the Electron-built binary.
  const requiredModule = require("better-sqlite3") as typeof BetterSqlite3;
  DatabaseCtor = requiredModule;
  return DatabaseCtor;
}

function getDatabaseFilePath(): string {
  return path.join(process.cwd(), DATABASE_FILE_NAME);
}

function createTables(db: DatabaseLike): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      state_key TEXT PRIMARY KEY,
      state_value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id TEXT,
      class_name TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      current_unit TEXT,
      teacher_focus TEXT,
      key_concepts TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id TEXT,
      class_id INTEGER,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      title TEXT,
      notes TEXT,
      summary TEXT,
      key_topics TEXT NOT NULL DEFAULT '[]',
      carry_forward TEXT,
      request_count INTEGER NOT NULL DEFAULT 0,
      screenshot_preview TEXT,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id TEXT,
      session_id INTEGER,
      class_id INTEGER,
      prompt TEXT NOT NULL,
      response TEXT,
      interaction_type TEXT,
      request_payload TEXT,
      response_payload TEXT,
      built_context TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions (id),
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );

    CREATE TABLE IF NOT EXISTS gaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id TEXT,
      class_id INTEGER,
      topic TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      weight INTEGER NOT NULL DEFAULT 0,
      evidence_count INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );

    CREATE TABLE IF NOT EXISTS gap_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gap_id INTEGER NOT NULL,
      interaction_id INTEGER,
      session_id INTEGER,
      evidence TEXT NOT NULL,
      confidence REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gap_id) REFERENCES gaps (id),
      FOREIGN KEY (interaction_id) REFERENCES interactions (id),
      FOREIGN KEY (session_id) REFERENCES sessions (id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      password_hash TEXT,
      password_salt TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS privacy_settings (
      user_id TEXT PRIMARY KEY,
      screenshot_policy TEXT NOT NULL DEFAULT 'disabled',
      local_only_mode INTEGER NOT NULL DEFAULT 1,
      sync_consent TEXT NOT NULL DEFAULT 'unknown',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS retention_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      job_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      run_after TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
}

function ensureClassColumns(db: DatabaseLike): void {
  const columns = db
    .prepare("PRAGMA table_info(classes)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("class_name")) {
    db.exec(
      "ALTER TABLE classes ADD COLUMN class_name TEXT NOT NULL DEFAULT '';",
    );
  }

  if (!columnNames.has("key_concepts")) {
    db.exec(
      "ALTER TABLE classes ADD COLUMN key_concepts TEXT NOT NULL DEFAULT '[]';",
    );
  }

  if (!columnNames.has("notes")) {
    db.exec(
      "ALTER TABLE classes ADD COLUMN notes TEXT;",
    );
  }

  if (!columnNames.has("owner_user_id")) {
    db.exec(
      "ALTER TABLE classes ADD COLUMN owner_user_id TEXT;",
    );
  }
}

function ensureInteractionColumns(db: DatabaseLike): void {
  const columns = db
    .prepare("PRAGMA table_info(interactions)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("request_payload")) {
    db.exec(
      "ALTER TABLE interactions ADD COLUMN request_payload TEXT;",
    );
  }

  if (!columnNames.has("response_payload")) {
    db.exec(
      "ALTER TABLE interactions ADD COLUMN response_payload TEXT;",
    );
  }

  if (!columnNames.has("built_context")) {
    db.exec(
      "ALTER TABLE interactions ADD COLUMN built_context TEXT;",
    );
  }

  if (!columnNames.has("owner_user_id")) {
    db.exec(
      "ALTER TABLE interactions ADD COLUMN owner_user_id TEXT;",
    );
  }
}

function ensureGapColumns(db: DatabaseLike): void {
  const columns = db
    .prepare("PRAGMA table_info(gaps)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("weight")) {
    db.exec(
      "ALTER TABLE gaps ADD COLUMN weight INTEGER NOT NULL DEFAULT 0;",
    );
  }

  if (!columnNames.has("evidence_count")) {
    db.exec(
      "ALTER TABLE gaps ADD COLUMN evidence_count INTEGER NOT NULL DEFAULT 0;",
    );
  }

  if (!columnNames.has("owner_user_id")) {
    db.exec(
      "ALTER TABLE gaps ADD COLUMN owner_user_id TEXT;",
    );
  }

  if (columnNames.has("occurrence_count")) {
    db.exec(`
      UPDATE gaps
      SET
        weight = CASE WHEN weight = 0 THEN occurrence_count ELSE weight END,
        evidence_count = CASE
          WHEN evidence_count = 0 THEN occurrence_count
          ELSE evidence_count
        END
    `);
  }
}

function ensureSessionColumns(db: DatabaseLike): void {
  const columns = db
    .prepare("PRAGMA table_info(sessions)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("summary")) {
    db.exec("ALTER TABLE sessions ADD COLUMN summary TEXT;");
  }

  if (!columnNames.has("key_topics")) {
    db.exec(
      "ALTER TABLE sessions ADD COLUMN key_topics TEXT NOT NULL DEFAULT '[]';",
    );
  }

  if (!columnNames.has("carry_forward")) {
    db.exec("ALTER TABLE sessions ADD COLUMN carry_forward TEXT;");
  }

  if (!columnNames.has("request_count")) {
    db.exec(
      "ALTER TABLE sessions ADD COLUMN request_count INTEGER NOT NULL DEFAULT 0;",
    );
  }

  if (!columnNames.has("screenshot_preview")) {
    db.exec("ALTER TABLE sessions ADD COLUMN screenshot_preview TEXT;");
  }

  if (!columnNames.has("owner_user_id")) {
    db.exec("ALTER TABLE sessions ADD COLUMN owner_user_id TEXT;");
  }
}

function ensureUserColumns(db: DatabaseLike): void {
  const columns = db
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
  }

  if (!columnNames.has("password_salt")) {
    db.exec("ALTER TABLE users ADD COLUMN password_salt TEXT;");
  }
}

export function getLegacyDatabase(): DatabaseLike {
  if (database) {
    return database;
  }

  const Database = getBetterSqlite3();
  database = new Database(getDatabaseFilePath());
  database.pragma("journal_mode = WAL");
  createTables(database);
  ensureClassColumns(database);
  ensureInteractionColumns(database);
  ensureGapColumns(database);
  ensureSessionColumns(database);
  ensureUserColumns(database);

  return database;
}

export function initializeLegacyDatabase(): DatabaseLike {
  return getLegacyDatabase();
}

export function getLegacyDatabaseCounts(): DatabaseCounts {
  const db = getLegacyDatabase();

  const countRows = (tableName: string): number => {
    const result = db
      .prepare(`SELECT COUNT(*) as total FROM ${tableName}`)
      .get() as { total: number };

    return result.total;
  };

  return {
    appState: countRows("app_state"),
    classes: countRows("classes"),
    sessions: countRows("sessions"),
    interactions: countRows("interactions"),
    gaps: countRows("gaps"),
    gapEvents: countRows("gap_events"),
  };
}
