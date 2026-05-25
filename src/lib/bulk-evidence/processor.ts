import "server-only";

import { randomUUID } from "node:crypto";
import {
  appendAuditLog,
  getCaseById,
  linkEvidenceToCase,
  saveBulkEvidenceBatch,
  saveBulkEvidenceBatchItem,
  saveEvidence,
} from "@/lib/persistence/repository";
import { storeEvidenceFile } from "@/lib/storage/evidence";
import { ingestEmlEvidence } from "@/lib/email-ingestion/ingest";
import type { ImportWorkspaceAssignment } from "@/lib/mock-data";
import type { BulkEvidenceBatchItemRow, BulkEvidenceBatchRow } from "@/lib/persistence/types";
import {
  extractZipEntries,
} from "./zip";
import type {
  BulkEvidenceBatchOutcome,
  BulkEvidenceBatchStatus,
  BulkEvidenceIntakeRequest,
  BulkEvidenceItemStatus,
  BulkEvidenceSourceKind,
  BulkEvidenceBatchSummary,
} from "./types";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_EML_FILES_PER_BATCH = 200;
const MAX_SINGLE_EML_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_EXTRACTED_EML_BYTES = 100 * 1024 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function isZipFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";
}

function isPstFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pst") || file.type === "application/vnd.ms-outlook";
}

function isEmlFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".eml") || file.type === "message/rfc822";
}

function isDocumentFile(file: File) {
  const name = file.name.toLowerCase();

  return (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function evidenceDescription(sourceLabel: string, note: string, pathInArchive?: string | null) {
  const parts = [
    `Imported via ${sourceLabel}.`,
    pathInArchive ? `Archive path: ${pathInArchive}.` : null,
    note ? `Note: ${note}` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

function sourceKindForFile(file: File): BulkEvidenceSourceKind {
  if (isZipFile(file)) {
    return "zip";
  }

  if (isPstFile(file)) {
    return "pst";
  }

  if (isEmlFile(file)) {
    return "eml";
  }

  if (isDocumentFile(file)) {
    return "document";
  }

  return "unsupported";
}

function batchStatusFromSummary(summary: BulkEvidenceBatchSummary, fatalError: boolean): BulkEvidenceBatchStatus {
  if (fatalError) {
    return "failed";
  }

  if (summary.failed > 0 || summary.skipped > 0 || summary.unsupported > 0 || summary.warnings > 0) {
    return summary.parsedSuccessfully > 0 ? "completed_with_warnings" : "completed_with_warnings";
  }

  return "completed";
}

async function saveFileAsEvidence(input: {
  file: File;
  title: string;
  sourceType: "document-placeholder" | "eml-placeholder";
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  description: string;
  linkedCaseId: string | null;
  linkedCaseRef: string | null;
  linkedIntakeItemRef: string;
}) {
  const storageOutcome = await storeEvidenceFile({
    file: input.file,
    title: input.title,
    sourceType: input.sourceType,
    workspaceAssignment: input.workspaceAssignment,
    linkedCaseId: input.linkedCaseId,
    sourceLabel: input.sourceLabel,
  });

  const savedEvidence = await saveEvidence({
    title: input.title,
    type: input.sourceType === "eml-placeholder" ? "email" : "document",
    source: input.sourceLabel,
    date: storageOutcome.uploadedAt ?? nowIso(),
    description: input.description,
    status: "Pending",
    case_id: input.linkedCaseId,
    storage_state: storageOutcome.storageState,
    source_type: input.sourceType,
    workspace_assignment: input.workspaceAssignment,
    linked_intake_item_ref: input.linkedIntakeItemRef,
    linked_case_ref: input.linkedCaseRef,
    original_filename: storageOutcome.originalFilename,
    file_size_bytes: storageOutcome.fileSizeBytes,
    storage_bucket: storageOutcome.storageBucket,
    storage_path: storageOutcome.storagePath,
    mime_type: storageOutcome.mimeType,
    uploaded_at: storageOutcome.uploadedAt,
  });

  if (input.linkedCaseId) {
    await linkEvidenceToCase(input.linkedCaseId, savedEvidence.row.evidence_id);
  }

  return {
    evidenceRow: savedEvidence.row,
    persisted: savedEvidence.persisted,
    storageOutcome,
  };
}

async function processArchiveEntry(input: {
  archiveFile: File;
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  batchId: string;
  linkedCaseId: string | null;
  linkedCaseRef: string | null;
}) {
  const description = evidenceDescription(
    input.sourceLabel,
    "ZIP archive preserved as evidence only before extracting EML entries.",
  );

  return await saveFileAsEvidence({
    file: input.archiveFile,
    title: `Bulk archive: ${input.archiveFile.name}`,
    sourceType: "document-placeholder",
    workspaceAssignment: input.workspaceAssignment,
    sourceLabel: `${input.sourceLabel} archive`,
    description,
    linkedCaseId: input.linkedCaseId,
    linkedCaseRef: input.linkedCaseRef,
    linkedIntakeItemRef: `Bulk batch ${input.batchId}`,
  });
}

async function processPstArchive(input: {
  file: File;
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  batchId: string;
  linkedCaseId: string | null;
  linkedCaseRef: string | null;
}) {
  const description = evidenceDescription(
    input.sourceLabel,
    "PST stored as preservation evidence only. No PST parsing is performed in this sprint.",
  );

  return await saveFileAsEvidence({
    file: input.file,
    title: `PST preservation archive: ${input.file.name}`,
    sourceType: "document-placeholder",
    workspaceAssignment: input.workspaceAssignment,
    sourceLabel: `${input.sourceLabel} PST archive`,
    description,
    linkedCaseId: input.linkedCaseId,
    linkedCaseRef: input.linkedCaseRef,
    linkedIntakeItemRef: `Bulk batch ${input.batchId}`,
  });
}

async function processDocumentFile(input: {
  file: File;
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  batchId: string;
  linkedCaseId: string | null;
  linkedCaseRef: string | null;
}) {
  const description = evidenceDescription(
    input.sourceLabel,
    "Stored as evidence only. No PDF or Word parsing is performed in this sprint.",
  );

  return await saveFileAsEvidence({
    file: input.file,
    title: `Evidence file: ${input.file.name}`,
    sourceType: "document-placeholder",
    workspaceAssignment: input.workspaceAssignment,
    sourceLabel: `${input.sourceLabel} evidence intake`,
    description,
    linkedCaseId: input.linkedCaseId,
    linkedCaseRef: input.linkedCaseRef,
    linkedIntakeItemRef: `Bulk batch ${input.batchId}`,
  });
}

async function processEmlFile(input: {
  file: File;
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  batchId: string;
  linkedCaseId: string | null;
  linkedCaseRef: string | null;
  sourcePathInArchive?: string | null;
}) {
  const description = evidenceDescription(
    input.sourceLabel,
    "Imported email content is evidence of the message content for investigation purposes.",
    input.sourcePathInArchive,
  );

  const savedEvidence = await saveFileAsEvidence({
    file: input.file,
    title: input.sourcePathInArchive
      ? `Extracted EML: ${input.sourcePathInArchive}`
      : `Imported EML: ${input.file.name}`,
    sourceType: "eml-placeholder",
    workspaceAssignment: input.workspaceAssignment,
    sourceLabel: `${input.sourceLabel} EML intake`,
    description,
    linkedCaseId: input.linkedCaseId,
    linkedCaseRef: input.linkedCaseRef,
    linkedIntakeItemRef: `Bulk batch ${input.batchId}`,
  });

  const parseOutcome = await ingestEmlEvidence(savedEvidence.evidenceRow.evidence_id);

  return {
    evidenceRow: parseOutcome.evidenceRow,
    threadRow: parseOutcome.threadRow,
    messageRow: parseOutcome.messageRow,
    parseStatus: parseOutcome.parseStatus,
    parseError: parseOutcome.parseError,
    supported: parseOutcome.supported,
    storageAvailable: parseOutcome.storageAvailable,
    note: parseOutcome.note,
    persisted: savedEvidence.persisted,
    storageOutcome: savedEvidence.storageOutcome,
  };
}

export async function processBulkEvidenceIntake(
  input: BulkEvidenceIntakeRequest,
): Promise<BulkEvidenceBatchOutcome> {
  const batchId = `bulk-batch-${randomUUID()}`;
  const linkedCaseId = input.linkedCaseId ?? null;
  const linkedCase = linkedCaseId ? await getCaseById(linkedCaseId) : null;
  const linkedCaseRef = linkedCase?.title ?? linkedCaseId ?? null;
  const sourceLabel = input.sourceLabel.trim() || "Bulk Outlook evidence intake";
  const summary: BulkEvidenceBatchSummary = {
    totalFiles: 0,
    emlFilesFound: 0,
    parsedSuccessfully: 0,
    evidenceOnly: 0,
    skipped: 0,
    failed: 0,
    unsupported: 0,
    warnings: 0,
  };
  const warnings: string[] = [];
  const savedItems: BulkEvidenceBatchItemRow[] = [];
  let originalArchiveEvidenceId: string | null = null;
  let fatalError = false;

  await saveBulkEvidenceBatch({
    batch_id: batchId,
    batch_mode: input.batchMode,
    workspace_assignment: input.workspaceAssignment,
    source_label: sourceLabel,
    status: "staged",
    total_files: 0,
    eml_files_found: 0,
    parsed_successfully: 0,
    skipped: 0,
    failed: 0,
    unsupported: 0,
    warnings: 0,
    notes: input.notes?.trim() ?? "",
    linked_case_id: linkedCaseId,
    linked_assurance_signal_id: input.linkedAssuranceSignalId ?? null,
    linked_support_item_id: input.linkedVesselSupportItemId ?? null,
    original_archive_evidence_id: null,
  });

  await saveBulkEvidenceBatch({
    batch_id: batchId,
    batch_mode: input.batchMode,
    workspace_assignment: input.workspaceAssignment,
    source_label: sourceLabel,
    status: "processing",
    total_files: 0,
    eml_files_found: 0,
    parsed_successfully: 0,
    skipped: 0,
    failed: 0,
    unsupported: 0,
    warnings: 0,
    notes: input.notes?.trim() ?? "",
    linked_case_id: linkedCaseId,
    linked_assurance_signal_id: input.linkedAssuranceSignalId ?? null,
    linked_support_item_id: input.linkedVesselSupportItemId ?? null,
    original_archive_evidence_id: null,
  });

  if (input.files.length === 0) {
    fatalError = true;
    warnings.push("No files were attached to the bulk intake request.");
  }

  if (input.files.length > MAX_EML_FILES_PER_BATCH) {
    fatalError = true;
    warnings.push(`The batch exceeds the ${MAX_EML_FILES_PER_BATCH} file limit.`);
  }

  try {
    if (!fatalError) {
    for (const file of input.files) {
      summary.totalFiles += 1;

      const kind = sourceKindForFile(file);

      if (kind === "zip") {
        if (file.size > MAX_ZIP_BYTES) {
          savedItems.push({
            batch_item_id: `bulk-batch-item-${randomUUID()}`,
            batch_id: batchId,
            source_kind: "zip",
            file_name: file.name,
            source_path_in_archive: null,
            file_size_bytes: file.size,
            status: "failed",
            note: `ZIP file exceeds the ${Math.round(MAX_ZIP_BYTES / 1024 / 1024)} MB limit.`,
            evidence_id: null,
            thread_id: null,
            message_id: null,
            parse_status: null,
            parse_error: `ZIP file exceeds the ${Math.round(MAX_ZIP_BYTES / 1024 / 1024)} MB limit.`,
            created_at: nowIso(),
            updated_at: nowIso(),
          });
          summary.failed += 1;
          summary.warnings += 1;
          continue;
        }

        const archive = await processArchiveEntry({
          archiveFile: file,
          workspaceAssignment: input.workspaceAssignment,
          sourceLabel,
          batchId,
          linkedCaseId,
          linkedCaseRef,
        });

        originalArchiveEvidenceId = archive.evidenceRow.evidence_id;
        savedItems.push({
          batch_item_id: `bulk-batch-item-${randomUUID()}`,
          batch_id: batchId,
          source_kind: "zip",
          file_name: file.name,
          source_path_in_archive: null,
          file_size_bytes: file.size,
          status: "evidence_only",
          note: "ZIP archive preserved as evidence only before extracting EML entries.",
          evidence_id: archive.evidenceRow.evidence_id,
          thread_id: null,
          message_id: null,
          parse_status: archive.evidenceRow.parse_status,
          parse_error: archive.evidenceRow.parse_error,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        summary.evidenceOnly += 1;

        let extracted;
        try {
          extracted = await extractZipEntries(Buffer.from(await file.arrayBuffer()), {
            maxFiles: MAX_EML_FILES_PER_BATCH,
            maxSingleFileBytes: MAX_SINGLE_EML_BYTES,
            maxTotalBytes: MAX_TOTAL_EXTRACTED_EML_BYTES,
          });
        } catch (error) {
          fatalError = true;
          const message = error instanceof Error ? error.message : "Failed to read the ZIP archive.";
          warnings.push(message);
          savedItems.push({
            batch_item_id: `bulk-batch-item-${randomUUID()}`,
            batch_id: batchId,
            source_kind: "zip",
            file_name: file.name,
            source_path_in_archive: null,
            file_size_bytes: file.size,
            status: "failed",
            note: message,
            evidence_id: archive.evidenceRow.evidence_id,
            thread_id: null,
            message_id: null,
            parse_status: null,
            parse_error: message,
            created_at: nowIso(),
            updated_at: nowIso(),
          });
          summary.failed += 1;
          summary.warnings += 1;
          continue;
        }

        summary.emlFilesFound += extracted.entries.length;
        for (const unsupported of extracted.unsupportedEntries) {
          savedItems.push({
            batch_item_id: `bulk-batch-item-${randomUUID()}`,
            batch_id: batchId,
            source_kind: "unsupported",
            file_name: unsupported.fileName,
            source_path_in_archive: unsupported.fileName,
            file_size_bytes: null,
            status: "unsupported",
            note: unsupported.reason,
            evidence_id: null,
            thread_id: null,
            message_id: null,
            parse_status: null,
            parse_error: unsupported.reason,
            created_at: nowIso(),
            updated_at: nowIso(),
          });
          summary.unsupported += 1;
          summary.warnings += 1;
          warnings.push(unsupported.reason);
        }

        for (const entry of extracted.entries) {
          const emlFile = new File([new Uint8Array(entry.buffer)], entry.fileName, {
            type: "message/rfc822",
          });

          const parsed = await processEmlFile({
            file: emlFile,
            workspaceAssignment: input.workspaceAssignment,
            sourceLabel,
            batchId,
            linkedCaseId,
            linkedCaseRef,
            sourcePathInArchive: entry.relativePath,
          });

          const itemStatus: BulkEvidenceItemStatus =
            parsed.parseStatus === "parsed"
              ? "parsed"
              : parsed.parseStatus === "failed"
                ? "failed"
                : parsed.supported
                  ? "unsupported"
                  : "skipped";

          savedItems.push({
            batch_item_id: `bulk-batch-item-${randomUUID()}`,
            batch_id: batchId,
            source_kind: "eml",
            file_name: entry.fileName,
            source_path_in_archive: entry.relativePath,
            file_size_bytes: entry.sizeBytes,
            status: itemStatus,
            note:
              parsed.parseStatus === "parsed"
                ? "Parsed successfully and threaded deterministically."
                : parsed.parseError ?? parsed.note ?? "No parse result.",
            evidence_id: parsed.evidenceRow.evidence_id,
            thread_id: parsed.threadRow?.thread_id ?? null,
            message_id: parsed.messageRow?.message_id ?? null,
            parse_status: parsed.parseStatus,
            parse_error: parsed.parseError,
            created_at: nowIso(),
            updated_at: nowIso(),
          });

          if (itemStatus === "parsed") {
            summary.parsedSuccessfully += 1;
          } else if (itemStatus === "failed") {
            summary.failed += 1;
            summary.warnings += 1;
            warnings.push(parsed.parseError ?? "An EML item failed to parse.");
          } else if (itemStatus === "unsupported") {
            summary.unsupported += 1;
            summary.warnings += 1;
            warnings.push(parsed.parseError ?? "An EML item was unsupported.");
          } else {
            summary.skipped += 1;
            summary.warnings += 1;
            warnings.push(parsed.note);
          }
        }

        continue;
      }

      if (kind === "pst") {
        const preserved = await processPstArchive({
          file,
          workspaceAssignment: input.workspaceAssignment,
          sourceLabel,
          batchId,
          linkedCaseId,
          linkedCaseRef,
        });

        if (!originalArchiveEvidenceId) {
          originalArchiveEvidenceId = preserved.evidenceRow.evidence_id;
        }

        savedItems.push({
          batch_item_id: `bulk-batch-item-${randomUUID()}`,
          batch_id: batchId,
          source_kind: "pst",
          file_name: file.name,
          source_path_in_archive: null,
          file_size_bytes: file.size,
          status: "evidence_only",
          note: "PST stored as preservation evidence only. PST parsing is not available in this sprint.",
          evidence_id: preserved.evidenceRow.evidence_id,
          thread_id: null,
          message_id: null,
          parse_status: preserved.evidenceRow.parse_status,
          parse_error: preserved.evidenceRow.parse_error,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        summary.evidenceOnly += 1;
        continue;
      }

      if (kind === "eml") {
        const parsed = await processEmlFile({
          file,
          workspaceAssignment: input.workspaceAssignment,
          sourceLabel,
          batchId,
          linkedCaseId,
          linkedCaseRef,
        });

        const itemStatus: BulkEvidenceItemStatus =
          parsed.parseStatus === "parsed"
            ? "parsed"
            : parsed.parseStatus === "failed"
              ? "failed"
              : parsed.supported
                ? "unsupported"
                : "skipped";

        savedItems.push({
          batch_item_id: `bulk-batch-item-${randomUUID()}`,
          batch_id: batchId,
          source_kind: "eml",
          file_name: file.name,
          source_path_in_archive: null,
          file_size_bytes: file.size,
          status: itemStatus,
          note:
            parsed.parseStatus === "parsed"
              ? "Parsed successfully and threaded deterministically."
              : parsed.parseError ?? parsed.note ?? "No parse result.",
          evidence_id: parsed.evidenceRow.evidence_id,
          thread_id: parsed.threadRow?.thread_id ?? null,
          message_id: parsed.messageRow?.message_id ?? null,
          parse_status: parsed.parseStatus,
          parse_error: parsed.parseError,
          created_at: nowIso(),
          updated_at: nowIso(),
        });

        if (itemStatus === "parsed") {
          summary.parsedSuccessfully += 1;
        } else if (itemStatus === "failed") {
          summary.failed += 1;
          summary.warnings += 1;
          warnings.push(parsed.parseError ?? "An EML item failed to parse.");
        } else if (itemStatus === "unsupported") {
          summary.unsupported += 1;
          summary.warnings += 1;
          warnings.push(parsed.parseError ?? "An EML item was unsupported.");
        } else {
          summary.skipped += 1;
          summary.warnings += 1;
          warnings.push(parsed.note);
        }

        continue;
      }

      if (kind === "document") {
        const preserved = await processDocumentFile({
          file,
          workspaceAssignment: input.workspaceAssignment,
          sourceLabel,
          batchId,
          linkedCaseId,
          linkedCaseRef,
        });

        savedItems.push({
          batch_item_id: `bulk-batch-item-${randomUUID()}`,
          batch_id: batchId,
          source_kind: "document",
          file_name: file.name,
          source_path_in_archive: null,
          file_size_bytes: file.size,
          status: "evidence_only",
          note: "Stored as evidence only. No PDF or Word parsing is performed in this sprint.",
          evidence_id: preserved.evidenceRow.evidence_id,
          thread_id: null,
          message_id: null,
          parse_status: preserved.evidenceRow.parse_status,
          parse_error: preserved.evidenceRow.parse_error,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        summary.evidenceOnly += 1;
        continue;
      }

      savedItems.push({
        batch_item_id: `bulk-batch-item-${randomUUID()}`,
        batch_id: batchId,
        source_kind: "unsupported",
        file_name: file.name,
        source_path_in_archive: null,
        file_size_bytes: file.size,
        status: "unsupported",
        note: "Unsupported file type. Use Evidence Upload for this file, or upload .eml, ZIP of .eml, PST preservation, PDF, DOC, or DOCX through bulk intake.",
        evidence_id: null,
        thread_id: null,
        message_id: null,
        parse_status: null,
        parse_error: "Unsupported file type.",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      summary.unsupported += 1;
      summary.warnings += 1;
      warnings.push(`Unsupported file skipped: ${file.name}. Use Evidence Upload for unsupported file types.`);
    }
  }

  } catch (error) {
    fatalError = true;
    const safeMessage = error instanceof Error ? error.message : "Bulk intake failed unexpectedly.";
    warnings.push(safeMessage);
    summary.failed += 1;
  }

  const batchStatus = batchStatusFromSummary(summary, fatalError);

  const batchRow: BulkEvidenceBatchRow = (
    await saveBulkEvidenceBatch({
      batch_id: batchId,
      batch_mode: input.batchMode,
      workspace_assignment: input.workspaceAssignment,
      source_label: sourceLabel,
      status: batchStatus,
      total_files: summary.totalFiles,
      eml_files_found: summary.emlFilesFound,
      parsed_successfully: summary.parsedSuccessfully,
      skipped: summary.skipped,
      failed: summary.failed,
      unsupported: summary.unsupported,
      warnings: summary.warnings,
      notes: [input.notes?.trim(), ...warnings].filter(Boolean).join(" "),
      linked_case_id: linkedCaseId,
      linked_assurance_signal_id: input.linkedAssuranceSignalId ?? null,
      linked_support_item_id: input.linkedVesselSupportItemId ?? null,
      original_archive_evidence_id: originalArchiveEvidenceId,
    })
  ).row;

  for (const item of savedItems) {
    await saveBulkEvidenceBatchItem(item);
  }

  await appendAuditLog({
    actor: "user",
    action: "process_bulk_evidence_intake",
    object_type: "bulk_evidence_batch",
    object_id: batchRow.batch_id,
    details: {
      batch_mode: batchRow.batch_mode,
      workspace_assignment: batchRow.workspace_assignment,
      status: batchRow.status,
      total_files: batchRow.total_files,
      eml_files_found: batchRow.eml_files_found,
      parsed_successfully: batchRow.parsed_successfully,
      skipped: batchRow.skipped,
      failed: batchRow.failed,
      unsupported: batchRow.unsupported,
      warnings: batchRow.warnings,
      linked_case_id: batchRow.linked_case_id,
      linked_assurance_signal_id: batchRow.linked_assurance_signal_id,
      linked_support_item_id: batchRow.linked_support_item_id,
      original_archive_evidence_id: batchRow.original_archive_evidence_id,
    },
  });

  return {
    batchId,
    summary,
    batchStatus,
    note:
      batchStatus === "failed"
        ? "The bulk intake failed. Review the warnings and try a smaller batch or a safer ZIP."
        : batchStatus === "completed_with_warnings"
          ? "The bulk intake completed with warnings. Review skipped, unsupported, and failed items."
          : "The bulk intake completed successfully.",
    warnings,
    items: savedItems.map((item) => ({
      fileName: item.file_name,
      sourceKind: item.source_kind,
      status: item.status,
      note: item.note,
      sourcePathInArchive: item.source_path_in_archive,
    })),
  };
}
