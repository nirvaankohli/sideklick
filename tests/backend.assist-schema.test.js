const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadSchemaModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "schema", "index.ts"),
  );
}

test("assist schema accepts legacy and smart session requests", async () => {
  const { assistRequestSchema } = await loadSchemaModule();
  const legacyRequest = {
    classId: 1,
    sessionId: 2,
    actionType: "chat",
    selectedText: "Explain this concept.",
    surroundingText: null,
    pageTitle: "Biology",
    pageUrl: null,
    userNote: null,
    screenshotDataUrl: null,
  };
  const smartRequest = {
    ...legacyRequest,
    requestMode: "smart",
    screenshotPolicy: "automatic",
  };

  assert.deepEqual(assistRequestSchema.parse(legacyRequest), legacyRequest);
  assert.deepEqual(assistRequestSchema.parse(smartRequest), smartRequest);
  assert.throws(
    () => assistRequestSchema.parse({ ...legacyRequest, requestMode: "other" }),
    /Invalid input/,
  );
});

test("assist route response schema accepts smart screenshot decisions and answered responses", async () => {
  const { assistRouteResponseSchema } = await loadSchemaModule();
  const needsScreenshot = {
    requestMode: "smart",
    needsScreenshot: true,
    reason: "The question references a graph on screen.",
  };
  const answered = {
    interactionId: 12,
    answer: "Use the graph's slope.",
    nextStep: "Practice identifying slope from one similar graph.",
    context: {
      activeGaps: [],
      recentInteractions: [],
      studentMemory: {
        recurringTopics: [],
        preferredHelpModes: [],
        knownStrengths: [],
        memorySummary: "No stable memory yet.",
      },
      recentSessions: [],
      contextGuidance: {
        requestPriority: ["Answer the current request."],
        screenshotUsefulness: "A screenshot was used.",
        backgroundUsefulness: "No extra background needed.",
      },
      workingMemory: {
        currentRequest: ["Explain this concept."],
        sessionWindow: [],
        recentInteractions: [],
        summary: "Current request only.",
      },
      episodicMemory: {
        recentSessions: [],
        carryForwardItems: [],
        summary: "No recent sessions.",
      },
      semanticMemory: {
        activeGaps: [],
        recurringTopics: [],
        preferredHelpModes: [],
        knownStrengths: [],
        summary: "No stable memory yet.",
      },
      contextTiers: {
        immediate: ["Explain this concept."],
        session: [],
        class: [],
        historical: [],
      },
      contextPacket: {
        answering: ["Explain directly."],
        coaching: ["Keep it short."],
        avoid: ["Do not over-explain."],
      },
      sessionGoal: null,
      summary: "Ready.",
    },
    gapCandidates: [],
    screenViewed: true,
  };

  assert.deepEqual(
    assistRouteResponseSchema.parse(needsScreenshot),
    needsScreenshot,
  );
  assert.deepEqual(assistRouteResponseSchema.parse(answered), answered);
});
