const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadPrivacySettingsModule() {
  return import(
    pathToFileURL(
      path.join(__dirname, "..", "src", "main", "privacy", "settings.ts"),
    ).href
  );
}

test("normalizePrivacySettings falls back to safe defaults", async () => {
  const {
    DEFAULT_PRIVACY_SETTINGS,
    normalizePrivacySettings,
  } = await loadPrivacySettingsModule();

  assert.deepEqual(normalizePrivacySettings(null), DEFAULT_PRIVACY_SETTINGS);
  assert.deepEqual(
    normalizePrivacySettings({
      screenshotPolicy: "bad-value",
      syncConsent: "later",
    }),
    DEFAULT_PRIVACY_SETTINGS,
  );
});

test("normalizePrivacySettings preserves valid values", async () => {
  const { normalizePrivacySettings } = await loadPrivacySettingsModule();

  assert.deepEqual(
    normalizePrivacySettings({
      screenshotPolicy: "manual",
      localOnly: false,
      syncConsent: "granted",
    }),
    {
      screenshotPolicy: "manual",
      localOnly: false,
      syncConsent: "granted",
    },
  );
});

test("privacy settings store reads normalized values and writes updates", async () => {
  const {
    createPrivacySettingsStore,
    DEFAULT_PRIVACY_SETTINGS,
  } = await loadPrivacySettingsModule();
  let rawValue = {
    screenshotPolicy: "disabled",
    localOnly: true,
    syncConsent: "denied",
  };
  const writes = [];

  const store = createPrivacySettingsStore({
    readRawValue() {
      return rawValue;
    },
    writeRawValue(value) {
      writes.push(value);
      rawValue = value;
      return value;
    },
  });

  assert.deepEqual(store.getSettings(), rawValue);

  const updated = store.updateSettings({
    screenshotPolicy: "manual",
  });
  assert.deepEqual(updated, {
    screenshotPolicy: "manual",
    localOnly: true,
    syncConsent: "denied",
  });

  const reset = store.resetSettings();
  assert.deepEqual(reset, DEFAULT_PRIVACY_SETTINGS);
  assert.deepEqual(writes, [updated, DEFAULT_PRIVACY_SETTINGS]);
});

test("privacy settings store sanitizes invalid writes", async () => {
  const { createPrivacySettingsStore } = await loadPrivacySettingsModule();
  let writtenValue = null;

  const store = createPrivacySettingsStore({
    readRawValue() {
      return null;
    },
    writeRawValue(value) {
      writtenValue = value;
      return value;
    },
  });

  const result = store.setSettings({
    screenshotPolicy: "not-real",
    localOnly: false,
    syncConsent: "granted",
  });

  assert.deepEqual(result, {
    screenshotPolicy: "disabled",
    localOnly: false,
    syncConsent: "granted",
  });
  assert.deepEqual(writtenValue, result);
});
