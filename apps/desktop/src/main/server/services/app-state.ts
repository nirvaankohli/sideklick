import { getDatabase } from "../db";

const CLASS_FOLDERS_KEY = "classFolders";
const CURRENT_SESSION_KEY = "currentSession";

function hasStoredAppState(stateKey: string): boolean {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT 1
      FROM app_state
      WHERE state_key = ?
      LIMIT 1
    `,
  ).get(stateKey) as { 1: number } | undefined;

  return Boolean(row);
}

function getAppStateValue<T>(stateKey: string, fallback: T): T {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT state_value
      FROM app_state
      WHERE state_key = ?
    `,
  ).get(stateKey) as { state_value: string } | undefined;

  if (!row) {
    return fallback;
  }

  try {
    return JSON.parse(row.state_value) as T;
  } catch {
    return fallback;
  }
}

function setAppStateValue<T>(stateKey: string, value: T): T {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO app_state (
        state_key,
        state_value,
        updated_at
      ) VALUES (
        @stateKey,
        @stateValue,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(state_key) DO UPDATE SET
        state_value = excluded.state_value,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run({
    stateKey,
    stateValue: JSON.stringify(value),
  });

  return value;
}

function deleteAppStateValue(stateKey: string): void {
  const db = getDatabase();
  db.prepare(
    `
      DELETE FROM app_state
      WHERE state_key = ?
    `,
  ).run(stateKey);
}

export function hasStoredClassFolders(): boolean {
  return hasStoredAppState(CLASS_FOLDERS_KEY);
}

export function getStoredClassFolders(): unknown[] {
  const value = getAppStateValue<unknown[]>(CLASS_FOLDERS_KEY, []);
  return Array.isArray(value) ? value : [];
}

export function setStoredClassFolders(classFolders: unknown): unknown[] {
  const normalizedFolders = Array.isArray(classFolders) ? classFolders : [];
  return setAppStateValue(CLASS_FOLDERS_KEY, normalizedFolders);
}

export function hasStoredCurrentSession(): boolean {
  return hasStoredAppState(CURRENT_SESSION_KEY);
}

export function getCurrentSessionState(): Record<string, unknown> | null {
  const value = getAppStateValue<Record<string, unknown> | null>(
    CURRENT_SESSION_KEY,
    null,
  );

  return value && typeof value === "object" ? value : null;
}

export function setCurrentSessionState(
  currentSession: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!currentSession || typeof currentSession !== "object") {
    deleteAppStateValue(CURRENT_SESSION_KEY);
    return null;
  }

  return setAppStateValue(CURRENT_SESSION_KEY, currentSession);
}

export function clearCurrentSessionState(): void {
  deleteAppStateValue(CURRENT_SESSION_KEY);
}
