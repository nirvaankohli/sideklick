import path from "node:path";
import Database from "better-sqlite3";

import type { DatabaseCounts } from "../type/database";

const DATABASE_FILE_NAME = "big-red-hacks.sqlite";

let database: Database.Database | null = null;

function getDatabaseFilePath(): string {
  return path.join(process.cwd(), DATABASE_FILE_NAME);
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      class_id INTEGER,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      title TEXT,
      notes TEXT,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  `);
}

function ensureClassColumns(db: Database.Database): void {
  // This lightweight migration keeps local dev databases usable as the schema
  // evolves, without introducing a full migration tool yet.
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
}

function ensureInteractionColumns(db: Database.Database): void {
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
}

function ensureGapColumns(db: Database.Database): void {
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

export function getDatabase(): Database.Database {
  if (database) {
    return database;
  }

  database = new Database(getDatabaseFilePath());
  // WAL keeps the local app responsive when reads and writes overlap.
  database.pragma("journal_mode = WAL");
  createTables(database);
  ensureClassColumns(database);
  ensureInteractionColumns(database);
  ensureGapColumns(database);

  return database;
}

export function initializeDatabase(): Database.Database {
  return getDatabase();
}

export function getDatabaseCounts(): DatabaseCounts {
  const db = getDatabase();

  const countRows = (tableName: string): number => {
    // Table names are internal constants here, not user input.
    const result = db
      .prepare(`SELECT COUNT(*) as total FROM ${tableName}`)
      .get() as { total: number };

    return result.total;
  };

  return {
    classes: countRows("classes"),
    sessions: countRows("sessions"),
    interactions: countRows("interactions"),
    gaps: countRows("gaps"),
    gapEvents: countRows("gap_events"),
  };
}
