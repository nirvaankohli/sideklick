const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

process.env.DISABLE_OPENAI_CRAM = "1";

async function loadCramModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "services", "cram.ts"),
  );
}

test("generateCramPlan returns a structured cram plan for valid input", async () => {
  const { generateCramPlan } = await loadCramModule();

  const result = await generateCramPlan({
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
  assert.ok(result.studyFirst.length >= 1 && result.studyFirst.length <= 4);
  assert.ok(result.studyNext.length >= 1 && result.studyNext.length <= 4);
  assert.ok(result.skipIfNeeded.length >= 1 && result.skipIfNeeded.length <= 4);
  assert.ok(result.likelyQuestions.length >= 3 && result.likelyQuestions.length <= 6);
  assert.ok(result.quickSelfTest.length >= 3 && result.quickSelfTest.length <= 6);
  assert.ok(result.timePlan.length >= 3 && result.timePlan.length <= 5);
});

test("generateCramPlan rejects invalid payloads", async () => {
  const { generateCramPlan } = await loadCramModule();

  await assert.rejects(
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

  await assert.rejects(
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

  await assert.rejects(
    () =>
      generateCramPlan({
        examName: "Biology Midterm",
        timeAvailable: "1 hour",
        examMaterial: "ATP ATP ATP",
      }),
    /works best with at least a few complete concepts/i,
  );
});

test("chunkCramMaterial splits long material into multiple chunks", async () => {
  const { chunkCramMaterial } = await loadCramModule();

  const longMaterial = Array.from({ length: 75 }, (_, index) =>
    `Topic ${index + 1}\nDefinition ${index + 1} is important because it connects to process ${index + 1}, shows up in worked examples, and should be explained from memory before the exam.`,
  ).join("\n\n");

  const chunks = chunkCramMaterial(longMaterial);

  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.text.length > 0));
});

test("buildCramExamMap returns merged high-yield structure from long notes", async () => {
  const { buildCramExamMap } = await loadCramModule();

  const examMap = await buildCramExamMap({
    examName: "Chemistry Final",
    timeAvailable: "2 hours",
    examMaterial: [
      "Equilibrium is when forward and reverse reaction rates are equal.",
      "Le Chatelier's principle predicts how equilibrium shifts after stress.",
      "Use K = products over reactants at equilibrium.",
      "Acids donate protons and bases accept protons.",
      "pH = -log[H+] is a formula you should remember.",
      "Buffers resist sudden pH changes and often show up in worked examples.",
    ].join("\n\n"),
    courseName: "Chemistry",
    unitPathLabel: "Unit 7",
  });

  assert.ok(examMap.topTopics.length >= 1);
  assert.equal(examMap.sourceChunkCount >= 1, true);
  assert.equal(typeof examMap.overview, "string");
  assert.ok(
    examMap.topTopics.some((topic) => /equilibrium|acid|buffer|ph/i.test(topic.topic)),
  );
});
