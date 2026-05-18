const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadLangfuseModule() {
  return import(
    pathToFileURL(
      path.join(__dirname, "..", "src", "shared", "langfuse.ts"),
    ).href,
  );
}

test("maskLangfuseExportPayload redacts image data URLs and secrets", async () => {
  const { maskLangfuseExportPayload } = await loadLangfuseModule();

  const masked = maskLangfuseExportPayload({
    data: [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
      "OPENAI sk-proj-1234567890abcdefghijklmnop",
      "LANGFUSE pk-lf-1234567890abcdefghijklmnop",
      "Bearer abc.def.ghi",
      "student@example.com",
    ].join(" "),
  });

  assert.equal(masked.includes("data:image/png;base64"), false);
  assert.equal(masked.includes("sk-proj-1234567890abcdefghijklmnop"), false);
  assert.equal(masked.includes("pk-lf-1234567890abcdefghijklmnop"), false);
  assert.equal(masked.includes("abc.def.ghi"), false);
  assert.equal(masked.includes("student@example.com"), false);
  assert.match(masked, /\[redacted-image-data-url]/);
  assert.match(masked, /\[redacted-openai-key]/);
  assert.match(masked, /\[redacted-langfuse-key]/);
  assert.match(masked, /Bearer \[redacted-token]/);
  assert.match(masked, /\[redacted-email]/);
});

test("summarizeTextForTrace normalizes whitespace and truncates long values", async () => {
  const { summarizeTextForTrace } = await loadLangfuseModule();

  assert.equal(summarizeTextForTrace("  Cell   respiration\nmatters  ", 60), "Cell respiration matters");
  assert.equal(summarizeTextForTrace("", 60), null);
  assert.equal(summarizeTextForTrace("ATP ".repeat(30), 20)?.endsWith("…"), true);
});
