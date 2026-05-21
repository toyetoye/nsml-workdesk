import Link from "next/link";
import { ArrowRight, Link2, MessageSquareText } from "lucide-react";
import type {
  DashboardQueueItem,
  DraftReviewState,
  EmailStatus,
  WaitingOnType,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

const statusTone: Record<EmailStatus | "Draft Failed Red-Team", "danger" | "warning" | "accent" | "neutral"> = {
  "Pending My Reply": "warning",
  "Waiting on Vessel": "neutral",
  "Needs Evidence": "danger",
  "Draft Ready": "accent",
  "Draft Failed Red-Team": "danger",
};

const waitingLabels: Record<WaitingOnType, string> = {
  vessel: "Vessel",
  vendor: "Vendor",
  class: "Class",
  management: "Management",
};

const draftLabels: Record<DraftReviewState, string> = {
  ready: "Draft ready",
  "failed-red-team": "Draft failed red-team",
};

export function AttentionQueue({
  title,
  description,
  items,
  emptyStateTitle,
  emptyStateMessage,
  groupedByWaitingOnType = false,
}: {
  title: string;
  description: string;
  items: DashboardQueueItem[];
  emptyStateTitle: string;
  emptyStateMessage: string;
  groupedByWaitingOnType?: boolean;
}) {
  if (groupedByWaitingOnType) {
    const grouped = {
      vessel: items.filter((item) => item.waitingOnType === "vessel"),
      vendor: items.filter((item) => item.waitingOnType === "vendor"),
      class: items.filter((item) => item.waitingOnType === "class"),
      management: items.filter((item) => item.waitingOnType === "management"),
    };

    return (
      <section className="card p-4">
        <SectionHeader title={title} description={description} />

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {Object.entries(grouped).map(([key, groupItems]) => (
            <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {waitingLabels[key as WaitingOnType]}
                </p>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                  {groupItems.length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {groupItems.length > 0 ? (
                  groupItems.map((item) => (
                    <QueueCard key={item.id} item={item} />
                  ))
                ) : (
                  <MiniEmpty title={emptyStateTitle} message={emptyStateMessage} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="card p-4">
      <SectionHeader title={title} description={description} />

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => <QueueCard key={item.id} item={item} />)
        ) : (
          <MiniEmpty title={emptyStateTitle} message={emptyStateMessage} />
        )}
      </div>
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <MessageSquareText aria-hidden className="hidden text-teal-700 sm:block" size={20} />
    </div>
  );
}

function QueueCard({ item }: { item: DashboardQueueItem }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusTone[item.status]}>{item.status}</StatusBadge>
            {item.waitingOnType ? (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                Waiting on {waitingLabels[item.waitingOnType]}
              </span>
            ) : null}
            {item.draftState ? (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                {draftLabels[item.draftState]}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-950">{item.issue}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {item.workspaceLabel}
          </p>
        </div>

        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
          {item.context}
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <InfoBlock label="What is it?" value={item.issue} />
        <InfoBlock label="Who is waiting?" value={item.whoIsWaiting} />
        <InfoBlock label="Why it matters" value={item.whyItMatters} />
      </div>

      <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Suggested next action
        </p>
        <p className="mt-2 text-sm leading-6 text-teal-950">{item.suggestedNextAction}</p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <PlaceholderChip label="Related thread" value={item.relatedThreadPlaceholder} />
        <PlaceholderChip label="Related case" value={item.relatedCasePlaceholder} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.drilldowns.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
          >
            {link.label}
            <ArrowRight aria-hidden size={16} />
          </Link>
        ))}
      </div>
    </article>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function PlaceholderChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <Link2 aria-hidden className="mt-0.5 text-teal-700" size={14} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function MiniEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
