import fs from "node:fs";
import path from "node:path";

import type { DatabaseCounts } from "../type/database";

type PgPool = {
  query: <T = unknown>(sql: string) => Promise<{ rows: T[] }>;
  end: () => Promise<void>;
};

type PgPoolConfig = {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl?: {
    ca?: string;
    rejectUnauthorized: boolean;
  };
};

let pool: PgPool | null = null;
let PoolConstructor: (new (config: PgPoolConfig) => PgPool) | null = null;

function getMigrationsDirectoryPath(): string {
  return path.join(process.cwd(), "backend", "migrations");
}

function getPoolConstructor() {
  if (PoolConstructor) {
    return PoolConstructor;
  }

  try {
    const pgModule = require("pg") as {
      Pool: new (config: PgPoolConfig) => PgPool;
    };
    PoolConstructor = pgModule.Pool;
    return PoolConstructor;
  } catch (error) {
    throw new Error(
      "PostgreSQL support requires the 'pg' package to be installed before setting DATABASE_URL.",
      { cause: error },
    );
  }
}

function buildSslConfig() {
  const caPath = process.env.POSTGRES_CA_CERT_PATH;
  if (!caPath) {
    return process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined;
  }

  return {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

function getPoolConfig(): PgPoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL for PostgreSQL backend.");
  }

  return {
    connectionString,
    max: Number(process.env.POSTGRES_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.POSTGRES_CONNECT_TIMEOUT_MS || 10_000),
    ssl: buildSslConfig(),
  };
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPostgresPool(): PgPool {
  if (pool) {
    return pool;
  }

  const ActivePool = getPoolConstructor();
  pool = new ActivePool(getPoolConfig());
  return pool;
}

export async function initializePostgres(): Promise<PgPool> {
  const activePool = getPostgresPool();

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationFiles = fs
    .readdirSync(getMigrationsDirectoryPath(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const existing = await activePool.query<{ version: string }>(
      `SELECT version FROM schema_migrations WHERE version = '${migrationFile}' LIMIT 1`,
    );
    if (existing.rows.length > 0) {
      continue;
    }

    const sql = fs.readFileSync(
      path.join(getMigrationsDirectoryPath(), migrationFile),
      "utf8",
    );
    await activePool.query(sql);
    await activePool.query(
      `INSERT INTO schema_migrations (version) VALUES ('${migrationFile}')`,
    );
  }

  return activePool;
}

export async function getPostgresDatabaseCounts(): Promise<DatabaseCounts> {
  const activePool = getPostgresPool();

  const countRows = async (tableName: string): Promise<number> => {
    const result = await activePool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${tableName}`,
    );
    return Number(result.rows[0]?.total ?? 0);
  };

  const [
    appState,
    classes,
    sessions,
    interactions,
    gaps,
    gapEvents,
  ] = await Promise.all([
    countRows("app_state"),
    countRows("classes"),
    countRows("sessions"),
    countRows("interactions"),
    countRows("gaps"),
    countRows("gap_events"),
  ]);

  return {
    appState,
    classes,
    sessions,
    interactions,
    gaps,
    gapEvents,
  };
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) {
    return;
  }

  const activePool = pool;
  pool = null;
  await activePool.end();
}
