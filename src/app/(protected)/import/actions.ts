"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { saveIntakeItem } from "@/lib/persistence/repository";
import { buildIntakeItemFromSubmission, mapIntakeRowsToItems, type IntakeSubmission } from "@/lib/workbench-data";
import type { IntakeItemRow } from "@/lib/persistence/types";
import { processBulkEvidenceIntake } from "@/lib/bulk-evidence/processor";
import type {
  BulkEvidenceActionResult,
  BulkEvidenceBatchMode,
  BulkEvidenceBatchOutcome,
  BulkEvidenceBatchStatus,
  BulkEvidenceBatchSummary,
} from "@/lib/bulk-evidence/types";
import type { ImportWorkspaceAssignment } from "@/lib/mock-data";

type SaveIntakeItemResult = {
  item: ReturnType<typeof buildIntakeItemFromSubmission>;
  persisted: boolean;
};

function rowToItem(row: IntakeItemRow) {
  return mapIntakeRowsToItems([row])[0] ?? buildIntakeItemFromSubmission({
    title: row.subject_title,
    sourceType: row.source_type as IntakeSubmission["sourceType"],
    workspaceAssignment: row.workspace_assignment as IntakeSubmission["workspaceAssignment"],
    status: row.status as IntakeSubmission["status"],
    senderSource: row.sender_source,
    dateTime: row.received_at,
    bodyContent: row.body_content,
    tags: row.tags.join(", "),
  });
}

export async function saveIntakeItemAction(
  submission: IntakeSubmission,
): Promise<SaveIntakeItemResult> {
  await requireWritableAccess("/import");

  const persistedRow = await saveIntakeItem({
    subject_title: submission.title,
    source_type: submission.sourceType,
    workspace_assignment: submission.workspaceAssignment,
    status: submission.status,
    sender_source: submission.senderSource,
    received_at: submission.dateTime,
    body_content: submission.bodyContent,
    tags: submission.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    route_note:
      submission.workspaceAssignment === "Import/Staging"
        ? "Still staged for manual classification."
        : `Simulated assignment to ${submission.workspaceAssignment}.`,
    created_from_label: `Created from ${submission.sourceType.replace(/-/g, " ")}`,
  });

  return {
    item: rowToItem(persistedRow.row),
    persisted: persistedRow.persisted,
  };
}

function emptyActionSummary(): BulkEvidenceActionResult["summary"] {
  return {
    totalFiles: 0,
    parsedEml: 0,
    evidenceOnly: 0,
    preservationOnly: 0,
    unsupported: 0,
    failed: 0,
    warnings: 0,
    skipped: 0,
    parsedSuccessfully: 0,
  };
}

function mapBatchStatus(status: BulkEvidenceBatchStatus): BulkEvidenceActionResult["status"] {
  return status;
}

function sourceExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "none";
}

function structuredBulkFailure(
  message: string,
  diagnostics?: BulkEvidenceBatchOutcome["diagnostics"],
): BulkEvidenceActionResult {
  return {
    ok: false,
    batchId: "",
    status: "failed",
    batchStatus: "failed",
    summary: emptyActionSummary(),
    note: message,
    message,
    warnings: [message],
    items: [],
    diagnostics: diagnostics ?? {
      fileCountReceived: 0,
      extensionsReceived: [],
      acceptedCount: 0,
      parsedCount: 0,
      evidenceOnlyCount: 0,
      preservationOnlyCount: 0,
      unsupportedCount: 0,
      failedCount: 0,
      failureStage: "system",
      errorCode: "UNEXPECTED_RESPONSE",
    },
  };
}

function toActionSummary(summary: BulkEvidenceBatchSummary): BulkEvidenceActionResult["summary"] {
  return {
    totalFiles: summary.totalFiles,
    parsedEml: summary.parsedSuccessfully,
    parsedSuccessfully: summary.parsedSuccessfully,
    evidenceOnly: summary.evidenceOnly,
    preservationOnly: summary.preservationOnly,
    unsupported: summary.unsupported,
    failed: summary.failed,
    warnings: summary.warnings,
    skipped: summary.skipped,
  };
}

function toActionItems(outcome: BulkEvidenceBatchOutcome): BulkEvidenceActionResult["items"] {
  return (outcome.items ?? []).map((item) => ({
    fileName: item.fileName,
    extension: sourceExtension(item.sourcePathInArchive ?? item.fileName),
    status: item.status,
    message: item.note,
    sourcePathInArchive: item.sourcePathInArchive,
    sourceKind: item.sourceKind,
    note: item.note,
  }));
}

function toActionResult(outcome: BulkEvidenceBatchOutcome): BulkEvidenceActionResult {
  return {
    ok: outcome.batchStatus !== "failed",
    batchId: outcome.batchId,
    status: mapBatchStatus(outcome.batchStatus),
    batchStatus: outcome.batchStatus,
    summary: toActionSummary(outcome.summary),
    note: outcome.note,
    message: outcome.note,
    warnings: outcome.warnings,
    items: toActionItems(outcome),
    diagnostics: outcome.diagnostics,
  };
}

function readString(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function readFiles(formData: FormData) {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function processBulkEvidenceIntakeAction(
  formData: FormData,
): Promise<BulkEvidenceActionResult> {
  const redirectTarget = readString(formData, "redirectTo", "/import");
  await requireWritableAccess(redirectTarget);

  const files = readFiles(formData);
  const batchMode = readString(formData, "batchMode", "zip-of-emls") as BulkEvidenceBatchMode;
  const workspaceAssignment = readString(formData, "workspaceAssignment", "Import/Staging") as ImportWorkspaceAssignment;
  const sourceLabel = readString(formData, "sourceLabel", "Bulk Outlook evidence intake");
  const notes = readString(formData, "notes", "");
  const linkedCaseId = readString(formData, "linkedCaseId", "") || null;
  const linkedAssuranceSignalId = readString(formData, "linkedAssuranceSignalId", "") || null;
  const linkedVesselSupportItemId = readString(formData, "linkedVesselSupportItemId", "") || null;

  try {
    const outcome = await processBulkEvidenceIntake({
      files,
      batchMode,
      workspaceAssignment,
      sourceLabel,
      notes,
      linkedCaseId,
      linkedAssuranceSignalId,
      linkedVesselSupportItemId,
    });

    return toActionResult(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk evidence intake failed.";
    return structuredBulkFailure(message);
  }
}
