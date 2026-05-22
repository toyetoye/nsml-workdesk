"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Archive,
  ArrowRight,
  Building2,
  CalendarDays,
  Filter,
  FolderOpen,
  LockKeyhole,
  Mail,
  MessageSquareQuote,
  Paperclip,
  UserRound,
} from "lucide-react";
import { generateThreadDraftAction, triageThreadAction } from "@/app/(protected)/ai/actions";
import {
  allWorkspaces,
  importedEmailThreads,
  type EmailAttachment,
  type EmailParseStatus,
  type EmailStatus,
  type EmailThread,
  type EmailThreadScope,
  type EvidenceRecord,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { DraftResultPanel } from "@/components/DraftResultPanel";
import { formatParseStatusLabel } from "@/lib/email-ingestion/shared";
import { normalizeCorrespondenceSender, normalizeThreadSubject } from "@/lib/correspondence/threading";
import { TriageResultPanel } from "@/components/TriageResultPanel";
import type { AiConfigStatus, DraftMode, DraftRunOutcome, TriageRunOutcome } from "@/lib/ai/types";

type WorkspaceFilter = "route" | "import" | "unclassified" | EmailThreadScope;
type StatusFilter = EmailStatus | "all";
type ParseFilter = EmailParseStatus | "all";
type CaseFilter = "all" | "linked" | "unlinked";
type AttachmentFilter = "all" | "with-attachments" | "without-attachments";

const statusTone: Record<EmailStatus, "danger" | "warning" | "accent" | "neutral"> = {
  "Pending My Reply": "warning",
  "Waiting on Vessel": "neutral",
  "Needs Evidence": "danger",
  "Draft Ready": "accent",
};

const statusSummary: Record<EmailStatus, string> = {
  "Pending My Reply": "Reply pending",
  "Waiting on Vessel": "Waiting on vessel",
  "Needs Evidence": "Needs evidence",
  "Draft Ready": "Draft ready",
};

const parseTone: Record<EmailParseStatus, "danger" | "warning" | "accent" | "neutral"> = {
  "not parsed": "warning",
  parsing: "accent",
  parsed: "accent",
  failed: "danger",
  unsupported: "neutral",
};

function attachmentCount(thread: EmailThread) {
  return (
    thread.attachments.length +
    thread.messages.reduce((count, message) => count + (message.attachmentMetadata?.length ?? 0), 0)
  );
}

function linkedCaseValue(thread: EmailThread) {
  const value = thread.linkedCase?.trim() ?? "";

  if (!value || /^(unlinked|linked case placeholder)/i.test(value)) {
    return null;
  }

  return value;
}

function sourceEvidenceState(thread: EmailThread, evidenceMap: Map<string, EvidenceRecord>): {
  label: string;
  tone: "danger" | "warning" | "accent" | "neutral";
  note: string;
} {
  if (!thread.sourceEvidenceId) {
    return {
      label: "No source evidence",
      tone: "neutral" as const,
      note: "This thread is not yet linked back to a source evidence record.",
    };
  }

  const evidence = evidenceMap.get(thread.sourceEvidenceId);
  if (!evidence) {
    return {
      label: "Source evidence missing",
      tone: "danger" as const,
      note: `Evidence ${thread.sourceEvidenceId} was not found in the current view.`,
    };
  }

  return {
    label: evidence.status,
    tone:
      evidence.status === "Linked"
        ? "accent"
        : evidence.status === "Needs Review"
          ? "warning"
          : "neutral",
    note: `${evidence.evidenceId} · ${evidence.storageState}`,
  };
}

function threadAttachLabel(thread: EmailThread) {
  const count = attachmentCount(thread);

  if (!count) {
    return "No attachments";
  }

  return `${count} attachment${count === 1 ? "" : "s"}`;
}

function workspaceLabelForScope(scope: EmailThreadScope) {
  if (scope === "import") {
    return "Import staging";
  }

  if (scope === "unclassified") {
    return "Unclassified";
  }

  return allWorkspaces.find((workspace) => workspace.slug === scope)?.name ?? scope;
}

function formatThreadWorkspaceLabel(thread: EmailThread) {
  return thread.workspaceKey === "import"
    ? "Import staging"
    : thread.workspaceKey === "unclassified"
      ? "Unclassified"
      : thread.vesselProject;
}

function countEvidenceAttachments(thread: EmailThread) {
  return thread.messages.reduce(
    (count, message) => count + (message.attachmentMetadata?.length ?? 0),
    thread.attachments.length,
  );
}

function derivePossibleRelatedThreads(thread: EmailThread, candidates: EmailThread[]) {
  const subject = normalizeThreadSubject(thread.subject);
  const sender = normalizeCorrespondenceSender(thread.sender);
  const dateLabel = thread.dateTime.split(",")[0]?.trim().toLowerCase();

  return candidates
    .filter((candidate) => candidate.id !== thread.id)
    .filter((candidate) => normalizeThreadSubject(candidate.subject) === subject)
    .filter((candidate) => normalizeCorrespondenceSender(candidate.sender) === sender)
    .filter((candidate) => candidate.dateTime.split(",")[0]?.trim().toLowerCase() === dateLabel)
    .slice(0, 3);
}

export function EmailWorkbench({
  scope,
  sectionLabel,
  sectionDescription,
  emptyStateTitle,
  emptyStateMessage,
  parsedThreads = [],
  sourceEvidenceRecords = [],
  aiConfig,
  triageRedirectTo = "/import",
}: {
  scope: EmailThreadScope;
  sectionLabel: string;
  sectionDescription: string;
  emptyStateTitle: string;
  emptyStateMessage: string;
  parsedThreads?: EmailThread[];
  sourceEvidenceRecords?: EvidenceRecord[];
  aiConfig: AiConfigStatus;
  triageRedirectTo?: string;
}) {
  const combinedThreads = useMemo(() => {
    const nextThreads = [...importedEmailThreads, ...parsedThreads];
    const deduped = new Map<string, EmailThread>();

    for (const thread of nextThreads) {
      deduped.set(thread.id, thread);
    }

    return [...deduped.values()];
  }, [parsedThreads]);

  const evidenceMap = useMemo(
    () => new Map(sourceEvidenceRecords.map((record) => [record.evidenceId, record] as const)),
    [sourceEvidenceRecords],
  );

  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>(
    scope === "import" ? "route" : scope,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [parseFilter, setParseFilter] = useState<ParseFilter>("all");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("all");
  const [senderFilter, setSenderFilter] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string>("");
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

  const scopedThreads = useMemo(() => {
    if (scope === "import") {
      if (workspaceFilter === "route") {
        return combinedThreads.filter(
          (thread) => thread.workspaceKey === "import" || thread.workspaceKey === "unclassified",
        );
      }

      if (workspaceFilter === "import" || workspaceFilter === "unclassified") {
        return combinedThreads.filter((thread) => thread.workspaceKey === workspaceFilter);
      }

      return combinedThreads.filter((thread) => thread.workspaceKey === workspaceFilter);
    }

    return combinedThreads.filter((thread) => thread.workspaceKey === scope);
  }, [combinedThreads, scope, workspaceFilter]);

  const filteredThreads = useMemo(() => {
    const normalizedSenderFilter = senderFilter.trim().toLowerCase();

    return scopedThreads.filter((thread) => {
      const parseStatus = thread.parseStatus ?? "not parsed";
      const linkedCase = linkedCaseValue(thread);
      const hasAttachments = countEvidenceAttachments(thread) > 0;

      if (statusFilter !== "all" && thread.status !== statusFilter) {
        return false;
      }

      if (parseFilter !== "all" && parseStatus !== parseFilter) {
        return false;
      }

      if (caseFilter === "linked" && !linkedCase) {
        return false;
      }

      if (caseFilter === "unlinked" && linkedCase) {
        return false;
      }

      if (attachmentFilter === "with-attachments" && !hasAttachments) {
        return false;
      }

      if (attachmentFilter === "without-attachments" && hasAttachments) {
        return false;
      }

      if (normalizedSenderFilter) {
        const senderHaystack = `${thread.sender} ${thread.sourceEvidenceId ?? ""}`.toLowerCase();
        if (!senderHaystack.includes(normalizedSenderFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [attachmentFilter, caseFilter, parseFilter, scopedThreads, senderFilter, statusFilter]);

  const activeThread =
    filteredThreads.find((thread) => thread.id === activeThreadId) ?? filteredThreads[0] ?? null;

  const possibleRelatedThreads = useMemo(() => {
    if (!activeThread) {
      return [];
    }

    return derivePossibleRelatedThreads(activeThread, filteredThreads);
  }, [activeThread, filteredThreads]);

  const selectedThreadId =
    filteredThreads.find((thread) => thread.id === activeThreadId)?.id ?? filteredThreads[0]?.id ?? "";
  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ?? filteredThreads[0] ?? null;
  const selectedSourceEvidenceRecords = useMemo(() => {
    if (!selectedThread) {
      return [];
    }

    return sourceEvidenceRecords.filter(
      (record) =>
        record.evidenceId === selectedThread.sourceEvidenceId ||
        record.parsedThreadId === selectedThread.id ||
        record.parsedMessageId === selectedThread.messageIdHeader,
    );
  }, [selectedThread, sourceEvidenceRecords]);
  const selectedTriageSourceIds = useMemo(
    () =>
      [selectedThread?.id, ...selectedSourceEvidenceRecords.map((record) => record.evidenceId)]
        .filter(Boolean)
        .map(String),
    [selectedSourceEvidenceRecords, selectedThread?.id],
  );
  const activeTriageTargetId = selectedThread?.id ?? null;
  const activeTriageOutcome =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageOutcome : null;
  const activeTriageNote =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageNote : null;
  const activeTriageError =
    triageTargetId && triageTargetId === activeTriageTargetId ? triageError : null;
  const activeTriageRunning =
    triageTargetId && triageTargetId === activeTriageTargetId ? triaging : false;

  const activeDraftTargetId = selectedThread?.id ?? null;
  const activeDraftOutcome =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftOutcome : null;
  const activeDraftNote =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftNote : null;
  const activeDraftError =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftError : null;
  const activeDraftRunning =
    draftTargetId && draftTargetId === activeDraftTargetId ? draftGenerating : false;

  const archiveSurfaceVisible = scope === "import";
  const currentWorkspaceLabel = workspaceLabelForScope(scope);

  async function handleTriageSelectedThread() {
    if (!selectedThread || !aiConfig.enabled || triaging) {
      return;
    }

    setTriageTargetId(selectedThread.id);
    setTriaging(true);
    setTriageError(null);
    setTriageNote(null);

    try {
      const result = await triageThreadAction({
        thread: selectedThread,
        evidenceRecords: selectedSourceEvidenceRecords,
        redirectTo: triageRedirectTo,
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

  async function handleGenerateDraftSelectedThread() {
    if (!selectedThread || !aiConfig.enabled || draftGenerating) {
      return;
    }

    setDraftTargetId(selectedThread.id);
    setDraftGenerating(true);
    setDraftError(null);
    setDraftNote(null);

    try {
      const result = await generateThreadDraftAction({
        thread: selectedThread,
        evidenceRecords: selectedSourceEvidenceRecords,
        mode: draftMode,
        redirectTo: triageRedirectTo,
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            {sectionLabel}
          </p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950">Correspondence viewer</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {sectionDescription}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <LockKeyhole aria-hidden size={16} />
          Visual-only
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Workspace: {currentWorkspaceLabel}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter aria-hidden className="text-teal-700" size={18} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Filters</p>
              <p className="mt-1 text-xs text-slate-500">
                Threading remains deterministic. Unclear matches stay separate and may be surfaced as
                possible related.
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {filteredThreads.length} thread{filteredThreads.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {scope === "import" ? (
            <Field label="Workspace">
              <select
                className="field-input"
                value={workspaceFilter}
                onChange={(event) => setWorkspaceFilter(event.target.value as WorkspaceFilter)}
              >
                <option value="route">Staging / unclassified</option>
                <option value="import">Import staging only</option>
                <option value="unclassified">Unclassified only</option>
                {allWorkspaces.map((workspace) => (
                  <option key={workspace.slug} value={workspace.slug}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{currentWorkspaceLabel}</p>
            </div>
          )}

          <Field label="Status">
            <select
              className="field-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="Pending My Reply">Pending My Reply</option>
              <option value="Waiting on Vessel">Waiting on Vessel</option>
              <option value="Needs Evidence">Needs Evidence</option>
              <option value="Draft Ready">Draft Ready</option>
            </select>
          </Field>

          <Field label="Parsed state">
            <select
              className="field-input"
              value={parseFilter}
              onChange={(event) => setParseFilter(event.target.value as ParseFilter)}
            >
              <option value="all">All parse states</option>
              <option value="parsed">Parsed</option>
              <option value="not parsed">Not parsed</option>
              <option value="parsing">Parsing</option>
              <option value="failed">Failed</option>
              <option value="unsupported">Unsupported</option>
            </select>
          </Field>

          <Field label="Case link">
            <select
              className="field-input"
              value={caseFilter}
              onChange={(event) => setCaseFilter(event.target.value as CaseFilter)}
            >
              <option value="all">All</option>
              <option value="linked">Linked to case</option>
              <option value="unlinked">Not linked</option>
            </select>
          </Field>

          <Field label="Attachments">
            <select
              className="field-input"
              value={attachmentFilter}
              onChange={(event) => setAttachmentFilter(event.target.value as AttachmentFilter)}
            >
              <option value="all">All</option>
              <option value="with-attachments">Has attachments</option>
              <option value="without-attachments">No attachments</option>
            </select>
          </Field>

          <Field label="Sender / source">
            <input
              className="field-input"
              value={senderFilter}
              onChange={(event) => setSenderFilter(event.target.value)}
              placeholder="Filter by sender or source"
            />
          </Field>
        </div>
      </div>

      {archiveSurfaceVisible ? (
        <div className="card border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Archive / bulk import planning
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">ZIP / PST / archive import</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Archive extraction is future work. This placeholder keeps the pathway visible without
                implying that ZIP, PST, or archive ingestion is already enabled.
              </p>
            </div>
            <Archive aria-hidden className="text-slate-400" size={20} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary" disabled>
              Prepare archive import
            </button>
            <button type="button" className="btn-secondary" disabled>
              Upload archive bundle
            </button>
            <span className="text-xs text-slate-500">Disabled until archive extraction is approved.</span>
          </div>
        </div>
      ) : null}

      {!filteredThreads.length || !selectedThread ? (
        <EmptyThreads title={emptyStateTitle} message={emptyStateMessage} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="card min-h-[36rem] p-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Thread list
                </p>
                <p className="mt-1 text-xs text-slate-500">Operational correspondence threads</p>
              </div>
              <Mail aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {filteredThreads.map((thread) => {
                const selected = thread.id === selectedThread.id;
                const parseStatus = thread.parseStatus ?? "not parsed";
                const linkedCase = linkedCaseValue(thread);
                const evidenceSummary = sourceEvidenceState(thread, evidenceMap);

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      selected
                        ? "border-teal-300 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{thread.subject}</p>
                        <p className="mt-1 truncate text-xs text-slate-600">{thread.sender}</p>
                      </div>
                      <StatusBadge tone={statusTone[thread.status]}>
                        {statusSummary[thread.status]}
                      </StatusBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Building2 aria-hidden size={12} />
                        {formatThreadWorkspaceLabel(thread)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquareQuote aria-hidden size={12} />
                        {thread.messages.length} message{thread.messages.length === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Paperclip aria-hidden size={12} />
                        {threadAttachLabel(thread)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={parseTone[parseStatus]}>{formatParseStatusLabel(parseStatus)}</StatusBadge>
                      <StatusBadge tone={linkedCase ? "accent" : "neutral"}>
                        {linkedCase ? `Case ${linkedCase}` : "Not linked to case"}
                      </StatusBadge>
                      <StatusBadge tone={evidenceSummary.tone}>{evidenceSummary.label}</StatusBadge>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="card min-h-[36rem] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-950">{selectedThread.subject}</h3>
                  <StatusBadge tone={statusTone[selectedThread.status]}>
                    {statusSummary[selectedThread.status]}
                  </StatusBadge>
                  <StatusBadge tone={parseTone[selectedThread.parseStatus ?? "not parsed"]}>
                    {formatParseStatusLabel(selectedThread.parseStatus ?? "not parsed")}
                  </StatusBadge>
                  {linkedCaseValue(selectedThread) ? (
                    <StatusBadge tone="accent">Case {linkedCaseValue(selectedThread)}</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Operational correspondence thread with deterministic threading and safe metadata only.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected thread
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Triage controls
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Advisory only. Triage never changes the thread automatically.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!aiConfig.enabled || triaging}
                    onClick={handleTriageSelectedThread}
                  >
                    {triaging ? "Triage..." : "Triage thread"}
                  </button>
                  <button type="button" className="btn-secondary" disabled>
                    Link to case
                  </button>
                  <button type="button" className="btn-secondary" disabled>
                    Create case from thread
                  </button>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Draft generation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Generate an unreviewed draft reply from this correspondence thread.
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
                    <option value="holding_statement">Holding statement</option>
                    <option value="normal_technical_reply">Normal technical reply</option>
                    <option value="firm_but_polite">Firm but polite</option>
                    <option value="management_summary">Management summary</option>
                    <option value="vessel_instruction">Vessel instruction</option>
                    <option value="vendor_clarification">Vendor clarification</option>
                    <option value="owner_charterer_sensitive">Owner / charterer sensitive</option>
                  </select>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!aiConfig.enabled || draftGenerating}
                      onClick={handleGenerateDraftSelectedThread}
                    >
                      {draftGenerating ? "Generating..." : "Generate draft"}
                    </button>
                    <span className="text-xs text-slate-500">
                      Copy remains disabled until red-team review exists.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <MetaRow icon={UserRound} label="Sender" value={selectedThread.sender} />
              <MetaRow icon={CalendarDays} label="Date / time" value={selectedThread.dateTime} />
              <MetaRow
                icon={Building2}
                label="Vessel / project"
                value={formatThreadWorkspaceLabel(selectedThread)}
              />
              <MetaRow
                icon={FolderOpen}
                label="Linked case"
                value={linkedCaseValue(selectedThread) ?? "Not linked to case"}
                placeholder={!linkedCaseValue(selectedThread)}
              />
              <MetaRow label="Recipients" value={selectedThread.recipients.join("; ") || "None"} />
              <MetaRow
                label="CC"
                value={selectedThread.cc.length > 0 ? selectedThread.cc.join("; ") : "None"}
              />
              <MetaRow
                label="Message count"
                value={`${selectedThread.messages.length} message${selectedThread.messages.length === 1 ? "" : "s"}`}
              />
              <MetaRow label="Attachment count" value={threadAttachLabel(selectedThread)} />
            </div>

            <section className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Source evidence
                </h4>
                {selectedThread.sourceEvidenceId ? (
                  <StatusBadge tone={sourceEvidenceState(selectedThread, evidenceMap).tone}>
                    {sourceEvidenceState(selectedThread, evidenceMap).label}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">No source evidence</StatusBadge>
                )}
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <MetaRow
                  label="Evidence link"
                  value={selectedThread.sourceEvidenceId ?? "No evidence linked yet"}
                  placeholder={!selectedThread.sourceEvidenceId}
                />
                <MetaRow
                  label="Evidence state"
                  value={
                    selectedThread.sourceEvidenceId && evidenceMap.get(selectedThread.sourceEvidenceId)
                      ? `${evidenceMap.get(selectedThread.sourceEvidenceId)?.status ?? "Linked"} / ${evidenceMap.get(selectedThread.sourceEvidenceId)?.storageState ?? "metadata-only"}`
                      : "No source evidence link yet"
                  }
                  placeholder={!selectedThread.sourceEvidenceId}
                />
              </div>

              {selectedThread.parseError ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-950">
                  {selectedThread.parseError}
                </div>
              ) : null}

              <div className="mt-4">
                <TriageResultPanel
                  sourceType="correspondence_thread"
                  sourceLabel={selectedThread.subject}
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
                  sourceType="correspondence_thread"
                  sourceLabel={selectedThread.subject}
                  sourceIds={selectedTriageSourceIds}
                  result={activeDraftOutcome?.draftResult ?? null}
                  running={activeDraftRunning}
                  note={activeDraftNote}
                  disabledReason={aiConfig.enabled ? null : aiConfig.message}
                  persisted={activeDraftOutcome?.persisted}
                  provider={activeDraftOutcome?.provider ?? null}
                  model={activeDraftOutcome?.model ?? null}
                  triageAuditLogId={activeDraftOutcome?.triageAuditLogId ?? null}
                />
                {activeDraftError ? (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
                    {activeDraftError}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sanitised body text
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {selectedThread.bodyText ?? "No parsed body text captured yet."}
                </p>
              </div>
            </section>

            <section className="mt-5">
              <div className="flex items-center gap-2">
                <MessageSquareQuote aria-hidden className="text-teal-700" size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Thread timeline
                </h4>
              </div>

              <div className="mt-3 space-y-3">
                {selectedThread.messages.map((message, index) => (
                    <article
                      key={`${message.sender}-${message.timestamp}-${index}`}
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">{message.sender}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {message.subject ?? selectedThread.subject}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{message.timestamp}</p>
                      </div>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {message.body}
                      </p>

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <MetaRow label="To" value={message.to?.join("; ") || "None"} />
                        <MetaRow label="CC" value={message.cc?.join("; ") || "None"} />
                        <MetaRow label="BCC" value={message.bcc?.join("; ") || "None"} />
                        <MetaRow label="Message-ID" value={message.messageId ?? "Not captured"} />
                      </div>

                      {message.attachmentMetadata?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachmentMetadata.map((attachment) => (
                            <AttachmentChip key={`${attachment.name}-${attachment.kind}`} attachment={attachment} />
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
              </div>
            </section>

            <section className="mt-5">
              <div className="flex items-center gap-2">
                <Paperclip aria-hidden className="text-teal-700" size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Attachments
                </h4>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedThread.attachments.length > 0 ? (
                  selectedThread.attachments.map((attachment) => (
                    <AttachmentChip key={attachment.name} attachment={attachment} />
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    No thread-level attachments recorded.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5 grid gap-3 lg:grid-cols-2">
              <Callout
                title="Link to case"
                value="Placeholder action only. Case linking remains a later controlled step."
              />
              <Callout
                title="Create case from thread"
                value="Placeholder action only. Use the existing case workflow when this is approved."
              />
            </section>

            <section className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Possible related
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Conservative subject and sender matching only. Unclear matches stay separate.
                  </p>
                </div>
                <StatusBadge tone="neutral">
                  {possibleRelatedThreads.length} match{possibleRelatedThreads.length === 1 ? "" : "es"}
                </StatusBadge>
              </div>

              <div className="mt-3 space-y-2">
                {possibleRelatedThreads.length > 0 ? (
                  possibleRelatedThreads.map((thread) => (
                    <article
                      key={thread.id}
                      className="rounded-md border border-slate-200 bg-white p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-950">{thread.subject}</p>
                            <StatusBadge tone={statusTone[thread.status]}>{thread.status}</StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{thread.sender}</p>
                        </div>
                        <p className="text-xs text-slate-500">{thread.dateTime}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatThreadWorkspaceLabel(thread)}</span>
                        <span>{threadAttachLabel(thread)}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
                    No possible related thread has been identified yet.
                  </div>
                )}
              </div>
            </section>
          </article>
        </div>
      )}
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

function MetaRow({
  icon: Icon,
  label,
  value,
  placeholder = false,
}: {
  icon?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  placeholder?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon aria-hidden size={14} className="text-teal-700" /> : null}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p
        className={`mt-2 text-sm leading-6 ${
          placeholder ? "font-semibold text-slate-500" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Callout({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{title}</p>
      <p className="mt-2 text-sm leading-6 text-teal-950">{value}</p>
      <button type="button" className="btn-secondary mt-3 w-full" disabled>
        <ArrowRight aria-hidden size={14} />
        {title}
      </button>
    </div>
  );
}

function AttachmentChip({ attachment }: { attachment: EmailAttachment }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-sm font-semibold text-slate-900">{attachment.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {attachment.kind} - {attachment.size}
      </p>
    </div>
  );
}

function EmptyThreads({ title, message }: { title: string; message: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        No correspondence yet
      </p>
      <h3 className="mt-2 text-2xl font-bold text-slate-950">{title}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
