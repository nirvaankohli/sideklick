import { getDatabase } from "../server/db/index.ts";

const PRIVACY_SETTINGS_KEY = "privacySettings";

const ALLOWED_SCREENSHOT_POLICIES = new Set([
  "automatic",
  "manual",
  "disabled",
] as const);
const ALLOWED_SYNC_CONSENTS = new Set([
  "unknown",
  "granted",
  "denied",
] as const);

export type ScreenshotPolicy = "automatic" | "manual" | "disabled";
export type SyncConsent = "unknown" | "granted" | "denied";

export type PrivacySettings = {
  screenshotPolicy: ScreenshotPolicy;
  localOnly: boolean;
  syncConsent: SyncConsent;
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  screenshotPolicy: "disabled",
  localOnly: true,
  syncConsent: "unknown",
};

type PrivacySettingsPatch = Partial<PrivacySettings> | null | undefined;

type PrivacySettingsStoreOptions = {
  readRawValue?: () => unknown;
  writeRawValue?: (value: PrivacySettings) => PrivacySettings;
};

function readStoredPrivacySettings(): unknown {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT state_value
      FROM app_state
      WHERE state_key = ?
    `,
  ).get(PRIVACY_SETTINGS_KEY) as { state_value: string } | undefined;

  if (!row) {
    return null;
  }

  try {
    return JSON.parse(row.state_value) as unknown;
  } catch {
    return null;
  }
}

function writeStoredPrivacySettings(
  value: PrivacySettings,
): PrivacySettings {
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
    stateKey: PRIVACY_SETTINGS_KEY,
    stateValue: JSON.stringify(value),
  });

  return value;
}

export function normalizePrivacySettings(value: unknown): PrivacySettings {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    screenshotPolicy: ALLOWED_SCREENSHOT_POLICIES.has(
      candidate.screenshotPolicy as ScreenshotPolicy,
    )
      ? (candidate.screenshotPolicy as ScreenshotPolicy)
      : DEFAULT_PRIVACY_SETTINGS.screenshotPolicy,
    localOnly:
      typeof candidate.localOnly === "boolean"
        ? candidate.localOnly
        : DEFAULT_PRIVACY_SETTINGS.localOnly,
    syncConsent: ALLOWED_SYNC_CONSENTS.has(
      candidate.syncConsent as SyncConsent,
    )
      ? (candidate.syncConsent as SyncConsent)
      : DEFAULT_PRIVACY_SETTINGS.syncConsent,
  };
}

export function createPrivacySettingsStore(
  options: PrivacySettingsStoreOptions = {},
) {
  const readRawValue = options.readRawValue ?? readStoredPrivacySettings;
  const writeRawValue = options.writeRawValue ?? writeStoredPrivacySettings;

  return {
    getSettings(): PrivacySettings {
      return normalizePrivacySettings(readRawValue());
    },
    setSettings(nextSettings: unknown): PrivacySettings {
      return writeRawValue(normalizePrivacySettings(nextSettings));
    },
    updateSettings(patch: PrivacySettingsPatch): PrivacySettings {
      const currentSettings = normalizePrivacySettings(readRawValue());
      const nextSettings = normalizePrivacySettings({
        ...currentSettings,
        ...(patch && typeof patch === "object" ? patch : {}),
      });

      return writeRawValue(nextSettings);
    },
    resetSettings(): PrivacySettings {
      return writeRawValue({ ...DEFAULT_PRIVACY_SETTINGS });
    },
  };
}

const privacySettingsStore = createPrivacySettingsStore();

export function getPrivacySettings(): PrivacySettings {
  return privacySettingsStore.getSettings();
}

export function setPrivacySettings(nextSettings: unknown): PrivacySettings {
  return privacySettingsStore.setSettings(nextSettings);
}

export function updatePrivacySettings(
  patch: PrivacySettingsPatch,
): PrivacySettings {
  return privacySettingsStore.updateSettings(patch);
}

export function resetPrivacySettings(): PrivacySettings {
  return privacySettingsStore.resetSettings();
}
