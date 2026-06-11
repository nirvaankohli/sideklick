import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

import OpenAI from "openai";
import type { ResponseFileSearchToolCall, ResponseInputContent } from "openai/resources/responses/responses";

import { getDatabase } from "../db/index.ts";
import type {
  MaterialDerivativeStatus,
  MaterialRecord,
  MaterialScope,
  MaterialSourceKind,
  MaterialSyncState,
  MaterialVisualFidelity,
} from "../type/index.ts";

const require = createRequire(import.meta.url);
const {
  extractStudyMaterialFromFile,
  normalizeExtractedFileText,
} = require("../../../desktop/src/main/study-material.js");

const MATERIAL_STORAGE_ROOT =
  process.env.MATERIAL_STORAGE_ROOT ||
  path.join(os.tmpdir(), "sideklick-materials");
const MATERIAL_OPENAI_PURPOSE = "assistants";
const MATERIAL_OPENAI_IMAGE_PURPOSE = "vision";
const MATERIAL_TTL_HOURS = 24;

let openAIClient: OpenAI | null = null;

type MaterialRow = {
  material_id: string;
  owner_user_id: string | null;
  class_id: number | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  ownership: string;
  scope: MaterialScope;
  source_kind: MaterialSourceKind;
  derivative_status: MaterialDerivativeStatus;
  visual_fidelity: MaterialVisualFidelity;
  sync_state: MaterialSyncState;
  status_text: string;
  openai_file_id: string | null;
  vector_store_id: string | null;
  vector_store_file_id: string | null;
  extracted_text: string | null;
  fallback_text: string | null;
  storage_path: string | null;
  derivative_pdf_path: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MaterialUploadInput = {
  ownerUserId?: string | null;
  classId?: number | null;
  filename: string;
  mimeType: string;
  bytes: Buffer | Uint8Array;
  scope: MaterialScope;
};

export type MaterialUploadResult = MaterialRecord & {
  extractedCharacters: number;
  statusText: string;
};

export type MaterialRoutingMode = "direct" | "file_search" | "inline_only";

export type MaterialRoutingContext = {
  mode: MaterialRoutingMode;
  fileBackedRecords: MaterialRecord[];
  inlineText: string;
  directInputContent: ResponseInputContent[];
  vectorStoreIds: string[];
  statusText: string;
  sourceSummary: string;
};

function ensureStorageDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function getOpenAIClient(): OpenAI | null {
  if (openAIClient) {
    return openAIClient;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || /^(1|true)$/i.test(process.env.DISABLE_OPENAI_MATERIAL_UPLOADS ?? "")) {
    return null;
  }

  openAIClient = new OpenAI({ apiKey });
  return openAIClient;
}

function normalizeBytes(bytes: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

function createMaterialId(): string {
  return crypto.randomUUID();
}

function toHexSha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function getMaterialRootDir(): string {
  return MATERIAL_STORAGE_ROOT;
}

function getMaterialDirectory(materialId: string): string {
  return path.join(getMaterialRootDir(), materialId);
}

function getMaterialRawPath(materialId: string, filename: string): string {
  const safeExtension = path.extname(filename || "").replace(/[^a-z0-9.]/gi, "");
  return path.join(getMaterialDirectory(materialId), `raw${safeExtension || ""}`);
}

function getMaterialPdfPath(materialId: string): string {
  return path.join(getMaterialDirectory(materialId), "converted.pdf");
}

function getMaterialFallbackTextPath(materialId: string): string {
  return path.join(getMaterialDirectory(materialId), "extracted.txt");
}

function toMaterialRecord(row: MaterialRow): MaterialRecord {
  return {
    materialId: row.material_id,
    classId: row.class_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    ownership: "managed_backend",
    scope: row.scope,
    sourceKind: row.source_kind,
    derivativeStatus: row.derivative_status,
    visualFidelity: row.visual_fidelity,
    syncState: row.sync_state,
    statusText: row.status_text,
    openaiFileId: row.openai_file_id,
    vectorStoreId: row.vector_store_id,
    vectorStoreFileId: row.vector_store_file_id,
    extractedText: row.extracted_text,
    fallbackText: row.fallback_text,
    storagePath: row.storage_path,
    derivativePdfPath: row.derivative_pdf_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function getMaterialRowById(materialId: string): MaterialRow | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT *
      FROM materials
      WHERE material_id = ? AND deleted_at IS NULL
    `,
  ).get(materialId) as MaterialRow | undefined;

  return row || null;
}

function getMaterialRowsByIds(materialIds: string[]): MaterialRecord[] {
  return materialIds
    .map((materialId) => getMaterialRowById(materialId))
    .filter((row): row is MaterialRow => Boolean(row))
    .map(toMaterialRecord);
}

function getMaterialSummary(materials: MaterialRecord[]): {
  totalFiles: number;
  pdfFiles: number;
  imageFiles: number;
  fileBytes: number;
  extractedCharacters: number;
} {
  return materials.reduce(
    (summary, material) => {
      summary.totalFiles += 1;
      summary.fileBytes += material.sizeBytes || 0;
      summary.extractedCharacters +=
        material.extractedText?.length ||
        material.fallbackText?.length ||
        0;
      if (material.sourceKind === "image") {
        summary.imageFiles += 1;
      }
      if (material.sourceKind === "pdf" || material.derivativeStatus === "pdf_converted") {
        summary.pdfFiles += 1;
      }
      return summary;
    },
    {
      totalFiles: 0,
      pdfFiles: 0,
      imageFiles: 0,
      fileBytes: 0,
      extractedCharacters: 0,
    },
  );
}

export function shouldUseFileSearchForMaterials(
  materials: MaterialRecord[],
  inlineTextLength = 0,
): boolean {
  const summary = getMaterialSummary(materials);
  return (
    summary.totalFiles > 4 ||
    summary.pdfFiles > 2 ||
    summary.imageFiles > 4 ||
    summary.fileBytes > 20 * 1024 * 1024 ||
    summary.extractedCharacters + inlineTextLength > 18_000
  );
}

export function buildInlineMaterialText(materials: MaterialRecord[]): string {
  return materials
    .map((material) =>
      [
        `--- ${material.filename} ---`,
        material.extractedText || material.fallbackText || "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function buildDirectMaterialInputContent(
  materials: MaterialRecord[],
): ResponseInputContent[] {
  const content: ResponseInputContent[] = [];

  for (const material of materials) {
    if (material.sourceKind === "image" && material.openaiFileId) {
      content.push({
        type: "input_image",
        file_id: material.openaiFileId,
        detail: "auto",
      });
      continue;
    }

    if (
      (material.sourceKind === "pdf" || material.derivativeStatus === "pdf_converted") &&
      material.openaiFileId
    ) {
      content.push({
        type: "input_file",
        file_id: material.openaiFileId,
        detail: "high",
      });
      continue;
    }

    const inlineText =
      material.extractedText ||
      material.fallbackText ||
      "";
    if (inlineText.trim()) {
      content.push({
        type: "input_text",
        text: [
          `Material: ${material.filename}`,
          inlineText.trim(),
        ].join("\n"),
      });
    }
  }

  return content;
}

export function materialSearchResultsToText(
  results: Array<ResponseFileSearchToolCall.Result> | null | undefined,
): string {
  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  return results
    .map((result, index) =>
      [
        `Result ${index + 1}: ${result.filename || result.file_id || "file"}`,
        result.text || "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
    .trim();
}

function findExistingMaterialByHash(params: {
  classId?: number | null;
  scope: MaterialScope;
  sha256: string;
}): MaterialRow | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT *
      FROM materials
      WHERE deleted_at IS NULL
        AND sha256 = @sha256
        AND scope = @scope
        AND COALESCE(class_id, -1) = COALESCE(@classId, -1)
        AND ownership = 'managed_backend'
      LIMIT 1
    `,
  ).get({
    sha256: params.sha256,
    scope: params.scope,
    classId: params.classId ?? null,
  }) as MaterialRow | undefined;

  return row || null;
}

function upsertMaterialRow(input: {
  materialId: string;
  ownerUserId?: string | null;
  classId?: number | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  scope: MaterialScope;
  sourceKind: MaterialSourceKind;
  derivativeStatus: MaterialDerivativeStatus;
  visualFidelity: MaterialVisualFidelity;
  syncState: MaterialSyncState;
  statusText: string;
  openaiFileId?: string | null;
  vectorStoreId?: string | null;
  vectorStoreFileId?: string | null;
  extractedText?: string | null;
  fallbackText?: string | null;
  storagePath?: string | null;
  derivativePdfPath?: string | null;
  expiresAt?: string | null;
}): MaterialRecord {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO materials (
        material_id,
        owner_user_id,
        class_id,
        filename,
        mime_type,
        size_bytes,
        sha256,
        ownership,
        scope,
        source_kind,
        derivative_status,
        visual_fidelity,
        sync_state,
        status_text,
        openai_file_id,
        vector_store_id,
        vector_store_file_id,
        extracted_text,
        fallback_text,
        storage_path,
        derivative_pdf_path,
        expires_at,
        updated_at
      ) VALUES (
        @materialId,
        @ownerUserId,
        @classId,
        @filename,
        @mimeType,
        @sizeBytes,
        @sha256,
        'managed_backend',
        @scope,
        @sourceKind,
        @derivativeStatus,
        @visualFidelity,
        @syncState,
        @statusText,
        @openaiFileId,
        @vectorStoreId,
        @vectorStoreFileId,
        @extractedText,
        @fallbackText,
        @storagePath,
        @derivativePdfPath,
        @expiresAt,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(material_id) DO UPDATE SET
        owner_user_id = excluded.owner_user_id,
        class_id = excluded.class_id,
        filename = excluded.filename,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        sha256 = excluded.sha256,
        scope = excluded.scope,
        source_kind = excluded.source_kind,
        derivative_status = excluded.derivative_status,
        visual_fidelity = excluded.visual_fidelity,
        sync_state = excluded.sync_state,
        status_text = excluded.status_text,
        openai_file_id = excluded.openai_file_id,
        vector_store_id = excluded.vector_store_id,
        vector_store_file_id = excluded.vector_store_file_id,
        extracted_text = excluded.extracted_text,
        fallback_text = excluded.fallback_text,
        storage_path = excluded.storage_path,
        derivative_pdf_path = excluded.derivative_pdf_path,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run({
    ...input,
    ownerUserId: input.ownerUserId ?? null,
    classId: input.classId ?? null,
    openaiFileId: input.openaiFileId ?? null,
    vectorStoreId: input.vectorStoreId ?? null,
    vectorStoreFileId: input.vectorStoreFileId ?? null,
    extractedText: input.extractedText ?? null,
    fallbackText: input.fallbackText ?? null,
    storagePath: input.storagePath ?? null,
    derivativePdfPath: input.derivativePdfPath ?? null,
    expiresAt: input.expiresAt ?? null,
  });

  const row = getMaterialRowById(input.materialId);
  if (!row) {
    throw new Error("Failed to persist material record.");
  }

  return toMaterialRecord(row);
}

function readTextLikeContent(result: Awaited<ReturnType<typeof extractStudyMaterialFromFile>>) {
  return normalizeExtractedFileText(result.content || "");
}

async function writeBufferToFile(filePath: string, bytes: Buffer): Promise<void> {
  ensureStorageDir(filePath);
  await fs.promises.writeFile(filePath, bytes);
}

async function convertPptxToPdfBuffer(sourcePath: string): Promise<Buffer> {
  const candidateCommands = ["soffice", "libreoffice"];
  const outputDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "sideklick-pptx-"));

  for (const command of candidateCommands) {
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(command, [
          "--headless",
          "--convert-to",
          "pdf",
          "--outdir",
          outputDir,
          sourcePath,
        ]);

        let stderr = "";
        child.stderr.on("data", (chunk) => {
          stderr += String(chunk);
        });
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
            return;
          }
          reject(new Error(stderr.trim() || `Office conversion failed with exit code ${code}.`));
        });
      });

      const pdfPath = path.join(outputDir, `${path.parse(sourcePath).name}.pdf`);
      return await fs.promises.readFile(pdfPath);
    } catch {
      // Try the next command.
    }
  }

  throw new Error("No headless office converter was available.");
}

async function uploadFileToOpenAI(params: {
  filePath: string;
  filename: string;
  purpose?: "assistants" | "vision";
}): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const file = await client.files.create({
      file: fs.createReadStream(params.filePath),
      purpose: params.purpose ?? MATERIAL_OPENAI_PURPOSE,
    });
    return file.id;
  } catch {
    return null;
  }
}

async function attachFileToVectorStore(
  vectorStoreId: string,
  fileId: string,
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const batch = await client.vectorStores.fileBatches.createAndPoll(vectorStoreId, {
      file_ids: [fileId],
    });
    const batchFiles = await client.vectorStores.fileBatches.listFiles(batch.id, {
      vector_store_id: vectorStoreId,
    });
    const attachedFile = batchFiles.data[0];
    return attachedFile?.id ?? null;
  } catch {
    return null;
  }
}

async function ensureClassVectorStore(classId: number): Promise<string | null> {
  const db = getDatabase();
  const existing = db.prepare(
    `
      SELECT material_vector_store_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(classId) as { material_vector_store_id: string | null } | undefined;

  if (existing?.material_vector_store_id) {
    return existing.material_vector_store_id;
  }

  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const vectorStore = await client.vectorStores.create({
      name: `Class ${classId} materials`,
      metadata: {
        class_id: String(classId),
        scope: "class_saved",
      },
    });

    db.prepare(
      `
        UPDATE classes
        SET material_vector_store_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    ).run(vectorStore.id, classId);

    return vectorStore.id;
  } catch {
    return null;
  }
}

async function updateMaterialVectorStoreLink(
  materialId: string,
  vectorStoreId: string,
  vectorStoreFileId: string | null,
): Promise<void> {
  const db = getDatabase();
  db.prepare(
    `
      UPDATE materials
      SET
        vector_store_id = ?,
        vector_store_file_id = ?,
        sync_state = 'synced',
        updated_at = CURRENT_TIMESTAMP
      WHERE material_id = ?
    `,
  ).run(vectorStoreId, vectorStoreFileId, materialId);
}

async function buildExtractedTextForBytes(input: MaterialUploadInput & {
  materialId: string;
  rawPath: string;
}): Promise<{
  sourceKind: MaterialSourceKind;
  derivativeStatus: MaterialDerivativeStatus;
  visualFidelity: MaterialVisualFidelity;
  extractedText: string;
  statusText: string;
  derivativePdfPath: string | null;
  openaiFileId: string | null;
}> {
  const buffer = normalizeBytes(input.bytes);
  const extension = path.extname(input.filename || "").toLowerCase();
  const mimeType = String(input.mimeType || "").toLowerCase();
  const isPptx =
    extension === ".pptx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const isPdf = extension === ".pdf" || mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");

  let sourceKind: MaterialSourceKind = "text";
  let derivativeStatus: MaterialDerivativeStatus = "raw";
  let visualFidelity: MaterialVisualFidelity = "full";
  let extractedText = "";
  let statusText = "visual fidelity preserved";
  let derivativePdfPath: string | null = null;
  let openaiFileId: string | null = null;
  const rawPath = input.rawPath;

  try {
    if (isPptx) {
      sourceKind = "pptx";
      try {
        const pdfBuffer = await convertPptxToPdfBuffer(rawPath);
        derivativeStatus = "pdf_converted";
        derivativePdfPath = getMaterialPdfPath(input.materialId);
        await writeBufferToFile(derivativePdfPath, pdfBuffer);
        const pdfExtraction = await extractStudyMaterialFromFile(
          {
            name: path.basename(derivativePdfPath),
            type: "application/pdf",
            bytes: pdfBuffer,
          },
          { mode: "cram" },
        );
        extractedText = readTextLikeContent(pdfExtraction);
        openaiFileId = await uploadFileToOpenAI({
          filePath: derivativePdfPath,
          filename: input.filename.replace(/\.pptx?$/i, ".pdf"),
          purpose: MATERIAL_OPENAI_PURPOSE,
        });
        statusText = "converted to PDF";
      } catch {
        const fallbackExtraction = await extractStudyMaterialFromFile(
          {
            name: input.filename,
            type: input.mimeType,
            bytes: buffer,
          },
          { mode: "cram" },
        );
        extractedText = readTextLikeContent(fallbackExtraction);
        derivativeStatus = "text_fallback";
        visualFidelity = "text_only_fallback";
        statusText = "fell back to text extraction";
      }
    } else if (isPdf) {
      sourceKind = "pdf";
      const pdfExtraction = await extractStudyMaterialFromFile(
        {
          name: input.filename,
          type: input.mimeType,
          bytes: buffer,
        },
        { mode: "cram" },
      );
      extractedText = readTextLikeContent(pdfExtraction);
      openaiFileId = await uploadFileToOpenAI({
        filePath: rawPath,
        filename: input.filename,
        purpose: MATERIAL_OPENAI_PURPOSE,
      });
    } else if (isImage) {
      sourceKind = "image";
      const imageExtraction = await extractStudyMaterialFromFile(
        {
          name: input.filename,
          type: input.mimeType,
          bytes: buffer,
        },
        { mode: "quiz" },
      );
      extractedText = readTextLikeContent(imageExtraction);
      openaiFileId = await uploadFileToOpenAI({
        filePath: rawPath,
        filename: input.filename,
        purpose: MATERIAL_OPENAI_IMAGE_PURPOSE,
      });
    } else {
      sourceKind = "text";
      const textExtraction = await extractStudyMaterialFromFile(
        {
          name: input.filename,
          type: input.mimeType || "text/plain",
          bytes: buffer,
        },
        { mode: "cram" },
      );
      extractedText = readTextLikeContent(textExtraction);
      openaiFileId = await uploadFileToOpenAI({
        filePath: rawPath,
        filename: input.filename,
        purpose: MATERIAL_OPENAI_PURPOSE,
      });
    }
  } catch (error) {
    extractedText = normalizeExtractedFileText(buffer.toString("utf8"));
    derivativeStatus = "text_fallback";
    visualFidelity = "text_only_fallback";
    statusText = "fell back to text extraction";
    if (error instanceof Error) {
      console.warn("[materials] extraction failed", error.message);
    }
  }

  return {
    sourceKind,
    derivativeStatus,
    visualFidelity,
    extractedText,
    statusText,
    derivativePdfPath,
    openaiFileId,
  };
}

export async function ingestMaterial(input: MaterialUploadInput): Promise<MaterialUploadResult> {
  const bytes = normalizeBytes(input.bytes);
  const sha256 = toHexSha256(bytes);
  const existing = findExistingMaterialByHash({
    classId: input.classId ?? null,
    scope: input.scope,
    sha256,
  });

  if (existing) {
    return {
      ...toMaterialRecord(existing),
      extractedCharacters: existing.extracted_text
        ? existing.extracted_text.length
        : 0,
      statusText: existing.status_text,
    };
  }

  const materialId = createMaterialId();
  const materialDir = getMaterialDirectory(materialId);
  fs.mkdirSync(materialDir, { recursive: true });
  const rawPath = getMaterialRawPath(materialId, input.filename);
  await writeBufferToFile(rawPath, bytes);

  const textDetails = await buildExtractedTextForBytes({
    ...input,
    bytes,
    materialId,
    rawPath,
  });

  const expiresAt =
    input.scope === "request_ephemeral"
      ? new Date(Date.now() + MATERIAL_TTL_HOURS * 60 * 60 * 1000).toISOString()
      : null;

  const persisted = upsertMaterialRow({
    materialId,
    ownerUserId: input.ownerUserId ?? null,
    classId: input.classId ?? null,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: bytes.byteLength,
    sha256,
    scope: input.scope,
    sourceKind: textDetails.sourceKind,
    derivativeStatus: textDetails.derivativeStatus,
    visualFidelity: textDetails.visualFidelity,
    syncState: "pending",
    statusText: textDetails.statusText,
    openaiFileId: textDetails.openaiFileId,
    extractedText: textDetails.extractedText,
    fallbackText: textDetails.visualFidelity === "text_only_fallback" ? textDetails.extractedText : null,
    storagePath: rawPath,
    derivativePdfPath: textDetails.derivativePdfPath,
    expiresAt,
  });

  if (input.scope === "class_saved" && input.classId) {
    const vectorStoreId = await ensureClassVectorStore(input.classId);
    if (vectorStoreId && persisted.openaiFileId) {
      const vectorStoreFileId = await attachFileToVectorStore(
        vectorStoreId,
        persisted.openaiFileId,
      );
      if (vectorStoreFileId) {
        await updateMaterialVectorStoreLink(
          persisted.materialId,
          vectorStoreId,
          vectorStoreFileId,
        );
      }
      const refreshed = getMaterialRowById(persisted.materialId);
      if (refreshed) {
        return {
          ...toMaterialRecord(refreshed),
          extractedCharacters: textDetails.extractedText.length,
          statusText: textDetails.statusText,
        };
      }
    }
  }

  return {
    ...persisted,
    syncState: input.scope === "class_saved" && persisted.openaiFileId ? "pending" : persisted.syncState,
    extractedCharacters: textDetails.extractedText.length,
    statusText: textDetails.statusText,
  };
}

export function getMaterialRecordsByIds(materialIds: string[]): MaterialRecord[] {
  return getMaterialRowsByIds(materialIds);
}

export function getMaterialRecordsByClassId(classId: number): MaterialRecord[] {
  const db = getDatabase();
  const rows = db.prepare(
    `
      SELECT *
      FROM materials
      WHERE class_id = ? AND deleted_at IS NULL
      ORDER BY created_at ASC
    `,
  ).all(classId) as MaterialRow[];

  return rows.map(toMaterialRecord);
}

export function getClassMaterialVectorStoreId(classId: number): string | null {
  const db = getDatabase();
  const row = db.prepare(
    `
      SELECT material_vector_store_id
      FROM classes
      WHERE id = ?
      LIMIT 1
    `,
  ).get(classId) as { material_vector_store_id: string | null } | undefined;

  return row?.material_vector_store_id ?? null;
}

export async function createEphemeralMaterialVectorStore(
  materials: MaterialRecord[],
  label: string,
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  const fileIds = materials
    .map((material) => material.openaiFileId)
    .filter((fileId): fileId is string => Boolean(fileId));

  if (fileIds.length === 0) {
    return null;
  }

  try {
    const vectorStore = await client.vectorStores.create({
      name: label,
      expires_after: {
        anchor: "last_active_at",
        days: 1,
      },
      file_ids: fileIds,
      metadata: {
        scope: "request_ephemeral",
      },
    });
    return vectorStore.id;
  } catch {
    return null;
  }
}

export async function retrieveMaterialEvidence(params: {
  client: OpenAI;
  model: string;
  vectorStoreIds: string[];
  query: string;
  featureLabel: string;
}): Promise<{
  responseId: string;
  results: Array<ResponseFileSearchToolCall.Result>;
  text: string;
}> {
  const response = await params.client.responses.create({
    model: params.model,
    input: [
      {
        role: "system",
        content: [
          "You are a retrieval helper for study material analysis.",
          "Use file search to find the most relevant evidence snippets only.",
          "Do not generate the final answer.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: params.query,
          },
        ],
      },
    ],
    tools: [
      {
        type: "file_search",
        vector_store_ids: params.vectorStoreIds,
        max_num_results: 8,
      },
    ],
    tool_choice: {
      type: "file_search",
    },
    include: ["file_search_call.results"],
    metadata: {
      feature: params.featureLabel,
    },
    max_output_tokens: 16,
    store: false,
  });

  const results: Array<ResponseFileSearchToolCall.Result> = [];
  for (const item of response.output || []) {
    if (item && typeof item === "object" && item.type === "file_search_call") {
      results.push(...((item.results || []) as Array<ResponseFileSearchToolCall.Result>));
    }
  }

  return {
    responseId: response.id,
    results,
    text: materialSearchResultsToText(results),
  };
}

export async function syncClassMaterials(
  classId: number,
  materialIds: string[],
): Promise<{
  vectorStoreId: string | null;
  materials: MaterialRecord[];
}> {
  const db = getDatabase();
  const vectorStoreId = await ensureClassVectorStore(classId);
  const materials = getMaterialRecordsByIds(materialIds);
  if (!vectorStoreId) {
    return { vectorStoreId: null, materials };
  }

  for (const material of materials) {
    if (!material.openaiFileId) {
      continue;
    }

    const vectorStoreFileId = await attachFileToVectorStore(
      vectorStoreId,
      material.openaiFileId,
    );
    if (!vectorStoreFileId) {
      continue;
    }

    await updateMaterialVectorStoreLink(
      material.materialId,
      vectorStoreId,
      vectorStoreFileId,
    );
  }

  db.prepare(
    `
      UPDATE classes
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(classId);

  return {
    vectorStoreId,
    materials: getMaterialRecordsByIds(materialIds),
  };
}

export async function deleteMaterial(materialId: string): Promise<boolean> {
  const db = getDatabase();
  const material = getMaterialRowById(materialId);
  if (!material) {
    return false;
  }

  if (material.vector_store_id && material.vector_store_file_id) {
    const client = getOpenAIClient();
    if (client) {
      try {
        await client.vectorStores.files.delete(material.vector_store_file_id, {
          vector_store_id: material.vector_store_id,
        });
      } catch {
        // Best-effort cleanup; the material record still gets deleted locally.
      }
    }
  }

  if (material.openai_file_id) {
    const client = getOpenAIClient();
    if (client) {
      try {
        await client.files.delete(material.openai_file_id);
      } catch {
        // Best-effort cleanup.
      }
    }
  }

  db.prepare(
    `
      UPDATE materials
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE material_id = ?
    `,
  ).run(materialId);

  return true;
}

export function buildMaterialExpiryCutoff(now = Date.now()): string {
  return new Date(now - MATERIAL_TTL_HOURS * 60 * 60 * 1000).toISOString();
}
