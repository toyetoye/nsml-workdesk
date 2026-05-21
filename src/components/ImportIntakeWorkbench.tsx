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
import {
  importIntakeSeedItems,
  importIntakeStatuses,
  importSourceTypes,
  importWorkspaceAssignments,
  type ImportIntakeItem,
  type ImportIntakeStatus,
  type ImportSourceType,
  type ImportWorkspaceAssignment,
  type StatusTone,
} from "@/lib/mock-data";
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

function formatDisplayDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function buildIntakeItem(form: IntakeFormState): ImportIntakeItem {
  const sourceLabel =
    importSourceTypes.find((source) => source.value === form.sourceType)?.label ?? form.sourceType;

  return {
    id: `intake-${Date.now()}`,
    title: form.title.trim() || "Untitled intake",
    sourceType: form.sourceType,
    workspaceAssignment: form.workspaceAssignment,
    status: form.status,
    senderSource: form.senderSource.trim() || "Unknown source",
    dateTime: formatDisplayDateTime(form.dateTime),
    bodyContent:
      form.bodyContent.trim() || "No body provided yet. This is a placeholder intake entry.",
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    routeNote:
      form.workspaceAssignment === "Import/Staging"
        ? "Still staged for manual classification."
        : `Simulated assignment to ${form.workspaceAssignment}.`,
    casePlaceholder: "Case link placeholder: Unlinked",
    createdLabel: `Created from ${sourceLabel}`,
  };
}

export function ImportIntakeWorkbench() {
  const [items, setItems] = useState<ImportIntakeItem[]>(() => importIntakeSeedItems);
  const [selectedId, setSelectedId] = useState<string>(importIntakeSeedItems[0]?.id ?? "");
  const [routeTarget, setRouteTarget] = useState<ImportWorkspaceAssignment>(
    importIntakeSeedItems[0]?.workspaceAssignment ?? "Import/Staging",
  );
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

  const itemCount = items.length;

  function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextItem = buildIntakeItem(form);
    setItems((current) => [nextItem, ...current]);
    setSelectedId(nextItem.id);
    setRouteTarget(nextItem.workspaceAssignment);
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
    <section className="space-y-4">
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
          Session-only state
        </div>
      </div>

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
                <button type="submit" className="btn-primary">
                  Save intake item
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
              {itemCount > 0 ? (
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
                  Selected items stay in session-only state so we can simulate intake without
                  backend persistence.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {itemCount} item{itemCount === 1 ? "" : "s"} in session
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
                        </div>
                      </div>
                    </div>
                  </div>
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

function itemStatusLabel(status: ImportIntakeStatus) {
  return importIntakeStatuses.find((entry) => entry.value === status)?.label ?? status;
}

function itemSourceLabel(sourceType: ImportSourceType) {
  return importSourceTypes.find((entry) => entry.value === sourceType)?.label ?? sourceType;
}
