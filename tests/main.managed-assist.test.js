const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");

const {
  performManagedAssistWithCompatibility,
  toCompatChatAssistBody,
  toLegacyAssistBody,
} = require("../apps/desktop/src/main/managed-assist.js");

function createStatusError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createHarness(results) {
  const calls = [];
  const stages = [];

  async function callManagedBackend(endpoint, options) {
    calls.push({ provider: "managed", endpoint, options });
    const next = results.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }

  async function callLocalDesktopBackend(endpoint, options) {
    calls.push({ provider: "local", endpoint, options });
    const next = results.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }

  async function attemptAssistRequest(stage, requestFn, body) {
    stages.push({ stage, body });
    return requestFn();
  }

  return {
    calls,
    stages,
    run(requestBody) {
      return performManagedAssistWithCompatibility({
        requestBody,
        callManagedBackend,
        callLocalDesktopBackend,
        attemptAssistRequest,
      });
    },
  };
}

test("managed assist succeeds with the current desktop payload first", async () => {
  const requestBody = {
    classId: 12,
    sessionId: 34,
    actionType: "explain",
    selectedText: "Newton's second law",
    tracingConsent: {
      syncConsent: "granted",
    },
  };
  const harness = createHarness([{ answer: "current ok" }]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { answer: "current ok" });
  assert.deepEqual(
    harness.stages.map((entry) => entry.stage),
    ["managed-primary"],
  );
  assert.deepEqual(harness.calls[0], {
    provider: "managed",
    endpoint: "/api/assist",
    options: {
      method: "POST",
      body: requestBody,
    },
  });
});

test("managed assist falls back to the legacy desktop payload when current payload validation fails", async () => {
  const requestBody = {
    classId: 12,
    sessionId: 34,
    actionType: "explain",
    selectedText: "mitosis",
    surroundingText: "cell cycle notes",
    pageTitle: "Biology",
    pageUrl: "https://example.test/biology",
    userNote: "keep it short",
    screenshotDataUrl: "data:image/jpeg;base64,abc",
    tracingConsent: {
      syncConsent: "granted",
    },
    unknownCurrentField: true,
  };
  const harness = createHarness([
    createStatusError(400, "Invalid assist payload or model output."),
    { answer: "legacy ok" },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { answer: "legacy ok" });
  assert.deepEqual(
    harness.stages.map((entry) => entry.stage),
    ["managed-primary", "managed-legacy"],
  );
  assert.deepEqual(harness.calls[1].options.body, toLegacyAssistBody(requestBody));
  assert.equal("tracingConsent" in harness.calls[1].options.body, false);
  assert.equal("unknownCurrentField" in harness.calls[1].options.body, false);
});

test("managed assist removes missing legacy session ids before retrying", async () => {
  const requestBody = {
    classId: 12,
    sessionId: 999,
    actionType: "summarize",
    selectedText: "old local session",
  };
  const harness = createHarness([
    createStatusError(404, "Session resource not found."),
    { answer: "without session ok" },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { answer: "without session ok" });
  assert.deepEqual(
    harness.stages.map((entry) => entry.stage),
    ["managed-primary", "managed-without-session"],
  );
  assert.equal("sessionId" in harness.calls[1].options.body, false);
});

test("managed assist falls through compat chat and local backend for older managed backends", async () => {
  const requestBody = {
    classId: 12,
    sessionId: 34,
    actionType: "make_flashcards",
    selectedText: "ATP stores energy",
    userNote: "three cards",
    tracingConsent: {
      syncConsent: "granted",
    },
  };
  const harness = createHarness([
    createStatusError(400, "Invalid assist payload or model output."),
    createStatusError(400, "Invalid assist payload or model output."),
    createStatusError(400, "Invalid assist payload or model output."),
    { answer: "local ok" },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { answer: "local ok" });
  assert.deepEqual(
    harness.stages.map((entry) => entry.stage),
    [
      "managed-primary",
      "managed-legacy",
      "managed-compat-chat",
      "local-fallback",
    ],
  );
  assert.deepEqual(harness.calls[2].options.body, toCompatChatAssistBody(requestBody));
  assert.equal(harness.calls[3].provider, "local");
  assert.deepEqual(harness.calls[3].options.body, toLegacyAssistBody(requestBody));
});
