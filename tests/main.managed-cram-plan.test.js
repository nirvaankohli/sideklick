const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");

const {
  performManagedCramPlanWithCompatibility,
} = require("../apps/desktop/src/main/managed-cram-plan.js");

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
    run(requestBody) {
      return performManagedCramPlanWithCompatibility({
        requestBody,
        callManagedBackend,
      });
    },
  };
}

test("managed cram plan succeeds on the first request when session ids are valid", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [34, 55],
    examName: "Unit 5 Test",
  };
  const harness = createHarness([{ ok: true }]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
  ]);
});

test("managed cram plan retries without session ids when the managed backend cannot resolve them", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    examName: "Final Exam",
    uploadedMaterial: "Review packet",
  };
  const harness = createHarness([
    createStatusError(404, "Session resource not found."),
    { ok: true, fallback: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, fallback: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
      },
    },
  ]);
});

test("managed cram plan retries without session ids when the managed backend rejects mixed-class sessions", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [888],
    examName: "Final Exam",
    uploadedMaterial: "Review packet",
  };
  const harness = createHarness([
    createStatusError(403, "Session does not belong to the requested class."),
    { ok: true, fallback: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, fallback: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
      },
    },
  ]);
});

test("managed cram plan retries without session ids when the managed backend rejects session ownership", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [777],
    examName: "Ownership Retry",
  };
  const harness = createHarness([
    createStatusError(403, "Forbidden session resource access."),
    { ok: true, fallback: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, fallback: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
      },
    },
  ]);
});

test("managed cram plan resolves study credit failures into a renderer-safe error result", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    examName: "Final Exam",
  };
  const harness = createHarness([
    createStatusError(402, "Not enough Study Credits for this action."),
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, {
    __managedCramPlanError: true,
    status: 402,
    message: "Not enough Study Credits for this action.",
  });
  assert.equal(harness.calls.length, 1);
});

test("managed cram plan does not hide non-session backend failures", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    examName: "Midterm",
  };
  const originalError = createStatusError(500, "Managed backend exploded.");
  const harness = createHarness([originalError]);

  await assert.rejects(() => harness.run(requestBody), originalError);
  assert.equal(harness.calls.length, 1);
});

test("managed cram plan retries with compatibility-adjusted payload when initial request fails with validation error", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [34],
    examName: "Chemistry Final",
    teacherAssessmentProfile: { gradingNotes: "Strict grading" },
  };
  const harness = createHarness([
    createStatusError(400, "Invalid cram plan payload or model output."),
    { ok: true, cleaned: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, cleaned: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [34],
          examName: "Chemistry Final",
        },
      },
    },
  ]);
});

test("managed cram plan retries with compatibility-adjusted payload when session-free retry fails with validation error", async () => {
  const requestBody = {
    classId: 12,
    sessionIds: [999],
    examName: "Math Final",
    teacherAssessmentProfile: { gradingNotes: "Strict grading" },
  };
  const harness = createHarness([
    createStatusError(404, "Session resource not found."),
    createStatusError(400, "Invalid cram plan payload or model output."),
    { ok: true, sessionFreeCleaned: true },
  ]);

  const result = await harness.run(requestBody);

  assert.deepEqual(result, { ok: true, sessionFreeCleaned: true });
  assert.deepEqual(harness.calls, [
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: requestBody,
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [],
          examName: "Math Final",
          teacherAssessmentProfile: { gradingNotes: "Strict grading" },
        },
      },
    },
    {
      endpoint: "/api/cram-plan",
      options: {
        method: "POST",
        body: {
          classId: 12,
          sessionIds: [],
          examName: "Math Final",
        },
      },
    },
  ]);
});
