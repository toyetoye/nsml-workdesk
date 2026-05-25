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
  BulkEvidenceBatchDiagnostics,
} from "./types";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_EML_FILES_PER_BATCH = 200;
const MAX_SINGLE_EML_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_EXTRACTED_EML_BYTES = 100 * 1024 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function fileExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  const dotIndex = lower.lastIndexOf(".");

  return dotIndex >= 0 ? lower.slice(dotIndex + 1) : "none";
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
  const rawBuffer = Buffer.from(await input.file.arrayBuffer());

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

  const parseOutcome = await ingestEmlEvidence(savedEvidence.evidenceRow.evidence_id, {
    rawBuffer,
  });

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
    preservationOnly: 0,
    skipped: 0,
    failed: 0,
    unsupported: 0,
    warnings: 0,
  };
  const diagnostics: BulkEvidenceBatchDiagnostics = {
    fileCountReceived: input.files.length,
    extensionsReceived: input.files.map((file) => fileExtension(file.name)),
    acceptedCount: 0,
    parsedCount: 0,
    evidenceOnlyCount: 0,
    preservationOnlyCount: 0,
    unsupportedCount: 0,
    failedCount: 0,
    failureStage: "none",
    errorCode: null,
  };
  const warnings: string[] = [];
  const savedItems: BulkEvidenceBatchItemRow[] = [];
  let originalArchiveEvidenceId: string | null = null;
  let fatalValidationError = false;

  if (process.env.NODE_ENV !== "production") {
    console.info("[bulk-evidence] intake request", {
      fileCount: input.files.length,
      extensions: input.files.map((file) => file.name.split(".").pop()?.toLowerCase() ?? "none"),
    });
  }

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
    fatalValidationError = true;
    diagnostics.failureStage = "validation";
    diagnostics.errorCode = "NO_FILES";
    warnings.push("No files were attached to the bulk intake request.");
  }

  if (input.files.length > MAX_EML_FILES_PER_BATCH) {
    fatalValidationError = true;
    diagnostics.failureStage = "validation";
    diagnostics.errorCode = "TOO_MANY_FILES";
    warnings.push(`The batch exceeds the ${MAX_EML_FILES_PER_BATCH} file limit.`);
  }

  const recordUnsupportedItem = (fileName: string, message: string) => {
    savedItems.push({
      batch_item_id: `bulk-batch-item-${randomUUID()}`,
      batch_id: batchId,
      source_kind: "unsupported",
      file_name: fileName,
      source_path_in_archive: null,
      file_size_bytes: null,
      status: "unsupported",
      note: message,
      evidence_id: null,
      thread_id: null,
      message_id: null,
      parse_status: null,
      parse_error: message,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    summary.unsupported += 1;
    diagnostics.unsupportedCount += 1;
    summary.warnings += 1;
    warnings.push(message);
  };

  const recordFailedItem = (inputItem: {
    fileName: string;
    sourceKind: BulkEvidenceSourceKind;
    fileSizeBytes: number | null;
    message: string;
    sourcePathInArchive?: string | null;
    evidenceId?: string | null;
  }) => {
    savedItems.push({
      batch_item_id: `bulk-batch-item-${randomUUID()}`,
      batch_id: batchId,
      source_kind: inputItem.sourceKind,
      file_name: inputItem.fileName,
      source_path_in_archive: inputItem.sourcePathInArchive ?? null,
      file_size_bytes: inputItem.fileSizeBytes,
      status: "failed",
      note: inputItem.message,
      evidence_id: inputItem.evidenceId ?? null,
      thread_id: null,
      message_id: null,
      parse_status: null,
      parse_error: inputItem.message,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    summary.failed += 1;
    diagnostics.failedCount += 1;
    summary.warnings += 1;
    warnings.push(inputItem.message);
  };

  if (!fatalValidationError) {
    for (const file of input.files) {
      summary.totalFiles += 1;
      const kind = sourceKindForFile(file);

      try {
        if (kind === "zip") {
          if (file.size > MAX_ZIP_BYTES) {
            recordFailedItem({
              fileName: file.name,
              sourceKind: "zip",
              fileSizeBytes: file.size,
              message: `ZIP file exceeds the ${Math.round(MAX_ZIP_BYTES / 1024 / 1024)} MB limit.`,
            });
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
          diagnostics.evidenceOnlyCount += 1;
          warnings.push("ZIP archive preserved as evidence only before extracting EML entries.");

          let extracted;
          try {
            extracted = await extractZipEntries(Buffer.from(await file.arrayBuffer()), {
              maxFiles: MAX_EML_FILES_PER_BATCH,
              maxSingleFileBytes: MAX_SINGLE_EML_BYTES,
              maxTotalBytes: MAX_TOTAL_EXTRACTED_EML_BYTES,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to read the ZIP archive.";
            recordFailedItem({
              fileName: file.name,
              sourceKind: "zip",
              fileSizeBytes: file.size,
              message,
              evidenceId: archive.evidenceRow.evidence_id,
            });
            continue;
          }

          summary.emlFilesFound += extracted.entries.length;

          for (const unsupported of extracted.unsupportedEntries) {
            recordUnsupportedItem(
              unsupported.fileName,
              `${unsupported.reason} Use Evidence Upload for unsupported file types.`,
            );
          }

          for (const entry of extracted.entries) {
            const emlFile = new File([new Uint8Array(entry.buffer)], entry.fileName, {
              type: "message/rfc822",
            });

            try {
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
                diagnostics.parsedCount += 1;
              } else if (itemStatus === "failed") {
                summary.failed += 1;
                diagnostics.failedCount += 1;
                summary.warnings += 1;
                warnings.push(parsed.parseError ?? "An EML item failed to parse.");
              } else if (itemStatus === "unsupported") {
                summary.unsupported += 1;
                diagnostics.unsupportedCount += 1;
                summary.warnings += 1;
                warnings.push(parsed.parseError ?? "An EML item was unsupported.");
              } else {
                summary.skipped += 1;
                summary.warnings += 1;
                warnings.push(parsed.note);
              }
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : `Failed to parse extracted EML: ${entry.relativePath}`;
              recordFailedItem({
                fileName: entry.fileName,
                sourceKind: "eml",
                fileSizeBytes: entry.sizeBytes,
                message,
                sourcePathInArchive: entry.relativePath,
                evidenceId: null,
              });
            }
          }

          continue;
        }

        if (kind === "eml") {
          try {
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
              diagnostics.parsedCount += 1;
            } else if (itemStatus === "failed") {
              summary.failed += 1;
              diagnostics.failedCount += 1;
              summary.warnings += 1;
              warnings.push(parsed.parseError ?? "An EML item failed to parse.");
            } else if (itemStatus === "unsupported") {
              summary.unsupported += 1;
              diagnostics.unsupportedCount += 1;
              summary.warnings += 1;
              warnings.push(parsed.parseError ?? "An EML item was unsupported.");
            } else {
              summary.skipped += 1;
              summary.warnings += 1;
              warnings.push(parsed.note);
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : `Failed to parse EML file: ${file.name}`;
            recordFailedItem({
              fileName: file.name,
              sourceKind: "eml",
              fileSizeBytes: file.size,
              message,
            });
          }

          continue;
        }

        if (kind === "document") {
          try {
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
            diagnostics.evidenceOnlyCount += 1;
            warnings.push("PDF and Word documents were stored as evidence only.");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : `Failed to store evidence file: ${file.name}`;
            recordFailedItem({
              fileName: file.name,
              sourceKind: "document",
              fileSizeBytes: file.size,
              message,
            });
          }

          continue;
        }

        if (kind === "pst") {
          try {
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
              status: "preservation_only",
              note: "PST stored as preservation evidence only. PST parsing is not available in this sprint.",
              evidence_id: preserved.evidenceRow.evidence_id,
              thread_id: null,
              message_id: null,
              parse_status: preserved.evidenceRow.parse_status,
              parse_error: preserved.evidenceRow.parse_error,
              created_at: nowIso(),
              updated_at: nowIso(),
            });
            summary.preservationOnly += 1;
            diagnostics.preservationOnlyCount += 1;
            warnings.push("PST stored as preservation evidence only. PST parsing is not available in this sprint.");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : `Failed to preserve PST file: ${file.name}`;
            recordFailedItem({
              fileName: file.name,
              sourceKind: "pst",
              fileSizeBytes: file.size,
              message,
            });
          }

          continue;
        }

        recordUnsupportedItem(
          file.name,
          `Unsupported file skipped: ${file.name}. Use Evidence Upload for unsupported file types.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : `Bulk item failed: ${file.name}`;
        recordFailedItem({
          fileName: file.name,
          sourceKind: kind,
          fileSizeBytes: file.size,
          message,
        });
      }
    }
  }

  const acceptedCount = summary.parsedSuccessfully + summary.evidenceOnly + summary.preservationOnly;
  diagnostics.acceptedCount = acceptedCount;
  diagnostics.parsedCount = summary.parsedSuccessfully;
  diagnostics.evidenceOnlyCount = summary.evidenceOnly;
  diagnostics.preservationOnlyCount = summary.preservationOnly;
  diagnostics.unsupportedCount = summary.unsupported;
  diagnostics.failedCount = summary.failed;
  const hadErrors = summary.failed + summary.unsupported + summary.skipped > 0;
  const batchStatus: BulkEvidenceBatchStatus = fatalValidationError
    ? "failed"
    : acceptedCount > 0
      ? hadErrors || warnings.length > 0
        ? "completed_with_warnings"
        : "completed"
      : hadErrors
        ? "failed"
        : "completed";

  if (batchStatus === "failed") {
    if (diagnostics.failureStage === "none") {
      diagnostics.failureStage = summary.failed > 0 ? "batch-processing" : "validation";
    }

    if (!diagnostics.errorCode) {
      if (summary.unsupported > 0 && summary.failed === 0 && summary.skipped === 0) {
        diagnostics.errorCode = "UNSUPPORTED_ONLY";
      } else if (summary.failed > 0 && acceptedCount === 0) {
        diagnostics.errorCode = "ALL_ITEMS_FAILED";
      } else if (summary.skipped > 0 && acceptedCount === 0) {
        diagnostics.errorCode = "NO_ACCEPTED_ITEMS";
      } else {
        diagnostics.errorCode = "BATCH_FAILED";
      }
    }
  }

  const failureNote =
    diagnostics.errorCode === "NO_FILES"
      ? "No files were attached to the bulk intake request."
      : diagnostics.errorCode === "TOO_MANY_FILES"
        ? `The batch exceeds the ${MAX_EML_FILES_PER_BATCH} file limit.`
        : diagnostics.errorCode === "UNSUPPORTED_ONLY"
          ? "The batch contained only unsupported files. Use Evidence Upload for unsupported files."
          : diagnostics.errorCode === "ALL_ITEMS_FAILED"
            ? "The batch could not complete because every file failed safely."
            : diagnostics.errorCode === "NO_ACCEPTED_ITEMS"
              ? "The batch could not complete because no file could be safely accepted."
              : "The bulk intake could not complete safely.";

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
        ? failureNote
        : batchStatus === "completed_with_warnings"
          ? "The bulk intake completed with warnings. Review skipped, unsupported, and failed items."
          : "The bulk intake completed successfully.",
    warnings,
    diagnostics,
    items: savedItems.map((item) => ({
      fileName: item.file_name,
      sourceKind: item.source_kind,
      status: item.status,
      note: item.note,
      sourcePathInArchive: item.source_path_in_archive,
    })),
  };
}
