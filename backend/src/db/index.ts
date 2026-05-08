export {
  getLegacyDatabase as getDatabase,
  getLegacyDatabaseCounts as getDatabaseCounts,
  initializeLegacyDatabase as initializeDatabase,
} from "./sqlite.ts";

export {
  closePostgresPool,
  getPostgresDatabaseCounts,
  getPostgresPool,
  initializePostgres,
  isPostgresConfigured,
} from "./postgres.ts";
