const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadSchemaModule() {
  return import(
    pathToFileURL(
      path.join(__dirname, "..", "backend", "src", "schema", "index.ts"),
    ).href
  );
}

test("cram plan schemas accept the saved plan generator contract", async () => {
  const {
    cramPlanRequestSchema,
    cramPlanResponseSchema,
  } = await loadSchemaModule();

  assert.deepEqual(
    cramPlanRequestSchema.parse({
      classId: 7,
      sessionIds: [10, 11],
      deadline: "2026-05-16T09:00",
      availableMinutes: 90,
      uploadedMaterial: "binary trees notes",
      currentUnit: "Unit 4",
      gapFocus: 65,
    }),
    {
      classId: 7,
      sessionIds: [10, 11],
      deadline: "2026-05-16T09:00",
      availableMinutes: 90,
      uploadedMaterial: "binary trees notes",
      currentUnit: "Unit 4",
      gapFocus: 65,
    },
  );

  const response = cramPlanResponseSchema.parse({
    title: "Unit 4 Cram",
    summary: "Focus on tree traversal and runtime.",
    sourceSummary: "Two sessions and pasted notes.",
    estimatedTotalMinutes: 75,
    recommendedFirstTask: "Review traversal order",
    tasks: [
      {
        title: "Review traversal order",
        topic: "Tree traversal",
        estimatedMinutes: 20,
        priority: "must-review",
        sourceLabels: ["Session summary"],
        status: "not-started",
        quizEnabled: true,
      },
      {
        title: "Practice runtime questions",
        topic: "Runtime",
        estimatedMinutes: 25,
        priority: "quick-win",
        sourceLabels: ["Uploaded material"],
        status: "not-started",
        quizEnabled: true,
      },
      {
        title: "Skim edge cases",
        topic: "Edge cases",
        estimatedMinutes: 15,
        priority: "if-time",
        sourceLabels: [],
        status: "not-started",
        quizEnabled: false,
      },
    ],
  });

  assert.equal(response.tasks.length, 3);
  assert.equal(response.tasks[0].priority, "must-review");
});

test("home renderer keeps cram plans in the folder tree and bridges quiz flow", () => {
  const homeJs = fs.readFileSync(
    path.join(__dirname, "..", "src", "home.js"),
    "utf8",
  );
  const homeHtml = fs.readFileSync(
    path.join(__dirname, "..", "src", "home.html"),
    "utf8",
  );

  assert.match(homeJs, /child\.type === "cramPlan"/);
  assert.match(homeJs, /openCramSetupForCurrentClass/);
  assert.match(homeJs, /launchCramTaskQuiz/);
  assert.match(homeJs, /generateCramPlan/);
  assert.match(homeJs, /activeQuizContext === "cram"/);
  assert.doesNotMatch(homeJs, /values\.name \|\| response\.title/);
  assert.doesNotMatch(homeJs, /Build a Study Plan|TONIGHT'S TIMELINE|Do this first|Study First|COACH/);
  assert.doesNotMatch(homeHtml, /Build a Study Plan|TONIGHT'S TIMELINE|Do this first|Study First|COACH/);
  assert.match(homeHtml, /id="home-cram-view"/);
  assert.match(homeHtml, /id="cram-quiz-mount"/);
});
