"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { linkEvidenceToCase, saveEvidence } from "@/lib/persistence/repository";
import { storeEvidenceFile } from "@/lib/storage/evidence";
import {
  mapEvidenceRowsToRecords,
} from "@/lib/workbench-data";
import type {
  EvidenceRecord,
  EvidenceStatus,
  EvidenceStorageState,
  ImportSourceType,
  ImportWorkspaceAssignment,
} from "@/lib/mock-data";

type SaveEvidenceUploadResult = {
  evidenceRecord: EvidenceRecord;
  persisted: boolean;
  storageState: EvidenceStorageState;
  storageNote: string;
};

function readString(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function readFile(formData: FormData) {
  const candidate = formData.get("file");

  return candidate instanceof File && candidate.size > 0 ? candidate : null;
}

function toEvidenceType(sourceType: ImportSourceType): EvidenceRecord["type"] {
  switch (sourceType) {
    case "manual-note":
      return "note";
    case "screenshot-placeholder":
      return "screenshot";
    case "document-placeholder":
      return "document";
    case "eml-placeholder":
      return "eml-placeholder";
    case "pasted-email":
    default:
      return "email";
  }
}

function formatEvidenceDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export async function saveEvidenceUploadAction(formData: FormData): Promise<SaveEvidenceUploadResult> {
  const redirectTarget = readString(formData, "redirectTo", "/import");
  await requireWritableAccess(redirectTarget);

  const mode = readString(formData, "mode", "import");
  const title = readString(formData, "title", "Untitled evidence");
  const sourceType = readString(formData, "sourceType", "document-placeholder") as ImportSourceType;
  const workspaceAssignment = readString(formData, "workspaceAssignment", "Import/Staging") as ImportWorkspaceAssignment;
  const status = readString(formData, "status", "Pending") as EvidenceStatus;
  const description = readString(formData, "description", "No description captured yet.");
  const linkedIntakeItemRef = readString(formData, "linkedIntakeItemRef", "Evidence intake placeholder");
  const linkedCaseRef = readString(formData, "linkedCaseRef", "Evidence case placeholder");
  const linkedCaseId = mode === "case" ? readString(formData, "linkedCaseId", "") || null : null;
  const sourceLabel = readString(formData, "sourceLabel", mode === "case" ? "Case attachment" : "Import staging");
  const file = readFile(formData);

  const storageOutcome = await storeEvidenceFile({
    file,
    title,
    sourceType,
    workspaceAssignment,
    linkedCaseId,
    sourceLabel,
  });

  const createdAt = storageOutcome.uploadedAt ?? new Date().toISOString();
  const savedEvidence = await saveEvidence({
    title,
    type: toEvidenceType(sourceType),
    source: sourceLabel,
    date: formatEvidenceDateTime(createdAt),
    description,
    status,
    case_id: mode === "case" ? linkedCaseId : null,
    storage_state: storageOutcome.storageState,
    source_type: sourceType,
    workspace_assignment: workspaceAssignment,
    linked_intake_item_ref: linkedIntakeItemRef || null,
    linked_case_ref: linkedCaseRef || null,
    original_filename: storageOutcome.originalFilename,
    file_size_bytes: storageOutcome.fileSizeBytes,
    storage_bucket: storageOutcome.storageBucket,
    storage_path: storageOutcome.storagePath,
    mime_type: storageOutcome.mimeType,
    uploaded_at: storageOutcome.uploadedAt,
  });

  if (mode === "case" && savedEvidence.row.case_id) {
    await linkEvidenceToCase(savedEvidence.row.case_id, savedEvidence.row.evidence_id);
  }

  const evidenceRecord = mapEvidenceRowsToRecords([savedEvidence.row])[0] as EvidenceRecord;

  return {
    evidenceRecord,
    persisted: savedEvidence.persisted,
    storageState: storageOutcome.storageState,
    storageNote: storageOutcome.storageNote,
  };
}
