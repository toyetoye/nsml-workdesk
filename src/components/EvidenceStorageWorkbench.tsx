"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileUp,
  FolderOpen,
  Link2,
  MapPin,
  Paperclip,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  parseEvidenceMetadataAction,
  saveEvidenceUploadAction,
} from "@/app/(protected)/evidence/actions";
import {
  importSourceTypes,
  importWorkspaceAssignments,
  type EmailThread,
  type EmailParseStatus,
  type EvidenceRecord,
  type EvidenceStatus,
  type EvidenceStorageState,
  type ImportSourceType,
  type ImportWorkspaceAssignment,
  type StatusTone,
} from "@/lib/mock-data";
import {
  buildEvidenceRecordFromSubmission,
  formatEvidenceSize,
  isEvidenceEligibleForEmlParsing,
} from "@/lib/workbench-data";
import { StatusBadge } from "@/components/StatusBadge";
import { formatParseStatusLabel } from "@/lib/email-ingestion/shared";

type EvidenceFormState = {
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  status: EvidenceStatus;
  description: string;
  linkedIntakeItemRef: string;
  linkedCaseRef: string;
  file: File | null;
  fileLabel: string;
};

type EvidenceStorageWorkbenchProps = {
  initialEvidence: EvidenceRecord[];
  persistenceEnabled: boolean;
  parsingEnabled?: boolean;
  mode: "import" | "case";
  selectedCaseId?: string | null;
  selectedCaseLabel?: string | null;
  defaultWorkspaceAssignment?: ImportWorkspaceAssignment;
  compact?: boolean;
  onEvidenceSaved?: (record: EvidenceRecord) => void;
  onParsedCorrespondenceThread?: (thread: EmailThread | null) => void;
};

const evidenceStatusTone: Record<EvidenceStatus, StatusTone> = {
  Linked: "accent",
  "Needs Review": "warning",
  Pending: "neutral",
};

const storageStateTone: Record<EvidenceStorageState, StatusTone> = {
  uploaded: "accent",
  staged: "warning",
  "metadata-only": "neutral",
  "fallback-prototype": "danger",
};

const parseStatusTone: Record<EmailParseStatus, StatusTone> = {
  "not parsed": "warning",
  parsing: "accent",
  parsed: "accent",
  failed: "danger",
  unsupported: "neutral",
};

function itemSourceLabel(sourceType: ImportSourceType) {
  return importSourceTypes.find((source) => source.value === sourceType)?.label ?? sourceType;
}

function storageStateLabel(state: EvidenceStorageState) {
  switch (state) {
    case "uploaded":
      return "Uploaded";
    case "staged":
      return "Staged";
    case "fallback-prototype":
      return "Fallback prototype";
    case "metadata-only":
    default:
      return "Metadata only";
  }
}

function evidenceTypeLabel(record: EvidenceRecord) {
  return record.type === "eml-placeholder"
    ? "EML placeholder"
    : record.type.charAt(0).toUpperCase() + record.type.slice(1);
}

function filterEvidenceRecords(
  records: EvidenceRecord[],
  mode: "import" | "case",
  selectedCaseId?: string | null,
) {
  if (mode === "import") {
    return records.filter(
      (record) =>
        record.workspaceAssignment === "Import/Staging" ||
        record.linkedCaseId === null,
    );
  }

  if (!selectedCaseId) {
    return records;
  }

  return records.filter(
    (record) => record.linkedCaseId === selectedCaseId || record.linkedCaseRef === selectedCaseId,
  );
}

export function EvidenceStorageWorkbench({
  initialEvidence,
  persistenceEnabled,
  parsingEnabled = false,
  mode,
  selectedCaseId = null,
  selectedCaseLabel = null,
  defaultWorkspaceAssignment = "Import/Staging",
  compact = false,
  onEvidenceSaved,
  onParsedCorrespondenceThread,
}: EvidenceStorageWorkbenchProps) {
  const router = useRouter();
  const [records, setRecords] = useState<EvidenceRecord[]>(() =>
    filterEvidenceRecords(initialEvidence, mode, selectedCaseId),
  );
  const [selectedId, setSelectedId] = useState<string>(
    filterEvidenceRecords(initialEvidence, mode, selectedCaseId)[0]?.evidenceId ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [parsingEvidenceId, setParsingEvidenceId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [form, setForm] = useState<EvidenceFormState>(() => ({
    title: "",
    sourceType: mode === "case" ? "document-placeholder" : "pasted-email",
    workspaceAssignment: defaultWorkspaceAssignment,
    status: "Pending",
    description: "",
    linkedIntakeItemRef: "",
    linkedCaseRef: selectedCaseLabel ?? "",
    file: null,
    fileLabel: "",
  }));

  const displayRecords = useMemo(
    () => filterEvidenceRecords(records, mode, selectedCaseId),
    [mode, records, selectedCaseId],
  );

  const selectedRecord = useMemo(
    () => displayRecords.find((item) => item.evidenceId === selectedId) ?? displayRecords[0] ?? null,
    [displayRecords, selectedId],
  );
  const selectedRecordEligibleForParsing = selectedRecord
    ? isEvidenceEligibleForEmlParsing({
        sourceType: selectedRecord.sourceType,
        originalFilename: selectedRecord.originalFilename,
        mimeType: selectedRecord.mimeType,
        type: selectedRecord.type,
      })
    : false;

  const contextLabel =
    mode === "case"
      ? `Context: ${selectedCaseLabel ?? "Current case"}`
      : "Context: Import staging";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveNotice(null);

    const formData = new FormData();
    formData.set("redirectTo", mode === "case" ? "/cases" : "/import");
    formData.set("mode", mode);
    formData.set("title", form.title);
    formData.set("sourceType", form.sourceType);
    formData.set("workspaceAssignment", form.workspaceAssignment);
    formData.set("status", form.status);
    formData.set("description", form.description);
    formData.set("linkedIntakeItemRef", form.linkedIntakeItemRef);
    formData.set("linkedCaseRef", form.linkedCaseRef);
    formData.set("linkedCaseId", selectedCaseId ?? "");
    formData.set("sourceLabel", mode === "case" ? selectedCaseLabel ?? "Case attachment" : "Import staging");

    if (form.file) {
      formData.set("file", form.file);
    }

    try {
      const result = await saveEvidenceUploadAction(formData);
      const nextRecord = result.evidenceRecord;

      setRecords((current) => [nextRecord, ...current.filter((item) => item.evidenceId !== nextRecord.evidenceId)]);
      setSelectedId(nextRecord.evidenceId);
      setSaveNotice(
        result.storageState === "uploaded"
          ? result.persisted
            ? "Uploaded to the private bucket and saved as evidence metadata."
            : "Uploaded to the private bucket, but metadata fell back to session state."
          : result.storageNote,
      );
      onEvidenceSaved?.(nextRecord);
    } catch {
      const fallbackRecord = buildEvidenceRecordFromSubmission({
        title: form.title,
        sourceType: form.sourceType,
        workspaceAssignment: form.workspaceAssignment,
        status: form.status,
        description: form.description,
        linkedIntakeItemRef: form.linkedIntakeItemRef,
        linkedCaseRef: form.linkedCaseRef || selectedCaseId || "Evidence case placeholder",
        linkedCaseId: selectedCaseId,
        sourceLabel: mode === "case" ? selectedCaseLabel ?? "Case attachment" : "Import staging",
        fileName: form.file?.name ?? null,
        fileSizeBytes: form.file?.size ?? null,
        mimeType: form.file?.type || null,
        storageState: "fallback-prototype",
        storageBucket: null,
        storagePath: null,
        uploadedAt: new Date().toISOString(),
      });

      setRecords((current) => [fallbackRecord, ...current.filter((item) => item.evidenceId !== fallbackRecord.evidenceId)]);
      setSelectedId(fallbackRecord.evidenceId);
      setSaveNotice("Storage is unavailable, so the evidence remains a session-only prototype.");
      onEvidenceSaved?.(fallbackRecord);
    } finally {
      setSaving(false);
      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        linkedIntakeItemRef: "",
        linkedCaseRef: selectedCaseLabel ?? "",
        file: null,
        fileLabel: "",
        workspaceAssignment: defaultWorkspaceAssignment,
        sourceType: mode === "case" ? "document-placeholder" : "pasted-email",
        status: "Pending",
      }));
    }
  }

  async function handleParseEvidence(record: EvidenceRecord) {
    setParsingEvidenceId(record.evidenceId);
    setSaveNotice(null);

    try {
      const formData = new FormData();
      formData.set("redirectTo", mode === "case" ? "/cases" : "/import");
      formData.set("evidenceId", record.evidenceId);
      formData.set("mode", mode);

      const result = await parseEvidenceMetadataAction(formData);

      setRecords((current) =>
        current.map((item) =>
          item.evidenceId === result.evidenceRecord.evidenceId ? result.evidenceRecord : item,
        ),
      );
      setSelectedId(result.evidenceRecord.evidenceId);
      setSaveNotice(result.note);
      onParsedCorrespondenceThread?.(result.parsedThread ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Parsing failed.";
      setSaveNotice(message);
    } finally {
      setParsingEvidenceId(null);
      router.refresh();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setForm((current) => ({
      ...current,
      file,
      fileLabel: file ? `${file.name} · ${formatEvidenceSize(file.size)}` : "",
    }));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            {mode === "case" ? "Attach evidence" : "Evidence upload and staging"}
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            {mode === "case" ? "Case evidence intake" : "Private evidence storage"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {mode === "case"
              ? "Upload or stage evidence against the selected case without exposing public file links or parsing file contents."
              : "Imported files, screenshots, documents, and future EML archives can be staged here before they are linked into a case."}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <WandSparkles aria-hidden size={16} />
          {persistenceEnabled ? "Repository connected" : "Session fallback only"}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {contextLabel}
      </div>

      {saveNotice ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
          {saveNotice}
        </div>
      ) : null}

      <div className={compact ? "grid gap-4" : "grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"}>
        <div className="space-y-4">
          <form className="card p-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {mode === "case" ? "Attach or stage evidence" : "Upload or stage evidence"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === "case"
                    ? "This action only writes metadata and private storage references when configured."
                    : "Use this for private storage uploads or session-only staging when storage is unavailable."}
                </p>
              </div>
              <FileUp aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="field-input"
                  placeholder="e.g. Uploaded repair photo pack"
                />
              </Field>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Source type">
                  <select
                    value={form.sourceType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sourceType: event.target.value as ImportSourceType,
                      }))
                    }
                    className="field-input"
                  >
                    {importSourceTypes.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Workspace assignment">
                  <select
                    value={form.workspaceAssignment}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        workspaceAssignment: event.target.value as ImportWorkspaceAssignment,
                      }))
                    }
                    className="field-input"
                  >
                    {importWorkspaceAssignments.map((workspace) => (
                      <option key={workspace} value={workspace}>
                        {workspace}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Evidence status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as EvidenceStatus,
                      }))
                    }
                    className="field-input"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Linked">Linked</option>
                  </select>
                </Field>

                <Field label="File">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="field-input pt-2"
                    accept=".eml,.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xls,.xlsx,image/*,application/*,message/rfc822"
                  />
                </Field>
              </div>

              <Field label="Description / note">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="field-input min-h-28 resize-y"
                  placeholder="Add a short note about what this file is and why it matters."
                />
              </Field>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Linked intake placeholder">
                  <input
                    value={form.linkedIntakeItemRef}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        linkedIntakeItemRef: event.target.value,
                      }))
                    }
                    className="field-input"
                    placeholder="Optional intake reference"
                  />
                </Field>

                <Field label="Linked case placeholder">
                  <input
                    value={form.linkedCaseRef}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, linkedCaseRef: event.target.value }))
                    }
                    className="field-input"
                    placeholder={mode === "case" ? selectedCaseId ?? "Selected case" : "Optional case reference"}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save evidence"}
                </button>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">File state:</span>{" "}
                  {form.fileLabel || "No file selected"}
                </div>
              </div>
            </div>
          </form>

          <div className="card p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Recent staged / uploaded evidence
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Records show their storage state so we do not imply durable storage when it is not available.
                </p>
              </div>
              <Upload aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {displayRecords.length > 0 ? (
                displayRecords.map((record) => {
                  const selected = record.evidenceId === selectedRecord?.evidenceId;

                  return (
                    <button
                      key={record.evidenceId}
                      type="button"
                      onClick={() => setSelectedId(record.evidenceId)}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        selected
                          ? "border-teal-300 bg-teal-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{record.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {record.originalFilename ?? "No file name yet"}
                          </p>
                        </div>
                        <StatusBadge tone={evidenceStatusTone[record.status]}>{record.status}</StatusBadge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <StatusBadge tone={storageStateTone[record.storageState]}>
                          {storageStateLabel(record.storageState)}
                        </StatusBadge>
                        <StatusBadge tone={parseStatusTone[record.parseStatus]}>
                          {formatParseStatusLabel(record.parseStatus)}
                        </StatusBadge>
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden size={12} />
                          {record.workspaceAssignment}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Paperclip aria-hidden size={12} />
                          {formatEvidenceSize(record.fileSizeBytes)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyStateCard
                  title={mode === "case" ? "No evidence linked yet" : "No staged evidence yet"}
                  message={
                    mode === "case"
                      ? "Attach the first evidence item to this case when it is ready."
                      : "Upload or stage the first evidence item here."
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Selected evidence detail
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">
                  {selectedRecord?.title ?? "No evidence selected"}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {selectedRecord
                    ? "Evidence records show file metadata, storage state, and placeholder links without exposing public file URLs."
                    : "Create or select an evidence record to inspect its metadata."}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {displayRecords.length} item{displayRecords.length === 1 ? "" : "s"}
              </div>
            </div>

            {!selectedRecord ? (
              <div className="mt-4">
                <EmptyStateCard
                  title="Nothing to inspect yet"
                  message="Use the upload form to add an evidence item."
                />
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <DetailRow label="Storage state" value={storageStateLabel(selectedRecord.storageState)} />
                  <DetailRow label="Evidence type" value={evidenceTypeLabel(selectedRecord)} />
                  <DetailRow label="Source type" value={itemSourceLabel(selectedRecord.sourceType)} />
                  <DetailRow label="Workspace assignment" value={selectedRecord.workspaceAssignment} />
                  <DetailRow
                    label="Original filename"
                    value={selectedRecord.originalFilename ?? "No file uploaded yet"}
                  />
                  <DetailRow
                    label="MIME type"
                    value={selectedRecord.mimeType ?? "Unknown MIME type"}
                  />
                  <DetailRow
                    label="File size"
                    value={formatEvidenceSize(selectedRecord.fileSizeBytes)}
                  />
                  <DetailRow label="Uploaded / created" value={selectedRecord.date} />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Parse state
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {formatParseStatusLabel(selectedRecord.parseStatus)}
                      </p>
                    </div>

                    {selectedRecordEligibleForParsing ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={parsingEvidenceId === selectedRecord.evidenceId || !parsingEnabled}
                        onClick={() => handleParseEvidence(selectedRecord)}
                      >
                        {parsingEvidenceId === selectedRecord.evidenceId
                          ? "Parsing..."
                          : selectedRecord.parseStatus === "parsed"
                            ? "Re-parse EML metadata"
                            : "Parse EML metadata"}
                      </button>
                    ) : (
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        This evidence is not eligible for EML parsing.
                      </div>
                    )}
                  </div>

                  {!parsingEnabled ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
                      Private storage is not fully configured, so EML parsing remains disabled for
                      now.
                    </div>
                  ) : null}

                  {selectedRecord.parseError ? (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-950">
                      {selectedRecord.parseError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description / note
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                      {selectedRecord.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Links
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p className="flex items-start gap-2">
                          <Link2 aria-hidden className="mt-0.5 text-teal-700" size={14} />
                          <span>{selectedRecord.linkedIntakeItemRef}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <FolderOpen aria-hidden className="mt-0.5 text-teal-700" size={14} />
                          <span>{selectedRecord.linkedCaseRef}</span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        Storage note
                      </p>
                      <p className="mt-2 text-sm leading-6 text-teal-950">
                        {selectedRecord.storageState === "uploaded"
                          ? "The file is stored privately. Later viewing should use signed URLs or a server-mediated download."
                          : selectedRecord.storageState === "staged"
                            ? "The file is staged and has not yet been durably stored."
                            : selectedRecord.storageState === "fallback-prototype"
                              ? "Storage was unavailable, so this record is session-only prototype state."
                              : "This record contains metadata only. File storage is not yet attached."}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
                        <ArrowRight aria-hidden size={14} />
                        No public file URL is exposed
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
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

function EmptyStateCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
