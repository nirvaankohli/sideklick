const test = require("node:test");
const assert = require("node:assert/strict");
const JSZip = require("jszip");

process.env.DISABLE_OPENAI_FILE_VISION = "1";

const {
  compressStudyMaterialText,
  extractStudyMaterialFromFile,
  extractTextFromPptxBuffer,
} = require("../src/main/study-material.js");

test("compressStudyMaterialText removes repeated boilerplate and keeps high-signal lines", () => {
  const rawText = [
    "BIOLOGY 101",
    "BIOLOGY 101",
    "BIOLOGY 101",
    "Cell respiration is the process cells use to make ATP.",
    "Formula: glucose + oxygen -> carbon dioxide + water + ATP",
    "Mitochondria are the main site of aerobic respiration.",
  ].join("\n");

  const compressed = compressStudyMaterialText(rawText, {
    maxCharacters: 500,
    maxLines: 6,
  });

  assert.match(compressed, /Cell respiration is the process/i);
  assert.match(compressed, /Formula:/i);
  assert.doesNotMatch(compressed, /BIOLOGY 101\nBIOLOGY 101/);
});

test("extractTextFromPptxBuffer reads slide text from pptx xml", async () => {
  const zip = new JSZip();
  zip.file(
    "ppt/slides/slide1.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="p" xmlns:a="a">
        <p:cSld>
          <p:spTree>
            <p:sp><p:txBody><a:p><a:r><a:t>Photosynthesis</a:t></a:r></a:p></p:txBody></p:sp>
            <p:sp><p:txBody><a:p><a:r><a:t>Light reactions make ATP and NADPH</a:t></a:r></a:p></p:txBody></p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>`,
  );
  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  const extracted = await extractTextFromPptxBuffer(buffer);

  assert.match(extracted, /Slide 1:/);
  assert.match(extracted, /Photosynthesis/);
  assert.match(extracted, /ATP and NADPH/);
});

test("extractStudyMaterialFromFile condenses pptx uploads into compact notes", async () => {
  const zip = new JSZip();
  zip.file(
    "ppt/slides/slide1.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="p" xmlns:a="a">
        <p:cSld>
          <p:spTree>
            <p:sp><p:txBody><a:p><a:r><a:t>Acids and Bases</a:t></a:r></a:p></p:txBody></p:sp>
            <p:sp><p:txBody><a:p><a:r><a:t>pH = -log[H+]</a:t></a:r></a:p></p:txBody></p:sp>
            <p:sp><p:txBody><a:p><a:r><a:t>Buffers resist sudden pH changes</a:t></a:r></a:p></p:txBody></p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>`,
  );
  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  const result = await extractStudyMaterialFromFile(
    {
      name: "chem-review.pptx",
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      bytes: buffer,
    },
    { mode: "cram" },
  );

  assert.equal(result.handler, "pptx");
  assert.match(result.content, /Acids and Bases/);
  assert.match(result.content, /pH = -log\[H\+\]/);
  assert.ok(result.compressedCharacters <= result.originalCharacters);
});
