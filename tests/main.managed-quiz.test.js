const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");

const {
  performManagedQuizWithCompatibility,
} = require("../apps/desktop/src/main/managed-quiz.js");

function createStatusError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createHarness(results) {
  const calls = [];

  async function callManagedBackend(endpoint, options) {
    calls.push({ endpoint, options });
    const next = results.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }

  return {
    calls,
    run(requestBody, idempotencyKey = "test-idempotency") {
      return performManagedQuizWithCompatibility({
        requestBody,
        callManagedBackend,
        idempotencyKey,
      });
    },
  };
}

test("managed quiz succeeds on the first request when session ids are valid", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [34, 55],
    questionCount: 10,
  };
  const harness = createHarness([{ ok: true }]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: requestBody,
        idempotencyKey: "test-idempotency",
      },
    },
  ]);
});

test("managed quiz retries without session ids when the managed backend cannot resolve them (404)", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    questionCount: 10,
  };
  const harness = createHarness([
    createStatusError(404, "Session resource not found."),
    { ok: true, retried: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, retried: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: requestBody,
        idempotencyKey: "test-idempotency",
      },
    },
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
        idempotencyKey: "test-idempotency",
      },
    },
  ]);
});

test("managed quiz does not hide non-session backend failures", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    questionCount: 10,
  };
  const harness = createHarness([
    createStatusError(500, "Internal Server Error"),
  ]);

  await assert.rejects(
    () => harness.run(requestBody),
    (err) => {
      assert.equal(err.status, 500);
      assert.equal(err.message, "Internal Server Error");
      return true;
    },
  );
});

test("managed quiz retries with compatibility-adjusted payload when initial request fails with validation error", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [34],
    questionCount: 10,
    teacherAssessmentProfile: { gradingNotes: "Strict grading" },
  };
  const harness = createHarness([
    createStatusError(400, "Invalid quiz payload or model output."),
    { ok: true, cleaned: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, cleaned: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: requestBody,
        idempotencyKey: "test-idempotency",
      },
    },
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [34],
          questionCount: 8,
        },
        idempotencyKey: "test-idempotency",
      },
    },
  ]);
});

test("managed quiz retries with compatibility-adjusted payload when session-free retry fails with validation error", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    questionCount: 10,
    teacherAssessmentProfile: { gradingNotes: "Strict grading" },
  };
  const harness = createHarness([
    createStatusError(404, "Session resource not found."),
    createStatusError(400, "Invalid quiz payload or model output."),
    { ok: true, sessionFreeCleaned: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, sessionFreeCleaned: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: requestBody,
        idempotencyKey: "test-idempotency",
      },
    },
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [],
          questionCount: 10,
          teacherAssessmentProfile: { gradingNotes: "Strict grading" },
        },
        idempotencyKey: "test-idempotency",
      },
    },
    {
      endpoint: "/api/quiz",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [],
          questionCount: 8,
        },
        idempotencyKey: "test-idempotency",
      },
    },
  ]);
});
