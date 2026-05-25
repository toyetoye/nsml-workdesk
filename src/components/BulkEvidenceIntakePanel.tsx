"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  FileText,
  FolderInput,
  LoaderCircle,
  Paperclip,
  Upload,
} from "lucide-react";
import { processBulkEvidenceIntakeAction } from "@/app/(protected)/import/actions";
import { StatusBadge } from "@/components/StatusBadge";
import type {
  BulkEvidenceBatchItemRow,
  BulkEvidenceBatchRow,
} from "@/lib/persistence/types";
import type {
  BulkEvidenceActionItem,
  BulkEvidenceActionDiagnostics,
  BulkEvidenceActionResult,
  BulkEvidenceActionStatus,
  BulkEvidenceActionSummary,
  BulkEvidenceBatchMode,
} from "@/lib/bulk-evidence/types";
import type { ImportWorkspaceAssignment, StatusTone } from "@/lib/mock-data";
import { formatEvidenceSize } from "@/lib/workbench-data";

type BulkEvidenceIntakePanelProps = {
  initialBatches: BulkEvidenceBatchRow[];
  initialBatchItems: BulkEvidenceBatchItemRow[];
  persistenceEnabled: boolean;
  evidenceStorageEnabled: boolean;
  manualIntakeHref: string;
};

const batchModeOptions: Array<{
  value: BulkEvidenceBatchMode;
  label: string;
  description: string;
}> = [
  {
    value: "selected-eml-files",
    label: "Selected evidence upload",
    description:
      "Upload one or many loose files. .eml files are parsed, PDFs and Word documents are stored as evidence only, and PST files stay preservation-only. Folder-style selection is supported where the browser allows it.",
  },
  {
    value: "zip-of-emls",
    label: "ZIP of EMLs",
    description: "Upload a ZIP archive of exported .eml files for safe server-side extraction and parsing. Loose files can be mixed into the same batch.",
  },
  {
    value: "pst-preservation",
    label: "PST preservation only",
    description: "Store the PST archive as preservation evidence. No PST parsing is performed in this sprint.",
  },
  {
    value: "manual-email-fallback",
    label: "Manual pasted email fallback",
    description: "Use the existing manual intake form for urgent active investigation records that need immediate capture.",
  },
];

const batchStatusTone: Record<BulkEvidenceBatchRow["status"], StatusTone> = {
  staged: "neutral",
  processing: "accent",
  completed: "accent",
  completed_with_warnings: "warning",
  failed: "danger",
};

const itemStatusTone: Record<BulkEvidenceBatchItemRow["status"], StatusTone> = {
  parsed: "accent",
  evidence_only: "neutral",
  preservation_only: "warning",
  skipped: "neutral",
  failed: "danger",
  unsupported: "warning",
};

function batchStatusLabel(status: BulkEvidenceBatchRow["status"]) {
  switch (status) {
    case "staged":
      return "Staged";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "completed_with_warnings":
      return "Completed with warnings";
    case "failed":
    default:
      return "Failed";
  }
}

function itemStatusLabel(status: BulkEvidenceBatchItemRow["status"]) {
  switch (status) {
    case "parsed":
      return "Parsed";
    case "evidence_only":
      return "Evidence only";
    case "preservation_only":
      return "Preservation only";
    case "skipped":
      return "Skipped";
    case "failed":
      return "Failed";
    case "unsupported":
    default:
      return "Unsupported";
  }
}

function workspaceAssignmentLabel(workspace: ImportWorkspaceAssignment) {
  return workspace;
}

const bulkEvidenceAccept =
  ".eml,.zip,.pst,.pdf,.doc,.docx,application/zip,application/x-zip-compressed,application/vnd.ms-outlook,message/rfc822,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fileAcceptForMode() {
  return bulkEvidenceAccept;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isActionStatus(value: unknown): value is BulkEvidenceActionStatus {
  return (
    value === "staged" ||
    value === "processing" ||
    value === "completed" ||
    value === "completed_with_warnings" ||
    value === "failed"
  );
}

function isActionItemStatus(value: unknown): value is BulkEvidenceActionItem["status"] {
  return (
    value === "parsed" ||
    value === "evidence_only" ||
    value === "preservation_only" ||
    value === "skipped" ||
    value === "failed" ||
    value === "unsupported"
  );
}

function normalizeActionSummary(summary: unknown): BulkEvidenceActionSummary | null {
  if (!isRecord(summary)) {
    return null;
  }

  const totalFiles = Number(summary.totalFiles ?? 0);
  const parsedEml = Number(summary.parsedEml ?? summary.parsedSuccessfully ?? 0);
  const evidenceOnly = Number(summary.evidenceOnly ?? 0);
  const preservationOnly = Number(summary.preservationOnly ?? 0);
  const unsupported = Number(summary.unsupported ?? 0);
  const failed = Number(summary.failed ?? 0);
  const warnings = Number(summary.warnings ?? 0);
  const skipped = summary.skipped === undefined ? undefined : Number(summary.skipped);

  if (
    [totalFiles, parsedEml, evidenceOnly, preservationOnly, unsupported, failed, warnings].some((value) =>
      Number.isNaN(value),
    ) ||
    (skipped !== undefined && Number.isNaN(skipped))
  ) {
    return null;
  }

  return {
    totalFiles,
    parsedEml,
    evidenceOnly,
    preservationOnly,
    unsupported,
    failed,
    warnings,
    skipped,
    parsedSuccessfully: Number(summary.parsedSuccessfully ?? parsedEml),
  };
}

function normalizeActionItems(items: unknown): BulkEvidenceActionItem[] | null {
  if (!Array.isArray(items)) {
    return null;
  }

  const normalized: BulkEvidenceActionItem[] = [];

  for (const item of items) {
    if (!isRecord(item)) {
      return null;
    }

    if (
      typeof item.fileName !== "string" ||
      typeof item.extension !== "string" ||
      typeof item.message !== "string" ||
      !isActionItemStatus(item.status)
    ) {
      return null;
    }

    normalized.push({
      fileName: item.fileName,
      extension: item.extension,
      status: item.status,
      message: item.message,
      sourcePathInArchive: typeof item.sourcePathInArchive === "string" ? item.sourcePathInArchive : null,
      sourceKind: typeof item.sourceKind === "string" ? item.sourceKind as BulkEvidenceActionItem["sourceKind"] : undefined,
      note: typeof item.note === "string" ? item.note : undefined,
    });
  }

  return normalized;
}

function normalizeActionDiagnostics(value: unknown): BulkEvidenceActionDiagnostics | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fileCountReceived = Number(value.fileCountReceived ?? 0);
  const extensionsReceived = isStringArray(value.extensionsReceived) ? value.extensionsReceived : null;
  const acceptedCount = Number(value.acceptedCount ?? 0);
  const parsedCount = Number(value.parsedCount ?? 0);
  const evidenceOnlyCount = Number(value.evidenceOnlyCount ?? 0);
  const preservationOnlyCount = Number(value.preservationOnlyCount ?? 0);
  const unsupportedCount = Number(value.unsupportedCount ?? 0);
  const failedCount = Number(value.failedCount ?? 0);
  const failureStage = value.failureStage;
  const errorCode = value.errorCode;

  if (
    !extensionsReceived ||
    [fileCountReceived, acceptedCount, parsedCount, evidenceOnlyCount, preservationOnlyCount, unsupportedCount, failedCount].some((entry) =>
      Number.isNaN(entry),
    ) ||
    !(
      failureStage === "none" ||
      failureStage === "validation" ||
      failureStage === "batch-processing" ||
      failureStage === "zip-extraction" ||
      failureStage === "storage" ||
      failureStage === "parse" ||
      failureStage === "system"
    ) ||
    !(errorCode === null || errorCode === undefined || typeof errorCode === "string")
  ) {
    return undefined;
  }

  return {
    fileCountReceived,
    extensionsReceived,
    acceptedCount,
    parsedCount,
    evidenceOnlyCount,
    preservationOnlyCount,
    unsupportedCount,
    failedCount,
    failureStage,
    errorCode: typeof errorCode === "string" ? errorCode : null,
  };
}

function normalizeBulkEvidenceActionResult(value: unknown): BulkEvidenceActionResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const ok = value.ok;
  const message = value.message;
  const status = value.status ?? value.batchStatus;

  if (typeof ok !== "boolean" || typeof message !== "string" || !isActionStatus(status)) {
    return null;
  }

  const summary = normalizeActionSummary(value.summary);
  const items = normalizeActionItems(value.items);
  const warnings = isStringArray(value.warnings) ? value.warnings : null;

  if (!summary || !items || !warnings) {
    return null;
  }

  return {
    ok,
    message,
    status,
    batchId: typeof value.batchId === "string" ? value.batchId : "",
    summary,
    items,
    warnings,
    diagnostics: normalizeActionDiagnostics(value.diagnostics),
    batchStatus: isActionStatus(value.batchStatus) ? value.batchStatus : status,
    note: typeof value.note === "string" ? value.note : message,
  };
}

export function BulkEvidenceIntakePanel({
  initialBatches,
  initialBatchItems,
  persistenceEnabled,
  evidenceStorageEnabled,
  manualIntakeHref,
}: BulkEvidenceIntakePanelProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [batches, setBatches] = useState<BulkEvidenceBatchRow[]>(() => initialBatches);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => initialBatches[0]?.batch_id ?? "");
  const [batchMode, setBatchMode] = useState<BulkEvidenceBatchMode>("selected-eml-files");
  const [workspaceAssignment, setWorkspaceAssignment] = useState<ImportWorkspaceAssignment>("Import/Staging");
  const [sourceLabel, setSourceLabel] = useState("Bulk Outlook evidence intake");
  const [notes, setNotes] = useState("");
  const [linkedCaseId, setLinkedCaseId] = useState("");
  const [linkedAssuranceSignalId, setLinkedAssuranceSignalId] = useState("");
  const [linkedVesselSupportItemId, setLinkedVesselSupportItemId] = useState("");
  const [fileSummary, setFileSummary] = useState<string>("No files selected");
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseDebug, setResponseDebug] = useState<{
    keys: string[];
    status: string;
    summary: string;
  } | null>(null);

  const sortedBatches = useMemo(
    () => [...batches].sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
    [batches],
  );

  const selectedBatch = useMemo(
    () => sortedBatches.find((batch) => batch.batch_id === selectedBatchId) ?? sortedBatches[0] ?? null,
    [selectedBatchId, sortedBatches],
  );

  const selectedItems = useMemo(
    () =>
      selectedBatch
        ? initialBatchItems
            .filter((item) => item.batch_id === selectedBatch.batch_id)
            .sort((left, right) => left.created_at.localeCompare(right.created_at))
        : [],
    [initialBatchItems, selectedBatch],
  );

  const selectedEvidenceOnlyCount = useMemo(
    () => selectedItems.filter((item) => item.status === "evidence_only").length,
    [selectedItems],
  );

  const selectedPreservationOnlyCount = useMemo(
    () => selectedItems.filter((item) => item.status === "preservation_only").length,
    [selectedItems],
  );

  const selectedBatchSummary = selectedBatch
    ? [
        { label: "Total files", value: selectedBatch.total_files },
        { label: "EML files found", value: selectedBatch.eml_files_found },
        { label: "Parsed", value: selectedBatch.parsed_successfully },
        { label: "Evidence only", value: selectedEvidenceOnlyCount },
        { label: "Preservation only", value: selectedPreservationOnlyCount },
        { label: "Skipped", value: selectedBatch.skipped },
        { label: "Failed", value: selectedBatch.failed },
        { label: "Unsupported", value: selectedBatch.unsupported },
        { label: "Warnings", value: selectedBatch.warnings },
    ]
    : [];

  function clearSelectedFiles() {
    const input = formRef.current?.querySelector<HTMLInputElement>('input[name="files"]');

    if (input) {
      input.value = "";
    }

    setSelectedFileCount(0);
    setFileSummary("No files selected");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (batchMode === "manual-email-fallback") {
      setError(null);
      setNotice("Manual pasted email fallback is handled by the intake form above. No bulk batch was created.");
      return;
    }

    if (selectedFileCount === 0) {
      setError("Choose at least one file before running bulk intake.");
      return;
    }

    setBusy(true);
    setNotice(null);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("redirectTo", "/import");
      formData.set("batchMode", batchMode);
      formData.set("workspaceAssignment", workspaceAssignment);
      formData.set("sourceLabel", sourceLabel);
      formData.set("notes", notes);
      formData.set("linkedCaseId", linkedCaseId);
      formData.set("linkedAssuranceSignalId", linkedAssuranceSignalId);
      formData.set("linkedVesselSupportItemId", linkedVesselSupportItemId);

      const rawResult = await processBulkEvidenceIntakeAction(formData);
      const result = normalizeBulkEvidenceActionResult(rawResult);

      if (!result) {
        throw new Error(
          "The bulk intake returned an invalid response. Please retry with a smaller batch or use Evidence Upload for unsupported files.",
        );
      }

      if (process.env.NODE_ENV !== "production") {
        setResponseDebug({
          keys: Object.keys((rawResult as Record<string, unknown>) ?? {}).sort(),
          status: result.status,
          summary: `total=${result.summary.totalFiles}, parsed=${result.summary.parsedEml}, evidenceOnly=${result.summary.evidenceOnly}, preservationOnly=${result.summary.preservationOnly}, unsupported=${result.summary.unsupported}, failed=${result.summary.failed}, warnings=${result.summary.warnings}`,
        });
      }

      if (!result.ok) {
        setError(result.message || "Bulk evidence intake could not be completed.");
        return;
      }

      setNotice(result.message || result.note || null);
      setBatches((current) => {
        const existing = current.filter((batch) => batch.batch_id !== result.batchId);
        return [
          {
            batch_id: result.batchId,
            batch_mode: batchMode,
            workspace_assignment: workspaceAssignment,
            source_label: sourceLabel,
            status: result.status,
            total_files: result.summary.totalFiles,
            eml_files_found: result.summary.parsedEml,
            parsed_successfully: result.summary.parsedEml,
            skipped: result.summary.skipped ?? 0,
            failed: result.summary.failed,
            unsupported: result.summary.unsupported,
            warnings: result.summary.warnings,
            notes,
            linked_case_id: linkedCaseId || null,
            linked_assurance_signal_id: linkedAssuranceSignalId || null,
            linked_support_item_id: linkedVesselSupportItemId || null,
            original_archive_evidence_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...existing,
        ];
      });
      if (result.batchId) {
        setSelectedBatchId(result.batchId);
      }

      formRef.current?.reset();
      setBatchMode("selected-eml-files");
      setWorkspaceAssignment("Import/Staging");
      setSourceLabel("Bulk Outlook evidence intake");
      setNotes("");
      setLinkedCaseId("");
      setLinkedAssuranceSignalId("");
      setLinkedVesselSupportItemId("");
      clearSelectedFiles();
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Bulk evidence intake failed.";
      setError(
        message.includes("unexpected response")
          ? "The bulk intake returned an invalid response. Please retry the batch or use Evidence Upload for unsupported files."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setSelectedFileCount(files.length);

    if (files.length === 0) {
      setFileSummary("No files selected");
      return;
    }

    setFileSummary(
      files
        .map((file) => `${file.name} (${formatEvidenceSize(file.size)})`)
        .join(" · "),
    );
  }

  const activeModeDescription = batchModeOptions.find((option) => option.value === batchMode)?.description;

  return (
    <section className="card p-4" id="bulk-evidence-intake">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Bulk Evidence Intake
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Bring Outlook exports in safely</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Bulk intake accepts exported email evidence without connecting to Outlook directly. EML and ZIP of
            EML files are parsed into correspondence, PDFs and Word documents are stored as evidence only, and PST
            archives stay preservation-only in this sprint.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={persistenceEnabled ? "accent" : "warning"}>
            {persistenceEnabled ? "Repository connected" : "Session fallback"}
          </StatusBadge>
          <StatusBadge tone={evidenceStorageEnabled ? "accent" : "warning"}>
            {evidenceStorageEnabled ? "Private storage ready" : "Storage fallback"}
          </StatusBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {batchModeOptions.map((option) => (
          <article key={option.value} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{option.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{option.description}</p>
              </div>
              {batchMode === option.value ? (
                <CheckCircle2 aria-hidden className="text-teal-700" size={18} />
              ) : (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Guidance
                </span>
              )}
            </div>
            {option.value === "manual-email-fallback" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={manualIntakeHref}
                  className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 hover:border-teal-300 hover:text-teal-900"
                >
                  Open manual intake
                  <FolderInput aria-hidden size={14} />
                </Link>
                <span className="text-xs text-slate-500">
                  Use this for urgent active investigation records.
                </span>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Batch setup
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Choose the intake style, workspace assignment, and any optional linkage before processing.
                </p>
              </div>
              <Archive aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Batch mode">
                <select
                  value={batchMode}
                  onChange={(event) => {
                    setBatchMode(event.target.value as BulkEvidenceBatchMode);
                    clearSelectedFiles();
                  }}
                  className="field-input"
                >
                  {batchModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Workspace assignment">
                <select
                  value={workspaceAssignment}
                  onChange={(event) =>
                    setWorkspaceAssignment(event.target.value as ImportWorkspaceAssignment)
                  }
                  className="field-input"
                >
                  {[
                    "Import/Staging",
                    "LNG PORTHARCOURT II",
                    "LPG ALFRED TEMILE",
                    "LPG ALFRED TEMILE 10",
                    "Projects",
                    "Other",
                    "Assurance",
                  ].map((workspace) => (
                    <option key={workspace} value={workspace}>
                      {workspaceAssignmentLabel(workspace as ImportWorkspaceAssignment)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Field label="Case link placeholder">
                <input
                  value={linkedCaseId}
                  onChange={(event) => setLinkedCaseId(event.target.value)}
                  className="field-input"
                  placeholder="Optional case id"
                />
              </Field>
              <Field label="Assurance link placeholder">
                <input
                  value={linkedAssuranceSignalId}
                  onChange={(event) => setLinkedAssuranceSignalId(event.target.value)}
                  className="field-input"
                  placeholder="Optional assurance signal id"
                />
              </Field>
              <Field label="Support item placeholder">
                <input
                  value={linkedVesselSupportItemId}
                  onChange={(event) => setLinkedVesselSupportItemId(event.target.value)}
                  className="field-input"
                  placeholder="Optional support item id"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Source label">
                <input
                  value={sourceLabel}
                  onChange={(event) => setSourceLabel(event.target.value)}
                  className="field-input"
                  placeholder="Bulk Outlook evidence intake"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="field-input min-h-28 resize-y"
                  placeholder="Add a short context note for the batch."
                />
              </Field>
            </div>

            {batchMode === "manual-email-fallback" ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                Manual pasted email fallback is handled by the intake form above. No bulk files are required here.
                Use the manual intake link if the matter is urgent.
              </div>
            ) : (
                <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {batchMode === "zip-of-emls"
                        ? "Upload ZIP archive"
                        : batchMode === "pst-preservation"
                          ? "Upload PST archive"
                          : "Upload selected EML files"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{activeModeDescription}</p>
                  </div>
                  <Upload aria-hidden className="text-teal-700" size={18} />
                </div>

                <div className="mt-4">
                  <input
                    type="file"
                    name="files"
                    multiple
                    accept={fileAcceptForMode()}
                    onChange={handleFileChange}
                    className="field-input pt-2"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Upload one or many loose .eml, .pdf, .doc, .docx, or .pst files, or a ZIP of exported .eml
                    files. ZIP extraction happens server-side only. PST files are preserved only and not parsed in
                    this sprint.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Suggested first-pass limits: ZIP up to 50 MB, up to 200 .eml files per batch, extracted .eml files
                    up to 10 MB each, and total extracted EML content up to 100 MB.
                  </p>
                </div>

                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Selected files:</span> {fileSummary}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || batchMode === "manual-email-fallback" || selectedFileCount === 0}
              >
                {busy ? "Processing..." : "Run bulk intake"}
              </button>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {batchMode === "zip-of-emls"
                  ? "ZIP extraction is server-side only and path traversal is blocked. Loose files can still be mixed into the same batch."
                  : batchMode === "pst-preservation"
                    ? "PST stays preservation-only and is not parsed."
                    : "Selected .eml files are parsed with the existing EML parser. PDFs and Word docs are evidence-only."}
              </div>
            </div>
          </div>

          {notice ? (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
              {error}
            </div>
          ) : null}

          {process.env.NODE_ENV !== "production" && responseDebug ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
              <p className="font-semibold text-slate-700">Development response debug</p>
              <p className="mt-1">Keys received: {responseDebug.keys.join(", ") || "none"}</p>
              <p>Status received: {responseDebug.status}</p>
              <p>Summary: {responseDebug.summary}</p>
            </div>
          ) : null}

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence guidance</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Imported documents are evidence files. Conclusions drawn from them still need a separate
              classification as Fact, Reported, Inference, or Assumption.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
              <AlertTriangle aria-hidden size={14} />
              No Outlook connection, Graph access, IMAP/SMTP, or email sending is used here.
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent batches</p>
                <p className="mt-1 text-xs text-slate-500">
                  Select a batch to inspect its summary and item-level statuses.
                </p>
              </div>
              <FolderInput aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {sortedBatches.length > 0 ? (
                sortedBatches.map((batch) => (
                  <button
                    key={batch.batch_id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.batch_id)}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      batch.batch_id === selectedBatchId
                        ? "border-teal-300 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{batch.source_label}</p>
                        <p className="mt-1 text-xs text-slate-500">{batch.workspace_assignment}</p>
                      </div>
                      <StatusBadge tone={batchStatusTone[batch.status]}>
                        {batchStatusLabel(batch.status)}
                      </StatusBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{batch.batch_mode.replace(/-/g, " ")}</span>
                      <span>Parsed: {batch.parsed_successfully}</span>
                      <span>Warnings: {batch.warnings}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">No batches yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Run the first bulk intake batch to populate this list.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Batch summary
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  The latest selected batch shows status, counts, warnings, and any links preserved during intake.
                </p>
              </div>
              <LoaderCircle aria-hidden className="text-teal-700" size={18} />
            </div>

            {!selectedBatch ? (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">No bulk batch yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Run a bulk intake batch to see the summary and item-level statuses here.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge tone={batchStatusTone[selectedBatch.status]}>
                    {batchStatusLabel(selectedBatch.status)}
                  </StatusBadge>
                  <StatusBadge tone="neutral">{selectedBatch.workspace_assignment}</StatusBadge>
                  <StatusBadge tone="neutral">{selectedBatch.batch_mode.replace(/-/g, " ")}</StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedBatchSummary.map((entry) => (
                    <div key={entry.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{entry.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{entry.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <DetailRow label="Source label" value={selectedBatch.source_label} />
                  <DetailRow label="Notes" value={selectedBatch.notes || "No notes captured."} />
                  <DetailRow
                    label="Case link"
                    value={selectedBatch.linked_case_id ?? "Not linked to a case"}
                  />
                  <DetailRow
                    label="Assurance link"
                    value={selectedBatch.linked_assurance_signal_id ?? "Not linked to an assurance signal"}
                  />
                  <DetailRow
                    label="Support item link"
                    value={selectedBatch.linked_support_item_id ?? "Not linked to a vessel support item"}
                  />
                  <DetailRow
                    label="Archive evidence"
                    value={selectedBatch.original_archive_evidence_id ?? "No archive preservation evidence"}
                  />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Batch warnings
                  </p>
                  {selectedBatch.warnings > 0 ? (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      This batch recorded {selectedBatch.warnings} warning{selectedBatch.warnings === 1 ? "" : "s"}.
                      Review skipped, unsupported, and failed entries below.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      No warnings were recorded for this batch.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Per-item status
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Each processed file keeps its own parse and evidence status.
                </p>
              </div>
              <FileText aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => (
                  <div key={item.batch_item_id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{item.file_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.source_path_in_archive ? `Archive path: ${item.source_path_in_archive}` : "Direct upload"}
                        </p>
                      </div>
                      <StatusBadge tone={itemStatusTone[item.status]}>{itemStatusLabel(item.status)}</StatusBadge>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.note}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Paperclip aria-hidden size={12} />
                        {item.file_size_bytes ? formatEvidenceSize(item.file_size_bytes) : "Unknown size"}
                      </span>
                      {item.evidence_id ? <span>Evidence: {item.evidence_id}</span> : null}
                      {item.thread_id ? <span>Thread: {item.thread_id}</span> : null}
                      {item.message_id ? <span>Message: {item.message_id}</span> : null}
                      {item.parse_status ? <span>Parse: {item.parse_status}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">No items yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Process a batch to populate the per-item parsed, evidence-only, preservation-only, skipped,
                    failed, and unsupported states.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Workflow note</p>
            <p className="mt-2 text-sm leading-6 text-teal-950">
              ZIP ingestion is safe only because extraction stays server-side, path traversal is blocked, file count
              and size limits are enforced, and unsupported content is skipped rather than crashing the app.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-teal-800">
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1.5">No public file URLs</span>
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1.5">No Outlook connection</span>
              <span className="rounded-full border border-teal-200 bg-white px-3 py-1.5">No PST parsing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
