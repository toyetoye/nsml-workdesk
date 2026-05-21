"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FolderOpen,
  LockKeyhole,
  Mail,
  MessageSquareQuote,
  Paperclip,
  UserRound,
} from "lucide-react";
import {
  importedEmailThreads,
  type EmailStatus,
  type EmailThreadScope,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

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

export function EmailWorkbench({
  scope,
  sectionLabel,
  sectionDescription,
  emptyStateTitle,
  emptyStateMessage,
}: {
  scope: EmailThreadScope;
  sectionLabel: string;
  sectionDescription: string;
  emptyStateTitle: string;
  emptyStateMessage: string;
}) {
  const filteredThreads = useMemo(() => {
    if (scope === "import") {
      return importedEmailThreads.filter(
        (thread) => thread.workspaceKey === "import" || thread.workspaceKey === "unclassified",
      );
    }

    return importedEmailThreads.filter((thread) => thread.workspaceKey === scope);
  }, [scope]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const activeThread =
    filteredThreads.find((thread) => thread.id === activeThreadId) ?? filteredThreads[0];

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

      {!filteredThreads.length || !activeThread ? (
        <EmptyThreads title={emptyStateTitle} message={emptyStateMessage} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="card min-h-[36rem] p-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Thread list
                </p>
                <p className="mt-1 text-xs text-slate-500">Inbox-style imported threads</p>
              </div>
              <Mail aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {filteredThreads.map((thread) => {
                const selected = thread.id === activeThread.id;

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
                        <p className="truncate text-sm font-bold text-slate-950">
                          {thread.subject}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-600">{thread.sender}</p>
                      </div>
                      <StatusBadge tone={statusTone[thread.status]}>
                        {statusSummary[thread.status]}
                      </StatusBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Building2 aria-hidden size={12} />
                        {thread.vesselProject}
                      </span>
                      <span>{thread.dateTime}</span>
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
                  <h3 className="text-2xl font-bold text-slate-950">{activeThread.subject}</h3>
                  <StatusBadge tone={statusTone[activeThread.status]}>
                    {statusSummary[activeThread.status]}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Imported correspondence viewer for workspace-level thread review.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected thread
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <MetaRow icon={UserRound} label="Sender" value={activeThread.sender} />
              <MetaRow icon={CalendarDays} label="Date / time" value={activeThread.dateTime} />
              <MetaRow
                icon={Building2}
                label="Vessel / project"
                value={activeThread.vesselProject}
              />
              <MetaRow
                icon={FolderOpen}
                label="Linked case"
                value="Linked case placeholder"
                placeholder
              />
              <MetaRow label="Recipients" value={activeThread.recipients.join("; ")} />
              <MetaRow
                label="CC"
                value={activeThread.cc.length > 0 ? activeThread.cc.join("; ") : "None"}
              />
            </div>

            <section className="mt-5">
              <div className="flex items-center gap-2">
                <MessageSquareQuote aria-hidden className="text-teal-700" size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Thread messages
                </h4>
              </div>

              <div className="mt-3 space-y-3">
                {activeThread.messages.map((message) => (
                  <article
                    key={`${message.sender}-${message.timestamp}`}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-950">{message.sender}</p>
                      <p className="text-xs text-slate-500">{message.timestamp}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{message.body}</p>
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
                {activeThread.attachments.map((attachment) => (
                  <div
                    key={attachment.name}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">{attachment.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {attachment.kind} - {attachment.size}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <Callout title="Suggested Next Action" value={activeThread.suggestedNextAction} />
              <Callout
                title="Thread note"
                value="Linked correspondence and draft workflow will be added in a later sprint."
              />
            </div>
          </article>
        </div>
      )}
    </section>
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
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
        <ArrowRight aria-hidden size={14} />
        Placeholder only
      </div>
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
