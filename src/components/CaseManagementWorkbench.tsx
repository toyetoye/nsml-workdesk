"use client";

import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock3,
  Link2,
  Paperclip,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import {
  allWorkspaces,
  casePriorities,
  caseStatuses,
  evidenceRecords,
  importedEmailThreads,
  type CasePriority,
  type CaseRecord,
  type CaseStatus,
  type EvidenceRecord,
  type EmailStatus,
  type StatusTone,
} from "@/lib/mock-data";
import { saveCaseAction } from "@/app/(protected)/cases/actions";
import { StatusBadge } from "@/components/StatusBadge";

type CreateCaseFormState = {
  title: string;
  summary: string;
  workspaceKey: CaseRecord["workspaceKey"];
  status: CaseStatus;
  priority: CasePriority;
  category: string;
  owner: string;
  waitingOn: string;
  dueLabel: string;
  nextAction: string;
  riskNote: string;
  decisionRequired: string;
  sourceIntakeRef: string;
  tags: string;
};

const caseStatusTone: Record<CaseStatus, StatusTone> = {
  "Decision Required": "warning",
  "Needs Evidence": "danger",
  "Waiting on Vessel": "neutral",
  "Waiting on Vendor": "neutral",
  "Waiting on Class": "neutral",
  "Waiting on Management": "neutral",
  "Pending My Reply": "warning",
  Monitoring: "accent",
};

const priorityTone: Record<CasePriority, StatusTone> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

const evidenceTypeTone: Record<EvidenceRecord["type"], StatusTone> = {
  email: "accent",
  document: "neutral",
  image: "neutral",
  screenshot: "neutral",
  note: "neutral",
  quote: "warning",
  report: "accent",
  "eml-placeholder": "warning",
};

export function CaseManagementWorkbench({
  initialCases,
  persistenceEnabled,
}: {
  initialCases: CaseRecord[];
  persistenceEnabled: boolean;
}) {
  const [cases, setCases] = useState<CaseRecord[]>(() => initialCases);
  const [evidence] = useState<EvidenceRecord[]>(() => evidenceRecords);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCases[0]?.caseId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCaseFormState>(() => ({
    title: "",
    summary: "",
    workspaceKey: "lng-portharcourt-ii",
    status: "Decision Required",
    priority: "Medium",
    category: "",
    owner: "Toye Omolade",
    waitingOn: "",
    dueLabel: "",
    nextAction: "",
    riskNote: "",
    decisionRequired: "",
    sourceIntakeRef: "Create from intake item placeholder",
    tags: "",
  }));

  const selectedCase =
    cases.find((item) => item.caseId === selectedCaseId) ?? cases[0] ?? null;

  const selectedEvidence = useMemo(() => {
    if (!selectedCase) {
      return [];
    }

    return evidence.filter((item) => item.linkedCaseId === selectedCase.caseId);
  }, [evidence, selectedCase]);

  const selectedThreads = useMemo(() => {
    if (!selectedCase) {
      return [];
    }

    return importedEmailThreads.filter((thread) => selectedCase.linkedThreads.includes(thread.id));
  }, [selectedCase]);

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveNotice(null);

    try {
      const result = await saveCaseAction({
        title: createForm.title,
        summary: createForm.summary,
        workspaceKey: createForm.workspaceKey,
        status: createForm.status,
        priority: createForm.priority,
        category: createForm.category,
        owner: createForm.owner,
        waitingOn: createForm.waitingOn,
        dueLabel: createForm.dueLabel,
        nextAction: createForm.nextAction,
        riskNote: createForm.riskNote,
        decisionRequired: createForm.decisionRequired,
        sourceIntakeRef: createForm.sourceIntakeRef,
        tags: createForm.tags,
      });

      setCases((current) => [result.caseRecord, ...current]);
      setSelectedCaseId(result.caseRecord.caseId);
      setCreateOpen(false);
      setSaveNotice(
        result.persisted
          ? "Saved to the repository and added to the local case view."
          : "Saved locally for this session only.",
      );
      setCreateForm({
        title: "",
        summary: "",
        workspaceKey: "lng-portharcourt-ii",
        status: "Decision Required",
        priority: "Medium",
        category: "",
        owner: "Toye Omolade",
        waitingOn: "",
        dueLabel: "",
        nextAction: "",
        riskNote: "",
        decisionRequired: "",
        sourceIntakeRef: "Create from intake item placeholder",
        tags: "",
      });
    } catch {
      const workspace =
        allWorkspaces.find((item) => item.slug === createForm.workspaceKey) ?? allWorkspaces[0];
      const nextCaseNumber = String(cases.length + 1).padStart(3, "0");
      const caseId = `CASE-NEW-${nextCaseNumber}`;
      const openedDate = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date());
      const openedTime = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());

      const nextCase: CaseRecord = {
        caseId,
        title: createForm.title.trim() || "Untitled case",
        summary: createForm.summary.trim() || "No summary captured yet.",
        workspaceKey: workspace.slug as CaseRecord["workspaceKey"],
        workspaceLabel: workspace.name,
        vesselProject: workspace.name,
        owner: createForm.owner.trim() || "Toye Omolade",
        status: createForm.status,
        priority: createForm.priority,
        category: createForm.category.trim() || "Unclassified",
        openedDate,
        age: "New",
        waitingOn: createForm.waitingOn.trim() || "TBD",
        dueLabel: createForm.dueLabel.trim() || "Due soon",
        nextAction: createForm.nextAction.trim() || "Define the next operational step.",
        riskNote: createForm.riskNote.trim() || "No risk note captured yet.",
        linkedThreads: [],
        linkedEvidence: [],
        timelineEvents: [
          {
            id: `${caseId}-created`,
            dateTime: openedTime,
            title: "Case created",
            note: "Created in the client-side prototype case drawer.",
            tone: "neutral",
          },
          {
            id: `${caseId}-review`,
            dateTime: openedTime,
            title: "Ready for review",
            note: "The new case is selected and ready for evidence to be attached.",
            tone: "accent",
          },
        ],
        decisionRequired:
          createForm.decisionRequired.trim() || "No decision requirement captured yet.",
        tags: createForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        sourceIntakeRef:
          createForm.sourceIntakeRef.trim() || "Create from intake item placeholder",
        workspaceHref: workspace.href,
      };

      setCases((current) => [nextCase, ...current]);
      setSelectedCaseId(caseId);
      setCreateOpen(false);
      setSaveNotice("Saved locally for this session only.");
      setCreateForm({
        title: "",
        summary: "",
        workspaceKey: "lng-portharcourt-ii",
        status: "Decision Required",
        priority: "Medium",
        category: "",
        owner: "Toye Omolade",
        waitingOn: "",
        dueLabel: "",
        nextAction: "",
        riskNote: "",
        decisionRequired: "",
        sourceIntakeRef: "Create from intake item placeholder",
        tags: "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Cases</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Case management workbench</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            A case is the working unit. Evidence and correspondence support the case while the
            operational work happens here.
          </p>
        </div>

        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          <PlusCircle aria-hidden size={16} />
          Create case
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <span className="font-semibold">
          {persistenceEnabled ? "Repository connected" : "Session fallback only"}
        </span>
        {saveNotice ? <span>{saveNotice}</span> : <span>Case writes use the server repository first.</span>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="card min-h-[42rem] p-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Case list
              </p>
              <p className="mt-1 text-xs text-slate-500">Compact operational queue</p>
            </div>
            <ShieldAlert aria-hidden className="text-teal-700" size={18} />
          </div>

          <div className="mt-3 space-y-2">
            {cases.map((item) => {
              const selected = item.caseId === selectedCase?.caseId;

              return (
                <button
                  key={item.caseId}
                  type="button"
                  onClick={() => setSelectedCaseId(item.caseId)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    selected
                      ? "border-teal-300 bg-teal-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.caseId}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-950">{item.title}</p>
                    </div>
                    <StatusBadge tone={caseStatusTone[item.status]}>{item.status}</StatusBadge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone={priorityTone[item.priority]}>{item.priority}</StatusBadge>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 aria-hidden size={12} />
                      {item.age}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p className="truncate">{item.workspaceLabel}</p>
                    <p className="truncate">Waiting on: {item.waitingOn}</p>
                    <p className="truncate">Due: {item.dueLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="card min-h-[42rem] p-4">
          {!selectedCase ? (
            <EmptyCases
              title="No case selected"
              message="Create a case or select one from the list to start managing evidence and correspondence."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-950">{selectedCase.title}</h2>
                    <StatusBadge tone={caseStatusTone[selectedCase.status]}>
                      {selectedCase.status}
                    </StatusBadge>
                    <StatusBadge tone={priorityTone[selectedCase.priority]}>
                      {selectedCase.priority}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {selectedCase.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={selectedCase.workspaceHref}
                    className="btn-secondary"
                  >
                    Open workspace
                    <ArrowRight aria-hidden size={16} />
                  </Link>
                  <Link href="/import" className="btn-secondary">
                    Open import
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <InfoCard label="Workspace" value={selectedCase.workspaceLabel} />
                <InfoCard label="Owner" value={selectedCase.owner} />
                <InfoCard label="Waiting on" value={selectedCase.waitingOn} />
                <InfoCard label="Category" value={selectedCase.category} />
                <InfoCard label="Opened" value={selectedCase.openedDate} />
                <InfoCard label="Age" value={selectedCase.age} />
                <InfoCard label="Due" value={selectedCase.dueLabel} />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Decision required / Next action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-950">
                    {selectedCase.decisionRequired}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-amber-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Next action
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {selectedCase.nextAction}
                      </p>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Risk note
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {selectedCase.riskNote}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Create from intake item
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This is a reference placeholder only. Real intake-to-case connection comes
                    later.
                  </p>
                  <div className="mt-3">
                    <button type="button" className="btn-secondary w-full" disabled>
                      Create from intake item
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Paperclip aria-hidden className="text-teal-700" size={18} />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Linked evidence
                      </h3>
                    </div>
                    <button type="button" className="btn-secondary px-3 py-2 text-sm" disabled>
                      Attach evidence
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedEvidence.length > 0 ? (
                      selectedEvidence.map((item) => (
                        <article
                          key={item.evidenceId}
                          className="rounded-md border border-slate-200 bg-white p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                                <StatusBadge tone={evidenceTypeTone[item.type]}>
                                  {item.type}
                                </StatusBadge>
                                <StatusBadge tone={item.status === "Needs Review" ? "warning" : item.status === "Pending" ? "neutral" : "accent"}>
                                  {item.status}
                                </StatusBadge>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.source} · {item.date}
                              </p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {item.evidenceId}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.description}
                          </p>
                        </article>
                      ))
                    ) : (
                      <EmptyPanel
                        title="No evidence linked yet"
                        message="Attach evidence later when the intake, file, or note is ready."
                      />
                    )}
                  </div>
                </section>

                <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Link2 aria-hidden className="text-teal-700" size={18} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Linked correspondence
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Imported correspondence linked to this case stays visible as evidence context.
                  </p>

                  <div className="mt-3 space-y-2">
                    {selectedThreads.length > 0 ? (
                      selectedThreads.map((thread) => (
                        <article
                          key={thread.id}
                          className="rounded-md border border-slate-200 bg-white p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-bold text-slate-950">
                                  {thread.subject}
                                </p>
                                <StatusBadge tone={threadStatusTone(thread.status)}>
                                  {thread.status}
                                </StatusBadge>
                              </div>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {thread.sender}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">{thread.dateTime}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{thread.vesselProject}</span>
                            <span>Linked case: {thread.linkedCase}</span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyPanel
                        title="No correspondence linked yet"
                        message="Use intake or later case-linking steps to attach imported threads."
                      />
                    )}
                  </div>
                </section>
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Activity aria-hidden className="text-teal-700" size={18} />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Timeline / activity
                  </h3>
                </div>

                <div className="mt-3 space-y-2">
                  {selectedCase.timelineEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-md border border-slate-200 bg-white p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-950">{event.title}</p>
                            <StatusBadge tone={event.tone}>{event.tone}</StatusBadge>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{event.note}</p>
                        </div>
                        <span className="text-xs text-slate-500">{event.dateTime}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <InfoCard label="Source intake reference" value={selectedCase.sourceIntakeRef} />
                <InfoCard
                  label="Tags"
                  value={selectedCase.tags.length > 0 ? selectedCase.tags.join(", ") : "No tags"}
                />
              </div>
            </>
          )}
        </article>
      </div>

      {createOpen ? (
        <CreateCaseDrawer
          form={createForm}
          onClose={() => setCreateOpen(false)}
          onChange={setCreateForm}
          onSubmit={handleCreateCase}
          saving={saving}
        />
      ) : null}
    </section>
  );
}

function CreateCaseDrawer({
  form,
  onClose,
  onChange,
  onSubmit,
  saving,
}: {
  form: CreateCaseFormState;
  onClose: () => void;
  onChange: Dispatch<SetStateAction<CreateCaseFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 p-3">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Create case</p>
            <h3 className="text-xl font-bold text-slate-950">Session-only case prototype</h3>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="flex-1 overflow-y-auto p-4" onSubmit={onSubmit}>
          <div className="grid gap-3">
            <Field label="Title">
              <input
                className="field-input"
                value={form.title}
                onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. New vessel correspondence case"
              />
            </Field>

            <Field label="Summary">
              <textarea
                className="field-input min-h-24 resize-y"
                value={form.summary}
                onChange={(event) =>
                  onChange((current) => ({ ...current, summary: event.target.value }))
                }
                placeholder="Short operational summary"
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Workspace">
                <select
                  className="field-input"
                  value={form.workspaceKey}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      workspaceKey: event.target.value as CreateCaseFormState["workspaceKey"],
                    }))
                  }
                >
                  {allWorkspaces.map((workspace) => (
                    <option key={workspace.slug} value={workspace.slug}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Owner">
                <input
                  className="field-input"
                  value={form.owner}
                  onChange={(event) => onChange((current) => ({ ...current, owner: event.target.value }))}
                />
              </Field>
            </div>

            <Field label="Due / follow-up">
              <input
                className="field-input"
                value={form.dueLabel}
                onChange={(event) =>
                  onChange((current) => ({ ...current, dueLabel: event.target.value }))
                }
                placeholder="e.g. Due today, Due tomorrow, Monitor only"
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Status">
                <select
                  className="field-input"
                  value={form.status}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      status: event.target.value as CaseStatus,
                    }))
                  }
                >
                  {caseStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Priority">
                <select
                  className="field-input"
                  value={form.priority}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      priority: event.target.value as CasePriority,
                    }))
                  }
                >
                  {casePriorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Category">
                <input
                  className="field-input"
                  value={form.category}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </Field>

              <Field label="Waiting on / owner party">
                <input
                  className="field-input"
                  value={form.waitingOn}
                  onChange={(event) =>
                    onChange((current) => ({ ...current, waitingOn: event.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Decision required">
              <textarea
                className="field-input min-h-20 resize-y"
                value={form.decisionRequired}
                onChange={(event) =>
                  onChange((current) => ({ ...current, decisionRequired: event.target.value }))
                }
              />
            </Field>

            <Field label="Next action">
              <textarea
                className="field-input min-h-20 resize-y"
                value={form.nextAction}
                onChange={(event) =>
                  onChange((current) => ({ ...current, nextAction: event.target.value }))
                }
              />
            </Field>

            <Field label="Risk note">
              <textarea
                className="field-input min-h-20 resize-y"
                value={form.riskNote}
                onChange={(event) =>
                  onChange((current) => ({ ...current, riskNote: event.target.value }))
                }
              />
            </Field>

            <Field label="Source intake reference">
              <input
                className="field-input"
                value={form.sourceIntakeRef}
                onChange={(event) =>
                  onChange((current) => ({ ...current, sourceIntakeRef: event.target.value }))
                }
              />
            </Field>

            <Field label="Tags">
              <input
                className="field-input"
                value={form.tags}
                onChange={(event) => onChange((current) => ({ ...current, tags: event.target.value }))}
                placeholder="class, evidence, repair"
              />
            </Field>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Create from intake item
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This placeholder will later connect to /import intake items.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" className="btn-secondary" disabled>
                  Create from intake item
                </button>
                <span className="text-xs text-slate-500">Not connected yet.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save case"}
            </button>
          </div>
        </form>
      </div>
    </div>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function EmptyCases({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        No cases yet
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function threadStatusTone(status: EmailStatus): StatusTone {
  switch (status) {
    case "Pending My Reply":
      return "warning";
    case "Needs Evidence":
      return "danger";
    case "Draft Ready":
      return "accent";
    case "Waiting on Vessel":
    default:
      return "neutral";
  }
}
