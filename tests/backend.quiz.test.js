const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadQuizModule() {
  return import(
    pathToFileURL(
      path.join(__dirname, "..", "backend", "src", "services", "quiz.ts"),
    ).href,
  );
}

test("quiz system instructions mirror teacher assessment format when provided", async () => {
  const { buildQuizSystemInstructions } = await loadQuizModule();

  const instructions = buildQuizSystemInstructions({
    className: "APUSH",
    subject: "APUSH",
    currentUnit: null,
    teacherFocus: "Teacher: Mr. Hall | Focus: DBQ evidence",
    testFormat: "DBQ-style prompts with scenario-heavy stems",
    testExamples: [
      "Evaluate the extent to which industrialization changed labor conditions.",
    ],
    keyConcepts: [],
    notes: null,
  });

  const joined = instructions.join(" ");
  assert.match(joined, /mirror the teacher's assessment feel/i);
  assert.match(joined, /adapt its reasoning style/i);
  assert.match(joined, /style anchors/i);
  assert.match(joined, /short, specific quiz title/i);
});

test("quiz prompt packet carries teacher assessment profile for generation", async () => {
  const { buildQuizPromptPacket } = await loadQuizModule();

  const packet = buildQuizPromptPacket({
    input: {
      classId: 1,
      sessionIds: [10],
      includeSessionSummary: true,
      includeSessionNotes: true,
      includeKeyTopics: true,
      includeUploadedMaterial: false,
      uploadedMaterial: null,
      gapFocus: 70,
      questionCount: 8,
    },
    classProfile: {
      id: 1,
      className: "Biology",
      subject: "Biology",
      currentUnit: "Unit 5",
      teacherFocus: "Teacher: Ms. Rivera | Focus: diagrams",
      testFormat: "Mixed multiple choice with short diagram explanations",
      testExamples: [
        "Label the cell membrane and justify each transport choice.",
        "Which graph best shows enzyme saturation under inhibitor pressure?",
      ],
      keyConcepts: [],
      notes: null,
    },
    sessions: [
      {
        id: 10,
        class_id: 1,
        title: "Membranes",
        notes: "Passive vs active transport",
        summary: "Reviewed membrane transport.",
        key_topics: JSON.stringify(["diffusion", "osmosis"]),
        ended_at: "2026-05-10T18:00:00.000Z",
        started_at: "2026-05-10T17:00:00.000Z",
      },
    ],
    keyTopics: ["diffusion", "osmosis"],
    gapRows: [
      {
        topic: "active transport",
        description: "Needs more confidence with ATP usage",
        weight: 3,
      },
    ],
  });

  assert.equal(
    packet.teacher_assessment_profile.test_format,
    "Mixed multiple choice with short diagram explanations",
  );
  assert.deepEqual(packet.teacher_assessment_profile.example_questions, [
    "Label the cell membrane and justify each transport choice.",
    "Which graph best shows enzyme saturation under inhibitor pressure?",
  ]);
  assert.equal(packet.quiz_constraints.question_count, 8);
  assert.match(JSON.stringify(packet.included_sources), /Reviewed membrane transport/);
});
