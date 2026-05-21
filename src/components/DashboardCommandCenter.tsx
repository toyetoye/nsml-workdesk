"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Filter } from "lucide-react";
import { AttentionQueue } from "@/components/AttentionQueue";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  allWorkspaces,
  dashboardQueueItems,
  dashboardStatuses,
  recentImportActivity,
  vesselSnapshots,
  type DashboardQueueGroup,
  type EmailThreadScope,
} from "@/lib/mock-data";

type WorkspaceFilter = "all" | EmailThreadScope;
type StatusFilter = "all" | DashboardQueueGroup;

const workspaceOptions: Array<{ label: string; value: WorkspaceFilter }> = [
  { label: "All workspaces", value: "all" },
  ...allWorkspaces.map((workspace) => ({
    label: workspace.name,
    value: workspace.slug as EmailThreadScope,
  })),
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Urgent", value: "urgent" },
  { label: "Pending My Reply", value: "pending-my-reply" },
  { label: "Waiting on Others", value: "waiting-on-others" },
  { label: "Decision Required", value: "decision-required" },
  { label: "Drafts", value: "drafts" },
  { label: "Needs Evidence", value: "needs-evidence" },
];

const queueSectionOrder: Array<{
  key: DashboardQueueGroup;
  title: string;
  description: string;
  emptyStateTitle: string;
  emptyStateMessage: string;
  groupedByWaitingOnType?: boolean;
}> = [
  {
    key: "urgent",
    title: "Urgent Attention Queue",
    description: "Items that need immediate review because they may create operational or commercial exposure.",
    emptyStateTitle: "No urgent items",
    emptyStateMessage:
      "There are no urgent items under the current filters. Check other workspaces or clear the filters.",
  },
  {
    key: "pending-my-reply",
    title: "Pending My Reply",
    description: "Items that are waiting on the user before any external response can move forward.",
    emptyStateTitle: "No pending replies",
    emptyStateMessage:
      "There are no items waiting on your reply under the current filters.",
  },
  {
    key: "waiting-on-others",
    title: "Waiting on Others",
    description: "Items grouped by who we are waiting on, including vessel, vendor, class, and management.",
    emptyStateTitle: "No waiting items",
    emptyStateMessage:
      "There are no waiting items under the current filters.",
    groupedByWaitingOnType: true,
  },
  {
    key: "decision-required",
    title: "Decision Required",
    description: "Items that need a clear decision or instruction before the response path can be completed.",
    emptyStateTitle: "No decisions pending",
    emptyStateMessage:
      "There are no decision-required items under the current filters.",
  },
  {
    key: "drafts",
    title: "Drafts Ready / Drafts Failed Red-Team",
    description: "Drafts waiting for approval plus a placeholder view for drafts that need red-team revision.",
    emptyStateTitle: "No drafts in view",
    emptyStateMessage:
      "There are no draft items under the current filters.",
  },
  {
    key: "needs-evidence",
    title: "Needs Evidence",
    description: "Items blocked until the right supporting evidence is attached or confirmed.",
    emptyStateTitle: "No evidence gaps",
    emptyStateMessage:
      "There are no evidence gaps under the current filters.",
  },
];

export function DashboardCommandCenter() {
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredQueueItems = useMemo(() => {
    return dashboardQueueItems.filter((item) => {
      const matchesWorkspace = workspaceFilter === "all" || item.workspaceKey === workspaceFilter;
      const matchesStatus = statusFilter === "all" || item.group === statusFilter;
      return matchesWorkspace && matchesStatus;
    });
  }, [statusFilter, workspaceFilter]);

  const topCards = useMemo(() => {
    return dashboardStatuses.map((definition) => ({
      ...definition,
      count:
        definition.group === "drafts"
          ? filteredQueueItems.filter(
              (item) => item.group === "drafts" && item.draftState !== "failed-red-team",
            ).length
          : filteredQueueItems.filter((item) => item.group === definition.group).length,
    }));
  }, [filteredQueueItems]);

  const recentImports = useMemo(() => {
    if (workspaceFilter === "all") return recentImportActivity;
    return recentImportActivity.filter((item) => item.workspaceKey === workspaceFilter);
  }, [workspaceFilter]);

  const vesselSnapshotItems = useMemo(() => {
    if (workspaceFilter === "all") return vesselSnapshots;
    const matched = vesselSnapshots.filter((item) => item.workspaceKey === workspaceFilter);
    return matched.length > 0 ? matched : vesselSnapshots;
  }, [workspaceFilter]);

  return (
    <section className="space-y-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            NSML WorkDesk
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Dashboard command centre
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            A private operations desk for vessel work, project follow-up, evidence,
            decisions, reviewed response preparation, and quick queue triage.
          </p>
        </div>

        <Link href="/import" className="btn-primary">
          <ArrowRight aria-hidden size={18} />
          Open Import
        </Link>
      </header>

      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Filters
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Workspace and status filters</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Filter the mock queue by workspace and queue status. The counts and queue
              items update client-side only.
            </p>
          </div>
          <Filter aria-hidden className="text-teal-700" size={20} />
        </div>

        <div className="mt-4 grid gap-4">
          <FilterRow
            label="Workspace"
            options={workspaceOptions}
            value={workspaceFilter}
            onChange={(value) => setWorkspaceFilter(value as WorkspaceFilter)}
          />
          <FilterRow
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {topCards.map((status) => (
          <DashboardCard key={status.label} status={status} />
        ))}
      </section>

      {queueSectionOrder.map((section) => (
        <AttentionQueue
          key={section.key}
          title={section.title}
          description={section.description}
          items={filteredQueueItems.filter((item) => item.group === section.key)}
          emptyStateTitle={section.emptyStateTitle}
          emptyStateMessage={section.emptyStateMessage}
          groupedByWaitingOnType={section.groupedByWaitingOnType}
        />
      ))}

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Recent Import Activity
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Recent intake trail</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Recent imported material and staging notes, shown as mock intake activity.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {recentImports.length > 0 ? (
              recentImports.map((item) => <RecentImportCard key={item.id} item={item} />)
            ) : (
              <EmptyCard
                title="No recent imports"
                message="No intake activity matches the current workspace filter."
              />
            )}
          </div>
        </div>

        <aside className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Vessel Snapshot
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Fleet snapshot</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quick view of vessel workload and the next obvious action.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {vesselSnapshotItems.map((snapshot) => (
              <VesselSnapshotCard key={snapshot.workspaceKey} snapshot={snapshot} />
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecentImportCard({
  item,
}: {
  item: (typeof recentImportActivity)[number];
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{item.summary}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {item.workspaceLabel}
          </p>
        </div>
        <StatusBadge tone="neutral">{item.status}</StatusBadge>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{item.whyItMatters}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">
        <span className="font-semibold">Suggested next action:</span> {item.suggestedNextAction}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.drilldowns.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Received {item.receivedAt}
      </p>
    </article>
  );
}

function VesselSnapshotCard({
  snapshot,
}: {
  snapshot: (typeof vesselSnapshots)[number];
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{snapshot.workspaceLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{snapshot.latestSignal}</p>
        </div>
        <StatusBadge tone="neutral">{snapshot.openCases} cases</StatusBadge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <SnapshotMetric label="Urgent" value={snapshot.urgent} />
        <SnapshotMetric label="Pending" value={snapshot.pendingMyReply} />
        <SnapshotMetric label="Waiting" value={snapshot.waitingOnOthers} />
        <SnapshotMetric label="Evidence" value={snapshot.needsEvidence} />
      </div>

      <p className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-950">
        <span className="font-semibold">Suggested next action:</span> {snapshot.suggestedNextAction}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {snapshot.drilldowns.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
