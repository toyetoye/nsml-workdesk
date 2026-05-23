"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowRight,
  ClipboardList,
  FolderOpen,
  MapPin,
  Paperclip,
  PlusCircle,
  Route,
  Upload,
  WandSparkles,
} from "lucide-react";
import { saveIntakeItemAction } from "@/app/(protected)/import/actions";
import { generateIntakeDraftAction, triageIntakeItemAction } from "@/app/(protected)/ai/actions";
import { TriageResultPanel } from "@/components/TriageResultPanel";
import { DraftResultPanel } from "@/components/DraftResultPanel";
import {
  buildIntakeItemFromSubmission,
  type IntakeSubmission,
} from "@/lib/workbench-data";
import type { DraftMode } from "@/lib/ai/draft-modes";
import {
  importIntakeStatuses,
  importSourceTypes,
  importWorkspaceAssignments,
  type ImportIntakeItem,
  type ImportIntakeStatus,
  type ImportSourceType,
  type ImportWorkspaceAssignment,
  type StatusTone,
  type EvidenceRecord,
} from "@/lib/mock-data";
import type { AiConfigStatus, TriageRunOutcome } from "@/lib/ai/types";
import type { DraftRunOutcome } from "@/lib/ai/types";
import { StatusBadge } from "@/components/StatusBadge";

type IntakeFormState = {
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  status: ImportIntakeStatus;
  senderSource: string;
  dateTime: string;
  bodyContent: string;
  tags: string;
};

type ImportIntakeWorkbenchProps = {
  initialItems: ImportIntakeItem[];
  initialEvidence: EvidenceRecord[];
  persistenceEnabled: boolean;
  aiConfig: AiConfigStatus;
  writingStyleProfileName?: string | null;
};

const statusTone: Record<ImportIntakeStatus, StatusTone> = {
  unclassified: "neutral",
  "pending-my-reply": "warning",
  "waiting-on-vessel": "neutral",
  "waiting-on-vendor": "neutral",
  "waiting-on-class": "neutral",
  "waiting-on-management": "neutral",
  "decision-required": "warning",
  "needs-evidence": "danger",
  monitoring: "accent",
};

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function itemStatusLabel(status: ImportIntakeStatus) {
  return importIntakeStatuses.find((entry) => entry.value === status)?.label ?? status;
}

function itemSourceLabel(sourceType: ImportSourceType) {
  return importSourceTypes.find((entry) => entry.value === sourceType)?.label ?? sourceType;
}

export function ImportIntakeWorkbench({
  initialItems,
  initialEvidence,
  persistenceEnabled,
  aiConfig,
  writingStyleProfileName,
}: ImportIntakeWorkbenchProps) {
  const initialList = initialItems.length > 0 ? initialItems : [];
  const [items, setItems] = useState<ImportIntakeItem[]>(() => initialList);
  const [selectedId, setSelectedId] = useState<string>(initialList[0]?.id ?? "");
  const [routeTarget, setRouteTarget] = useState<ImportWorkspaceAssignment>(
    initialList[0]?.workspaceAssignment ?? "Import/Staging",
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [triageOutcome, setTriageOutcome] = useState<TriageRunOutcome | null>(null);
  const [triageNote, setTriageNote] = useState<string | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [triaging, setTriaging] = useState(false);
  const [triageTargetId, setTriageTargetId] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState<DraftMode>("normal_technical_reply");
  const [draftOutcome, setDraftOutcome] = useState<DraftRunOutcome | null>(null);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftGenerating, setDraftGenerating] = useState(false);
  const [draftTargetId, setDraftTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<IntakeFormState>(() => ({
    title: "",
    sourceType: "pasted-email",
    workspaceAssignment: "Import/Staging",
    status: "unclassified",
    senderSource: "",
    dateTime: toDateTimeLocalValue(new Date()),
    bodyContent: "",
    tags: "",
  }));

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );
  const selectedEvidenceRecords = useMemo(
    () =>
      selectedItem
        ? initialEvidence.filter(
            (record) =>
              record.linkedIntakeItemRef === selectedItem.id ||
              record.linkedIntakeItemRef === selectedItem.title ||
              record.linkedIntakeItemRef === selectedItem.createdLabel,
          )
        : [],
    [initialEvidence, selectedItem],
  );
  const selectedTriageSourceIds = useMemo(
    () => [selectedItem?.id, ...selectedEvidenceRecords.map((record) => record.evidenceId)].filter(
      Boolean,
    ) as string[],
    [selectedEvidenceRecords, selectedItem?.id],
  );
  const activeTriageTargetId = selectedItem?.id ?? null;
  const activeTriageOutcome =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageOutcome : null;
  const activeTriageNote =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageNote : null;
  const activeTriageError =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageError : null;
  const activeTriageRunning =
    triageTargetId && triageTargetId === activeTriageTargetId ? triaging : false;

  const activeDraftTargetId = selectedItem?.id ?? null;
  const activeDraftOutcome =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftOutcome : null;
  const activeDraftNote =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftNote : null;
  const activeDraftError =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftError : null;
  const activeDraftRunning =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftGenerating : false;

  const selectedSourceLabel = useMemo(
    () =>
      importSourceTypes.find((source) => source.value === form.sourceType)?.label ?? 
      form.sourceType,
    [form.sourceType],
  );

  const selectedStatusLabel = useMemo(
    () =>
      importIntakeStatuses.find((status) => status.value === form.status)?.label ?? form.status,
    [form.status],
  );

  async function handleTriageSelectedItem() {
    if (!selectedItem || !aiConfig.enabled || triaging) {
      return;
    }

    setTriageTargetId(selectedItem.id);
    setTriaging(true);
    setTriageError(null);
    setTriageNote(null);

    try {
      const result = await triageIntakeItemAction({
        item: selectedItem,
        evidenceRecords: selectedEvidenceRecords,
      });

      setTriageOutcome(result);
      setTriageNote(result.note);
    } catch (error) {
      setTriageOutcome(null);
      setTriageError(error instanceof Error ? error.message : "AI triage failed.");
    } finally {
      setTriaging(false);
    }
  }

  async function handleGenerateDraftSelectedItem() {
    if (!selectedItem || !aiConfig.enabled || draftGenerating) {
      return;
    }

    setDraftTargetId(selectedItem.id);
    setDraftGenerating(true);
    setDraftError(null);
    setDraftNote(null);

    try {
      const result = await generateIntakeDraftAction({
        item: selectedItem,
        evidenceRecords: selectedEvidenceRecords,
        mode: draftMode,
        triageResult: activeTriageOutcome?.triageResult ?? null,
        triageAuditLogId: activeTriageOutcome?.auditLogId ?? null,
      });

      setDraftOutcome(result);
      setDraftNote(result.note);
    } catch (error) {
      setDraftOutcome(null);
      setDraftError(error instanceof Error ? error.message : "AI draft generation failed.");
    } finally {
      setDraftGenerating(false);
    }
  }

  async function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveNotice(null);

    const submission: IntakeSubmission = {
      title: form.title,
      sourceType: form.sourceType,
      workspaceAssignment: form.workspaceAssignment,
      status: form.status,
      senderSource: form.senderSource,
      dateTime: form.dateTime,
      bodyContent: form.bodyContent,
      tags: form.tags,
    };

    try {
      const result = await saveIntakeItemAction(submission);
      setItems((current) => [result.item, ...current]);
      setSelectedId(result.item.id);
      setRouteTarget(result.item.workspaceAssignment);
      setSaveNotice(
        result.persisted
          ? "Saved to the repository and added to the local intake view."
          : "Saved locally for this session only.",
      );
    } catch {
      const nextItem = buildIntakeItemFromSubmission(submission);
      setItems((current) => [nextItem, ...current]);
      setSelectedId(nextItem.id);
      setRouteTarget(nextItem.workspaceAssignment);
      setSaveNotice("Saved locally for this session only.");
    } finally {
      setSaving(false);
    }

    setForm((current) => ({
      ...current,
      title: "",
      senderSource: "",
      bodyContent: "",
      tags: "",
      workspaceAssignment: "Import/Staging",
      status: "unclassified",
      sourceType: "pasted-email",
      dateTime: toDateTimeLocalValue(new Date()),
    }));
  }

  function handleRouteSelectedItem() {
    if (!selectedItem) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              workspaceAssignment: routeTarget,
              routeNote:
                routeTarget === "Import/Staging"
                  ? "Still staged for manual classification."
                  : `Simulated assignment to ${routeTarget}.`,
            }
          : item,
      ),
    );
  }

  return (
    <section id="manual-intake" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Import Intake Workbench
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Manual intake and staging</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Imported material enters here first. This prototype keeps intake, classification, and
            correspondence review visible without adding backend storage or routing.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <WandSparkles aria-hidden size={16} />
          {persistenceEnabled ? "Repository connected" : "Session fallback only"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          Current intake state
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          {selectedItem
            ? selectedItem.workspaceAssignment === "Import/Staging"
              ? "Staged"
              : `Linked to ${selectedItem.workspaceAssignment}`
            : "No intake item selected"}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          {selectedItem ? itemStatusLabel(selectedItem.status) : "No intake item selected"}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          {activeTriageOutcome ? "Triaged" : "Pending triage"}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          {writingStyleProfileName ?? "Default safe writing style"}
        </span>
      </div>

      {saveNotice ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
          {saveNotice}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="space-y-4">
          <form className="card p-4" onSubmit={handleCreateItem}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Manual intake form
                </p>
                <p className="mt-1 text-xs text-slate-500">Paste an email, note, or intake stub.</p>
              </div>
              <PlusCircle aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Subject / title">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="field-input"
                  placeholder="e.g. Class survey request awaiting evidence"
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
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as ImportIntakeStatus,
                      }))
                    }
                    className="field-input"
                  >
                    {importIntakeStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Sender / source">
                  <input
                    type="text"
                    value={form.senderSource}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, senderSource: event.target.value }))
                    }
                    className="field-input"
                    placeholder="e.g. Operations Inbox &lt;ops@nsml.example&gt;"
                  />
                </Field>
              </div>

              <Field label="Date / time received or created">
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dateTime: event.target.value }))
                  }
                  className="field-input"
                />
              </Field>

              <Field label="Body / content">
                <textarea
                  value={form.bodyContent}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bodyContent: event.target.value }))
                  }
                  className="field-input min-h-32 resize-y"
                  placeholder="Paste the email body, note, or intake summary here."
                />
              </Field>

              <Field label="Tags / topic">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  className="field-input"
                  placeholder="class, evidence, AT10"
                />
              </Field>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save intake item"}
                </button>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Preview:</span> {selectedSourceLabel} ·{" "}
                  {selectedStatusLabel}
                </div>
              </div>
            </div>
          </form>

          <div className="card p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  File upload placeholder
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Real file storage and parsing are not active yet.
                </p>
              </div>
              <Upload aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Drop files here later</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This is only a visual placeholder for the future intake of images, PDFs, and EML
                attachments.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" className="btn-secondary" disabled>
                  Choose file
                </button>
                <span className="text-xs text-slate-500">Disabled until a later sprint.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Recent intake / import batch list
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Session list of intake items and simulated classifications.
                </p>
              </div>
              <ClipboardList aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {items.length > 0 ? (
                items.map((item) => {
                  const active = item.id === selectedItem?.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setRouteTarget(item.workspaceAssignment);
                      }}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        active
                          ? "border-teal-300 bg-teal-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-600">{item.senderSource}</p>
                        </div>
                        <StatusBadge tone={statusTone[item.status]}>{itemStatusLabel(item.status)}</StatusBadge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden size={12} />
                          {item.workspaceAssignment}
                        </span>
                        <span>{item.dateTime}</span>
                        <span className="inline-flex items-center gap-1">
                          <Paperclip aria-hidden size={12} />
                          {item.tags.length} tags
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyStateCard
                  title="No intake items yet"
                  message="Use the manual intake form to stage the first item."
                />
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Selected intake detail view
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">
                  {selectedItem?.title ?? "No intake item selected"}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Selected items stay in memory so we can simulate intake without backend
                  persistence.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {items.length} item{items.length === 1 ? "" : "s"} in session
              </div>
            </div>

            {!selectedItem ? (
              <div className="mt-4">
                <EmptyStateCard
                  title="Nothing to inspect yet"
                  message="Create an intake item to see the detail view."
                />
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <DetailRow label="Source type" value={itemSourceLabel(selectedItem.sourceType)} />
                  <DetailRow
                    label="Workspace assignment"
                    value={selectedItem.workspaceAssignment}
                  />
                  <DetailRow label="Status" value={itemStatusLabel(selectedItem.status)} />
                  <DetailRow label="Sender / source" value={selectedItem.senderSource} />
                  <DetailRow label="Date / time" value={selectedItem.dateTime} />
                  <DetailRow label="Linked case" value={selectedItem.casePlaceholder} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <InfoCallout
                    title="Workflow state"
                    value={
                      selectedItem.workspaceAssignment === "Import/Staging"
                        ? "Staged for review"
                        : `Linked to ${selectedItem.workspaceAssignment}`
                    }
                    icon={Route}
                  />
                  <InfoCallout
                    title="Next best action"
                    value={
                      selectedEvidenceRecords.length > 0
                        ? activeTriageOutcome
                          ? "Draft a reply, then run red-team review before copying."
                          : "Run triage so the item has a clearer case and response path."
                        : "Upload evidence or add context first, then triage."
                    }
                    icon={ArrowRight}
                  />
                  <InfoCallout
                    title="Draft style"
                    value={writingStyleProfileName ?? "Default safe writing style"}
                    icon={WandSparkles}
                  />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Body / content
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
                      {selectedItem.bodyContent}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Tags / topic
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedItem.tags.length > 0 ? (
                          selectedItem.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">No tags captured yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Routing controls
                    </p>
                    <p className="mt-2 text-sm leading-6 text-teal-950">
                      Route to workspace is simulated in session state only.
                    </p>

                    <div className="mt-3 space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-teal-700">
                        Route to workspace
                      </label>
                      <select
                        value={routeTarget}
                        onChange={(event) =>
                          setRouteTarget(event.target.value as ImportWorkspaceAssignment)
                        }
                        className="field-input border-teal-200 bg-white"
                      >
                        {importWorkspaceAssignments.map((workspace) => (
                          <option key={workspace} value={workspace}>
                            {workspace}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="btn-primary" onClick={handleRouteSelectedItem}>
                          Route to workspace
                        </button>
                        <button type="button" className="btn-secondary" disabled>
                          Create case from this
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={!selectedItem || !aiConfig.enabled || triaging}
                          onClick={handleTriageSelectedItem}
                        >
                          {triaging ? "Triage..." : "Triage / Analyze"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Draft generation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Generate an unreviewed draft from the selected intake item. Red-team review is
                      still required later.
                    </p>
                    <div className="mt-3 space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Draft mode
                      </label>
                      <select
                        value={draftMode}
                        onChange={(event) => setDraftMode(event.target.value as DraftMode)}
                        className="field-input"
                      >
                        {[
                          "holding_statement",
                          "normal_technical_reply",
                          "firm_but_polite",
                          "management_summary",
                          "vessel_instruction",
                          "vendor_clarification",
                          "owner_charterer_sensitive",
                        ].map((mode) => (
                          <option key={mode} value={mode}>
                            {mode.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={!selectedItem || !aiConfig.enabled || draftGenerating}
                          onClick={handleGenerateDraftSelectedItem}
                        >
                          {draftGenerating ? "Generating..." : "Generate draft"}
                        </button>
                        <span className="text-xs text-slate-500">
                          AI draft generation is advisory only.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <TriageResultPanel
                    sourceType="intake_item"
                    sourceLabel={selectedItem.title}
                    sourceIds={selectedTriageSourceIds}
                    result={activeTriageOutcome?.triageResult ?? null}
                    running={activeTriageRunning}
                    note={activeTriageNote}
                    disabledReason={aiConfig.enabled ? null : aiConfig.message}
                    auditLogId={activeTriageOutcome?.auditLogId ?? null}
                    persisted={activeTriageOutcome?.persisted}
                    provider={activeTriageOutcome?.provider ?? null}
                    model={activeTriageOutcome?.model ?? null}
                  />
                  {activeTriageError ? (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
                      {activeTriageError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                <DraftResultPanel
                  sourceType="intake_item"
                  sourceLabel={selectedItem.title}
                  sourceIds={selectedTriageSourceIds}
                  draftRecordId={activeDraftOutcome?.draftRecordId ?? null}
                  result={activeDraftOutcome?.draftResult ?? null}
                  running={activeDraftRunning}
                  note={activeDraftNote}
                  disabledReason={aiConfig.enabled ? null : aiConfig.message}
                  reviewDisabledReason={aiConfig.enabled ? null : aiConfig.message}
                  persisted={activeDraftOutcome?.persisted}
                  provider={activeDraftOutcome?.provider ?? null}
                  model={activeDraftOutcome?.model ?? null}
                  triageAuditLogId={activeDraftOutcome?.triageAuditLogId ?? null}
                  writingStyleProfileName={writingStyleProfileName ?? null}
                />
                  {activeDraftError ? (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
                      {activeDraftError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoCallout
                    title="Current route note"
                    value={selectedItem.routeNote}
                    icon={Route}
                  />
                  <InfoCallout
                    title="Case placeholder"
                    value="Case creation is not active yet. This item can later be linked manually."
                    icon={FolderOpen}
                  />
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

function InfoCallout({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon aria-hidden size={14} className="text-teal-700" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
        <ArrowRight aria-hidden size={14} />
        Placeholder only
      </div>
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
