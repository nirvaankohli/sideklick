const path = require("path");

const JSZip = require("jszip");
const OpenAI = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");

const IMAGE_SUMMARY_MODEL =
  process.env.OPENAI_UPLOAD_VISION_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-5-mini";
const FORMAT_BUDGETS = {
  cram: {
    maxCharacters: 5200,
    maxLines: 44,
  },
  quiz: {
    maxCharacters: 3400,
    maxLines: 28,
  },
};
const imageStudyNotesSchema = z
  .object({
    title: z.string().trim().min(1),
    keyPoints: z.array(z.string().trim().min(1)).min(2).max(8),
    formulas: z.array(z.string().trim().min(1)).max(4),
    labels: z.array(z.string().trim().min(1)).max(6),
  })
  .strict();

let cachedOpenAIClient = null;

function getOpenAIClient() {
  if (cachedOpenAIClient) {
    return cachedOpenAIClient;
  }

  if (/^(1|true)$/i.test(process.env.DISABLE_OPENAI_FILE_VISION || "")) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  cachedOpenAIClient = new OpenAI({ apiKey });
  return cachedOpenAIClient;
}

function getFileExtension(fileName) {
  return path.extname(String(fileName || "")).toLowerCase();
}

function normalizeExtractedFileText(rawText) {
  return String(rawText || "")
    .replace(/\u0000/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function toBuffer(bytes) {
  if (Buffer.isBuffer(bytes)) {
    return bytes;
  }

  if (bytes instanceof Uint8Array) {
    return Buffer.from(bytes);
  }

  if (Array.isArray(bytes)) {
    return Buffer.from(bytes);
  }

  throw new Error("Unsupported file payload.");
}

function splitIntoMeaningfulLines(rawText) {
  return normalizeExtractedFileText(rawText)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeLineKey(line) {
  return line
    .toLowerCase()
    .replace(/page \d+ of \d+/g, "")
    .replace(/\bslide \d+\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreStudyLine(line) {
  let score = 0;

  if (/^[-*•]\s+/.test(line) || /^\d+[\).]\s+/.test(line)) {
    score += 5;
  }
  if (/=|→|<-|=>|\bvs\b|%|\d/.test(line)) {
    score += 4;
  }
  if (
    /\b(is|are|means|defined as|refers to|because|therefore|causes|results in)\b/i.test(
      line,
    )
  ) {
    score += 4;
  }
  if (/:\s+\S/.test(line)) {
    score += 2;
  }
  if (line.length >= 20 && line.length <= 180) {
    score += 2;
  }
  if (/^[A-Z][A-Za-z0-9 ,:/()'"+-]{0,80}$/.test(line)) {
    score += 2;
  }
  if (line.length < 10) {
    score -= 2;
  }

  return score;
}

function compressStudyMaterialText(rawText, options = {}) {
  const { maxCharacters = 4000, maxLines = 32 } = options;
  const lines = splitIntoMeaningfulLines(rawText);

  if (lines.length === 0) {
    return "";
  }

  const lineFrequency = new Map();
  for (const line of lines) {
    const key = normalizeLineKey(line);
    if (!key) {
      continue;
    }
    lineFrequency.set(key, (lineFrequency.get(key) || 0) + 1);
  }

  const candidates = [];
  const seenKeys = new Set();
  lines.forEach((line, index) => {
    const key = normalizeLineKey(line);
    if (!key || seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);

    const frequency = lineFrequency.get(key) || 1;
    if (frequency >= 3 && line.length <= 90) {
      return;
    }

    candidates.push({
      line,
      index,
      score: scoreStudyLine(line),
    });
  });

  const prioritized = candidates
    .slice()
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = prioritized.slice(0, maxLines);
  selected.sort((a, b) => a.index - b.index);

  let compressed = "";
  for (const item of selected) {
    const next = compressed ? `${compressed}\n${item.line}` : item.line;
    if (next.length > maxCharacters && compressed) {
      break;
    }
    compressed = next.slice(0, maxCharacters);
  }

  if (!compressed.trim()) {
    compressed = lines.join("\n").slice(0, maxCharacters).trim();
  }

  return compressed.trim();
}

function ensurePdfDomStubs() {
  if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {
      constructor(init = {}) {
        this.a = typeof init.a === "number" ? init.a : 1;
        this.b = typeof init.b === "number" ? init.b : 0;
        this.c = typeof init.c === "number" ? init.c : 0;
        this.d = typeof init.d === "number" ? init.d : 1;
        this.e = typeof init.e === "number" ? init.e : 0;
        this.f = typeof init.f === "number" ? init.f : 0;
        this.is2D = true;
      }

      multiply() {
        return new global.DOMMatrix();
      }

      translate() {
        return new global.DOMMatrix();
      }

      scale() {
        return new global.DOMMatrix();
      }

      rotate() {
        return new global.DOMMatrix();
      }
    };
  }

  if (typeof global.ImageData === "undefined") {
    global.ImageData = class ImageData {
      constructor(data = new Uint8ClampedArray(), width = 0, height = 0) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  if (typeof global.Path2D === "undefined") {
    global.Path2D = class Path2D {
      constructor() {}
    };
  }
}

async function extractTextFromPdfBuffer(buffer) {
  ensurePdfDomStubs();
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeExtractedFileText(result?.text || "");
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy().catch(() => {});
    }
  }
}

async function extractTextFromPptxBuffer(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.keys(zip.files)
    .filter((entryName) => /^ppt\/slides\/slide\d+\.xml$/i.test(entryName))
    .sort((left, right) => {
      const leftNumber = Number(left.match(/slide(\d+)\.xml/i)?.[1] || 0);
      const rightNumber = Number(right.match(/slide(\d+)\.xml/i)?.[1] || 0);
      return leftNumber - rightNumber;
    });

  const slideTexts = await Promise.all(
    slideEntries.map(async (entryName, index) => {
      const xml = await zip.files[entryName].async("string");
      const textParts = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)]
        .map((match) => decodeXmlEntities(match[1]))
        .map((value) => value.replace(/\s+/g, " ").trim())
        .filter(Boolean);

      if (textParts.length === 0) {
        return "";
      }

      const [title, ...rest] = textParts;
      const bullets = rest.slice(0, 6).join(" • ");
      return bullets
        ? `Slide ${index + 1}: ${title} • ${bullets}`
        : `Slide ${index + 1}: ${title}`;
    }),
  );

  return normalizeExtractedFileText(slideTexts.filter(Boolean).join("\n"));
}

function extractTextFromPlainBuffer(buffer) {
  const decodedText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  return normalizeExtractedFileText(decodedText);
}

async function summarizeImageForStudy(file) {
  const client = getOpenAIClient();
  if (!client) {
    return "Image upload detected. Add a short note describing the key diagram, labels, or formulas so the study plan stays grounded.";
  }

  const dataUrl = `data:${file.mimeType || "image/png"};base64,${file.buffer.toString("base64")}`;
  const response = await client.responses.parse({
    model: IMAGE_SUMMARY_MODEL,
    prompt_cache_key: "study-image-condense-v1",
    input: [
      {
        role: "system",
        content: [
          "You condense uploaded study images into compact, testable notes.",
          "Return structured JSON only.",
          "Focus on headings, labels, formulas, definitions, cause-effect relationships, and step order.",
          "Ignore decorative text, repeated UI chrome, and obvious filler.",
          "Keep the result useful for cram-mode or quiz generation.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                file_name: file.name,
                task: "Turn this image into concise study notes with minimal token waste.",
              },
              null,
              2,
            ),
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "auto",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(imageStudyNotesSchema, "study_image_notes"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Image study extraction returned no structured result.");
  }

  const parsed = imageStudyNotesSchema.parse(response.output_parsed);
  return compressStudyMaterialText(
    [
      parsed.title,
      ...parsed.keyPoints.map((value) => `- ${value}`),
      ...parsed.formulas.map((value) => `Formula: ${value}`),
      ...parsed.labels.map((value) => `Label: ${value}`),
    ].join("\n"),
    {
      maxCharacters: 1100,
      maxLines: 18,
    },
  );
}

async function extractStudyMaterialFromFile(file, options = {}) {
  const extension = getFileExtension(file.name);
  const mimeType = String(file.type || file.mimeType || "").toLowerCase();
  const buffer = toBuffer(file.bytes || file.buffer);
  const budgets = FORMAT_BUDGETS[options.mode] || FORMAT_BUDGETS.cram;

  let rawText = "";
  let handler = "text";

  if (mimeType === "application/pdf" || extension === ".pdf") {
    handler = "pdf";
    rawText = await extractTextFromPdfBuffer(buffer);
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === ".pptx"
  ) {
    handler = "pptx";
    rawText = await extractTextFromPptxBuffer(buffer);
  } else if (mimeType.startsWith("image/")) {
    handler = "image";
    rawText = await summarizeImageForStudy({
      name: file.name,
      mimeType: mimeType || "image/png",
      buffer,
    });
  } else {
    rawText = extractTextFromPlainBuffer(buffer);
  }

  if (!rawText) {
    throw new Error(`Couldn't extract useful study text from ${file.name}.`);
  }

  const content =
    handler === "image" ? rawText : compressStudyMaterialText(rawText, budgets);

  if (!content) {
    throw new Error(`Couldn't condense useful study text from ${file.name}.`);
  }

  return {
    name: file.name,
    handler,
    content,
    originalCharacters: normalizeExtractedFileText(rawText).length,
    compressedCharacters: content.length,
    estimatedTokenSavings: Math.max(
      0,
      Math.ceil(normalizeExtractedFileText(rawText).length / 4) -
        Math.ceil(content.length / 4),
    ),
  };
}

async function extractStudyMaterialFiles(files, options = {}) {
  const results = [];

  for (const file of files) {
    results.push(await extractStudyMaterialFromFile(file, options));
  }

  return results;
}

module.exports = {
  compressStudyMaterialText,
  extractStudyMaterialFiles,
  extractStudyMaterialFromFile,
  extractTextFromPptxBuffer,
  normalizeExtractedFileText,
};
