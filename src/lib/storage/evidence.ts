import "server-only";

import { randomUUID } from "node:crypto";
import { createPersistenceClient } from "@/lib/persistence/client";
import { getPersistenceConfig, hasEvidenceStorageConfig } from "@/lib/persistence/config";
import type {
  EvidenceStorageState,
  ImportSourceType,
  ImportWorkspaceAssignment,
} from "@/lib/mock-data";

export type EvidenceUploadInput = {
  file: File | null;
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  linkedCaseId: string | null;
  sourceLabel: string;
};

export type EvidenceStorageOutcome = {
  storageState: EvidenceStorageState;
  storageBucket: string | null;
  storagePath: string | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
  storageNote: string;
};

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64) || "general";
}

function buildStoragePath(input: EvidenceUploadInput, originalFilename: string) {
  const now = new Date();
  const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");
  const workspaceSegment = sanitizeSegment(input.workspaceAssignment);
  const caseSegment = input.linkedCaseId ? sanitizeSegment(input.linkedCaseId) : "staging";
  const sourceSegment = sanitizeSegment(input.sourceLabel);
  const titleSegment = sanitizeSegment(input.title);
  const fileSegment = sanitizeSegment(originalFilename);

  return [
    workspaceSegment,
    caseSegment,
    sourceSegment,
    titleSegment,
    datePrefix,
    `${Date.now()}-${randomUUID()}-${fileSegment}`,
  ].join("/");
}

function fallbackOutcome(note: string, file: File | null, storageState: EvidenceStorageState): EvidenceStorageOutcome {
  return {
    storageState,
    storageBucket: null,
    storagePath: null,
    originalFilename: file?.name ?? null,
    fileSizeBytes: file?.size ?? null,
    mimeType: file?.type || null,
    uploadedAt: null,
    storageNote: note,
  };
}

export async function storeEvidenceFile(input: EvidenceUploadInput): Promise<EvidenceStorageOutcome> {
  if (!input.file) {
    return fallbackOutcome(
      "No file was attached, so the evidence was saved as metadata only.",
      null,
      "metadata-only",
    );
  }

  if (!hasEvidenceStorageConfig()) {
    return fallbackOutcome(
      "Private storage is not configured, so the file remains a staged prototype only.",
      input.file,
      "fallback-prototype",
    );
  }

  const { evidenceBucketName } = getPersistenceConfig();
  const bucketName = evidenceBucketName?.trim() || null;

  if (!bucketName) {
    return fallbackOutcome(
      "The evidence bucket name is missing, so the file remains a staged prototype only.",
      input.file,
      "fallback-prototype",
    );
  }

  const client = createPersistenceClient();
  const originalFilename = input.file.name || "untitled-upload.bin";
  const path = buildStoragePath(input, originalFilename);

  try {
    const { error } = await client.storage.from(bucketName).upload(path, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return fallbackOutcome(
        "Private storage upload failed, so the file remains staged as a prototype.",
        input.file,
        "fallback-prototype",
      );
    }

    return {
      storageState: "uploaded",
      storageBucket: bucketName,
      storagePath: path,
      originalFilename,
      fileSizeBytes: input.file.size,
      mimeType: input.file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      storageNote: "Uploaded to the private evidence bucket.",
    };
  } catch {
    return fallbackOutcome(
      "Private storage is unavailable, so the file remains a staged prototype only.",
      input.file,
      "fallback-prototype",
    );
  }
}
