const { test } = require("./helpers/test-runner");
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
      examName: "Unit 4 Test",
      deadline: "2026-05-16T09:00",
      availableMinutes: 90,
      uploadedMaterial: "binary trees notes",
      additionalNotes: "Teacher likes traversal diagrams.",
      currentUnit: "Unit 4",
      gapFocus: 65,
      teacherAssessmentProfile: null,
    }),
    {
      classId: 7,
      sessionIds: [10, 11],
      examName: "Unit 4 Test",
      deadline: "2026-05-16T09:00",
      availableMinutes: 90,
      uploadedMaterial: "binary trees notes",
      additionalNotes: "Teacher likes traversal diagrams.",
      currentUnit: "Unit 4",
      gapFocus: 65,
      teacherAssessmentProfile: null,
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
        body: "Walk each traversal from memory, then map when each one appears in exam prompts.",
        keyTakeaways: ["Preorder starts at the root.", "Inorder reveals sorted output in BSTs."],
        vocabToKnow: ["**Preorder**", "*Inorder*", "Binary search tree (BST)"],
        estimatedMinutes: 20,
        priority: "must-review",
        sourceLabels: ["Session summary"],
        status: "not-started",
        quizEnabled: true,
        quizPreview: {
          title: "Traversal quiz preview",
          description: "Check whether you can identify the correct traversal from a tree sketch.",
          questionCount: 3,
        },
        quizId: null,
        lastScore: null,
      },
      {
        title: "Practice runtime questions",
        topic: "Runtime",
        body: "Compare common traversal and search paths until the time complexity is automatic.",
        keyTakeaways: ["Balanced trees stay near log n.", "A full scan falls back to linear time."],
        vocabToKnow: ["Balanced tree", "Linear time", "Log n"],
        estimatedMinutes: 25,
        priority: "quick-win",
        sourceLabels: ["Uploaded material"],
        status: "not-started",
        quizEnabled: true,
        quizPreview: {
          title: "Runtime quiz preview",
          description: "Launch a short quiz on best, average, and worst-case complexity.",
          questionCount: 3,
        },
        quizId: null,
        lastScore: null,
      },
      {
        title: "Skim edge cases",
        topic: "Edge cases",
        body: "Review null children, empty trees, and one-node examples only if time remains.",
        keyTakeaways: ["Check base cases first.", "Use tiny examples to catch pointer mistakes."],
        vocabToKnow: ["Base case", "Null child"],
        estimatedMinutes: 15,
        priority: "if-time",
        sourceLabels: [],
        status: "not-started",
        quizEnabled: false,
        quizPreview: null,
        quizId: null,
        lastScore: null,
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
  assert.match(homeJs, /prebuildCramTaskQuizzes/);
  assert.match(homeJs, /titleHint = task\.topic \|\| task\.quizPreview\?\.title \|\| task\.title \|\| null/);
  assert.match(homeJs, /titleHint,/);
  assert.match(homeJs, /activeQuizContext === "cram"/);
  assert.match(homeJs, /Your study guide is generated\./);
  assert.match(homeJs, /Study guide/);
  assert.match(homeJs, /Vocab to know/);
  assert.match(homeJs, /renderInlineCramText/);
  assert.match(homeJs, /vocabToKnow/);
  assert.match(homeJs, /Built from your selected study material\./);
  assert.doesNotMatch(homeJs, /task\.sourceLabels\.join/);
  assert.match(homeJs, /cram-study-guide-takeaways-card/);
  assert.match(homeJs, /cram-quiz-preview-grid/);
  assert.match(homeJs, /cram-coverage-focus/);
  assert.match(homeJs, /Quiz - Processing/);
  assert.match(homeJs, /cram-task-start-button/);
  assert.match(homeJs, /Open saved quiz/);
  assert.doesNotMatch(homeJs, /values\.name \|\| response\.title/);
  assert.doesNotMatch(homeJs, /Build a Study Plan|TONIGHT'S TIMELINE|Do this first|Study First|COACH/);
  assert.doesNotMatch(homeHtml, /Build a Study Plan|TONIGHT'S TIMELINE|Do this first|Study First|COACH/);
  assert.match(homeHtml, /id="home-cram-view"/);
  assert.match(homeHtml, /id="cram-quiz-mount"/);
});
