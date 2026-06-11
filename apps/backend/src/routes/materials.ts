import express, { Router, type Request } from "express";
import { ZodError, z } from "zod";

import {
  authorizeClassAccess,
  requireJwtAuth,
  getAuthenticatedUserId,
} from "../middleware/auth";
import {
  deleteMaterial,
  ingestMaterial,
  getMaterialRecordsByIds,
  getMaterialRecordsByClassId,
  syncClassMaterials,
} from "../services/materials";

const materialIdsSchema = z.object({
  classId: z.number().int().positive(),
  materialIds: z.array(z.string().trim().min(1)).default([]),
}).strict();

function readHeaderValue(request: Request, headerName: string): string {
  return String(request.get(headerName) || "").trim();
}

function readClassIdHeader(request: Request): number | null {
  const raw = readHeaderValue(request, "x-class-id");
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readScopeHeader(request: Request): "class_saved" | "request_ephemeral" {
  return readHeaderValue(request, "x-material-scope") === "class_saved"
    ? "class_saved"
    : "request_ephemeral";
}

export const materialsRouter = Router();
materialsRouter.use(requireJwtAuth);

materialsRouter.post(
  "/",
  express.raw({ type: "*/*", limit: "25mb" }),
  async (request, response) => {
    try {
      const classId = readClassIdHeader(request);
      const scope = readScopeHeader(request);
      const filename = readHeaderValue(request, "x-material-name") || "uploaded-file";
      const mimeType = readHeaderValue(request, "x-material-mime-type") || "application/octet-stream";
      const body = request.body instanceof Buffer ? request.body : Buffer.from(request.body || []);

      if (scope === "class_saved") {
        if (!classId) {
          response.status(400).json({ error: "Missing class ID for class-saved material." });
          return;
        }
        const failure = authorizeClassAccess(classId, getAuthenticatedUserId(request));
        if (failure) {
          response.status(failure.status).json({ error: failure.error });
          return;
        }
      }

      const material = await ingestMaterial({
        ownerUserId: getAuthenticatedUserId(request),
        classId,
        filename,
        mimeType,
        bytes: body,
        scope,
      });

      response.status(200).json(material);
    } catch (error) {
      if (error instanceof ZodError) {
        response.status(400).json({
          error: "Invalid material upload payload.",
          details: error.flatten(),
        });
        return;
      }

      response.status(500).json({
        error: error instanceof Error ? error.message : "Material upload failed.",
      });
    }
  },
);

materialsRouter.post(
  "/sync-class",
  express.json({ limit: "25mb" }),
  async (request, response) => {
    try {
      const payload = materialIdsSchema.parse(request.body);
      const failure = authorizeClassAccess(
        payload.classId,
        getAuthenticatedUserId(request),
      );
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
        return;
      }

      const result = await syncClassMaterials(
        payload.classId,
        payload.materialIds,
      );
      response.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        response.status(400).json({
          error: "Invalid class material sync payload.",
          details: error.flatten(),
        });
        return;
      }

      response.status(500).json({
        error: error instanceof Error ? error.message : "Class material sync failed.",
      });
    }
  },
);

materialsRouter.get(
  "/class/:classId",
  async (request, response) => {
    try {
      const classId = Number(request.params.classId);
      if (!Number.isInteger(classId) || classId <= 0) {
        response.status(400).json({ error: "Invalid class ID." });
        return;
      }
      const failure = authorizeClassAccess(classId, getAuthenticatedUserId(request));
      if (failure) {
        response.status(failure.status).json({ error: failure.error });
        return;
      }

      const materials = getMaterialRecordsByClassId(classId);
      response.status(200).json({ materials });
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : "Failed to read class materials.",
      });
    }
  },
);

materialsRouter.delete(
  "/:materialId",
  async (request, response) => {
    try {
      const materialId = String(request.params.materialId || "").trim();
      if (!materialId) {
        response.status(400).json({ error: "Invalid material ID." });
        return;
      }

      const material = getMaterialRecordsByIds([materialId])[0];
      if (!material) {
        response.status(404).json({ error: "Material resource not found." });
        return;
      }

      if (material.classId) {
        const failure = authorizeClassAccess(
          material.classId,
          getAuthenticatedUserId(request),
        );
        if (failure) {
          response.status(failure.status).json({ error: failure.error });
          return;
        }
      }

      const deleted = await deleteMaterial(materialId);
      if (!deleted) {
        response.status(404).json({ error: "Material resource not found." });
        return;
      }

      response.status(200).json({ deleted: true, materialId });
    } catch (error) {
      response.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete material.",
      });
    }
  },
);
