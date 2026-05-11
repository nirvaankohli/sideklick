const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadCramModule() {
  return import(
    pathToFileURL(
      path.join(__dirname, "..", "backend", "src", "services", "cram.ts"),
    ).href,
  );
}

test("generateCramPlan returns a structured cram plan for valid input", async () => {
  const { generateCramPlan } = await loadCramModule();

  const result = generateCramPlan({
    examName: "Biology Midterm",
    timeAvailable: "1 hour",
    examMaterial: "Cell respiration\nATP production\nElectron transport chain",
    additionalNotes: "Teacher keeps emphasizing diagrams.",
    courseName: "AP Biology",
    unitPathLabel: "Unit 4 > Cellular Respiration",
  });

  assert.equal(result.title, "Biology Midterm Cram Plan");
  assert.match(result.subtitle, /Biology Midterm/);
  assert.match(result.subtitle, /1 hour left/);
  assert.match(result.subtitle, /AP Biology/);
  assert.equal(result.studyFirst.length, 2);
  assert.equal(result.studyNext.length, 2);
  assert.equal(result.skipIfNeeded.length, 2);
  assert.equal(result.likelyQuestions.length, 3);
  assert.equal(result.quickSelfTest.length, 3);
  assert.equal(result.timePlan.length, 3);
});

test("generateCramPlan rejects invalid payloads", async () => {
  const { generateCramPlan } = await loadCramModule();

  assert.throws(
    () =>
      generateCramPlan({
        examName: "Biology Midterm",
        timeAvailable: "tomorrow",
        examMaterial: "",
      }),
    /Invalid/,
  );
});

test("generateCramPlan rejects oversized cram material with a clear error", async () => {
  const { generateCramPlan } = await loadCramModule();

  assert.throws(
    () =>
      generateCramPlan({
        examName: "Biology Midterm",
        timeAvailable: "1 hour",
        examMaterial: "ATP ".repeat(7000),
      }),
    /supports up to 24,000 characters/i,
  );
});

test("generateCramPlan rejects material that is too sparse to be useful", async () => {
  const { generateCramPlan } = await loadCramModule();

  assert.throws(
    () =>
      generateCramPlan({
        examName: "Biology Midterm",
        timeAvailable: "1 hour",
        examMaterial: "ATP ATP ATP",
      }),
    /works best with at least a few complete concepts/i,
  );
});
