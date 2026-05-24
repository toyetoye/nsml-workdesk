"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { AttentionQueue } from "@/components/AttentionQueue";
import { DashboardCard } from "@/components/DashboardCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
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

const primaryStatusGroups: DashboardQueueGroup[] = [
  "urgent",
  "pending-my-reply",
  "decision-required",
  "needs-evidence",
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
    title: "Drafts pending red-team / reviewed drafts",
    description:
      "Generated drafts waiting for red-team review plus the reviewed-draft path when copy is safe.",
    emptyStateTitle: "No drafts in view",
    emptyStateMessage: "There are no draft items under the current filters. Open Drafts to continue the review path.",
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

  const primaryCards = useMemo(
    () => topCards.filter((card) => primaryStatusGroups.includes(card.group)),
    [topCards],
  );

  const secondaryCards = useMemo(
    () => topCards.filter((card) => !primaryStatusGroups.includes(card.group)),
    [topCards],
  );

  const recentImports = useMemo(() => {
    if (workspaceFilter === "all") return recentImportActivity;
    return recentImportActivity.filter((item) => item.workspaceKey === workspaceFilter);
  }, [workspaceFilter]);

  const vesselSnapshotItems = useMemo(() => {
    if (workspaceFilter === "all") return vesselSnapshots;
    const matched = vesselSnapshots.filter((item) => item.workspaceKey === workspaceFilter);
    return matched.length > 0 ? matched : vesselSnapshots;
  }, [workspaceFilter]);

  const collapsedQueueKeys: DashboardQueueGroup[] = [
    "waiting-on-others",
    "decision-required",
    "drafts",
    "needs-evidence",
  ];

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="NSML WorkDesk"
        title="Dashboard command centre"
        description="A private operations desk for vessel work, project follow-up, evidence, decisions, reviewed response preparation, and quick queue triage."
        context="Capture → Structure → Link → Decide → Draft → Review → Copy"
        primaryAction={{ href: "/import", label: "Start at Import", variant: "primary" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/assurance", label: "Assurance" },
          { href: "/drafts", label: "Drafts" },
        ]}
        quickLinks={[
          { href: "/import", label: "Import" },
          { href: "/cases", label: "Cases" },
          { href: "/assurance", label: "Assurance" },
          { href: "/drafts", label: "Drafts" },
          { href: "/settings/writing-style", label: "Writing Style" },
        ]}
      />

      <WorkflowChecklist
        title="Workflow path"
        description="Follow the same path every time so intake, correspondence, cases, drafts, and review stay in sync."
        note="Copy is only available after red-team review"
        collapsible
        compact
        defaultOpen={false}
        items={[
          {
            title: "Start with intake",
            description:
              "Paste a note or email, stage evidence, and parse EML metadata when a file is eligible.",
            href: "/import",
            actionLabel: "Open Import",
          },
          {
            title: "Review correspondence by workspace",
            description:
              "Move between vessel, project, and general correspondence pages to keep threads in the right operational context.",
            links: [
              { href: "/vessels/lng-portharcourt-ii", label: "LNG PORTHARCOURT II" },
              { href: "/vessels/lpg-alfred-temile", label: "LPG ALFRED TEMILE" },
              { href: "/vessels/lpg-alfred-temile-10", label: "LPG ALFRED TEMILE 10" },
              { href: "/projects", label: "Projects" },
              { href: "/other", label: "Other" },
            ],
          },
          {
            title: "Track assurance and governance signals",
            description:
              "Capture vessel support feedback, request specifics, and keep unverified governance concerns separate from facts.",
            href: "/assurance",
            actionLabel: "Open Assurance",
          },
          {
            title: "Manage cases and decisions",
            description:
              "Open the case workbench to attach evidence, inspect linked correspondence, and keep the next action visible.",
            href: "/cases",
            actionLabel: "Open Cases",
          },
          {
            title: "Draft, review, and copy safely",
            description:
              "Generate drafts, run red-team review, and only copy reviewed text when it is marked safe to copy.",
            href: "/drafts",
            actionLabel: "Open Drafts",
          },
          {
            title: "Tune writing style",
            description:
              "Adjust greeting, closing, tone, brevity, and stakeholder framing before generating the next draft.",
            href: "/settings/writing-style",
            actionLabel: "Open Writing Style",
          },
        ]}
      />

      <CollapsibleSection
        title="Filters"
        description="Workspace and status filters for the mock queue. The counts and queue items update client-side only."
        summaryBadge={<Filter aria-hidden className="text-teal-700" size={18} />}
        defaultOpen={false}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
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
      </CollapsibleSection>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryCards.map((status) => (
          <DashboardCard key={status.label} status={status} />
        ))}
      </section>

      <CollapsibleSection
        title="Secondary status counts"
        description="Less urgent counts stay available here so the first viewport stays focused on the highest-signal work."
        summaryBadge={<StatusBadge tone="neutral">{secondaryCards.length}</StatusBadge>}
        defaultOpen={false}
        className="overflow-hidden"
        bodyClassName="p-4 pt-0"
      >
        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {secondaryCards.map((status) => (
            <DashboardCard key={status.label} status={status} />
          ))}
        </section>
      </CollapsibleSection>

      {queueSectionOrder.map((section) => {
        const items = filteredQueueItems.filter((item) => item.group === section.key);
        const queue = (
          <AttentionQueue
            title={section.title}
            description={section.description}
            items={items}
            emptyStateTitle={section.emptyStateTitle}
            emptyStateMessage={section.emptyStateMessage}
            groupedByWaitingOnType={section.groupedByWaitingOnType}
            bare={collapsedQueueKeys.includes(section.key)}
          />
        );

        if (!collapsedQueueKeys.includes(section.key)) {
          return <div key={section.key}>{queue}</div>;
        }

        return (
          <CollapsibleSection
            key={section.key}
            title={section.title}
            description={section.description}
            summaryBadge={<StatusBadge tone="neutral">{items.length}</StatusBadge>}
            defaultOpen={false}
            className="overflow-hidden"
            bodyClassName="p-4 pt-0"
          >
            {queue}
          </CollapsibleSection>
        );
      })}

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CollapsibleSection
          title="Recent Import Activity"
          description="Recent imported material and staging notes, shown as mock intake activity."
          defaultOpen={false}
          className="overflow-hidden"
          bodyClassName="p-4 pt-0"
        >
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
        </CollapsibleSection>

        <CollapsibleSection
          title="Vessel Snapshot"
          description="Quick view of vessel workload and the next obvious action."
          defaultOpen={false}
          className="overflow-hidden"
          bodyClassName="p-4 pt-0"
        >
          <div className="mt-4 grid gap-3">
            {vesselSnapshotItems.map((snapshot) => (
              <VesselSnapshotCard key={snapshot.workspaceKey} snapshot={snapshot} />
            ))}
          </div>
        </CollapsibleSection>
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
