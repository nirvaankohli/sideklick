const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

process.env.DISABLE_OPENAI_ASSESSMENT_PROFILE = "1";

async function loadAssessmentProfileModule() {
  return import(
    pathToFileURL(
      path.join(
        __dirname,
        "..",
        "backend",
        "src",
        "services",
        "assessment-profile.ts",
      ),
    ).href,
  );
}

test("analyzeAssessmentProfile builds a teacher-style summary from uploaded assessments", async () => {
  const { analyzeAssessmentProfile } = await loadAssessmentProfileModule();

  const result = await analyzeAssessmentProfile({
    profileName: "Unit tests",
    presetLabel: "FRQ heavy",
    customFormat: "Short response with justification and partial credit",
    exampleQuestions: [
      "Explain why the reaction shifts left when temperature increases.",
    ],
    gradingNotes:
      "Takes off points for missing units and wants every algebra step shown.",
    uploadedMaterials: [
      {
        name: "Quiz 2.pdf",
        handler: "pdf",
        content:
          "Explain why the reaction shifts left when temperature increases. Show your work and justify each algebra step.",
      },
    ],
  });

  assert.equal(result.profileName, "Unit tests");
  assert.match(result.testFormat, /short response|frq|partial credit/i);
  assert.ok(result.genericDifferences.length >= 1);
  assert.ok(result.gradingSignals.some((value) => /units|step/i.test(value)));
  assert.ok(result.wordingPatterns.some((value) => /justification|work/i.test(value)));
  assert.ok(result.quizAdjustments.length >= 1);
  assert.ok(result.cramAdjustments.length >= 1);
});
