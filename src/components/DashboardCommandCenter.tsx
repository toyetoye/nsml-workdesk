import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  HelpCircle,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { StickyPageHeader } from "@/components/StickyPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  dashboardQueueItems,
  dashboardStatuses,
  type DashboardQueueGroup,
  type DashboardQueueItem,
  type StatusTone,
} from "@/lib/mock-data";
import {
  listCases,
  listDraftRedTeamReviews,
  listDraftResponses,
  listIntakeItems,
} from "@/lib/persistence/repository";

// ─── group config ────────────────────────────────────────────────────────────

type GroupConfig = {
  label: string;
  tone: StatusTone;
  icon: React.ReactNode;
  emptyLabel: string;
  actionHref: string;
  actionLabel: string;
};

const GROUP_CONFIG: Record<DashboardQueueGroup, GroupConfig> = {
  urgent: {
    label: "Urgent",
    tone: "danger",
    icon: <AlertTriangle aria-hidden size={15} />,
    emptyLabel: "No urgent items",
    actionHref: "/cases",
    actionLabel: "Open Cases",
  },
  "pending-my-reply": {
    label: "Pending my reply",
    tone: "warning",
    icon: <Clock aria-hidden size={15} />,
    emptyLabel: "Nothing waiting on you",
    actionHref: "/cases",
    actionLabel: "Open Cases",
  },
  "waiting-on-others": {
    label: "Waiting on others",
    tone: "neutral",
    icon: <HelpCircle aria-hidden size={15} />,
    emptyLabel: "Nothing waiting on others",
    actionHref: "/cases",
    actionLabel: "Open Cases",
  },
  "decision-required": {
    label: "Decision required",
    tone: "warning",
    icon: <FolderOpen aria-hidden size={15} />,
    emptyLabel: "No decisions outstanding",
    actionHref: "/cases",
    actionLabel: "Open Cases",
  },
  drafts: {
    label: "Drafts ready / failed red-team",
    tone: "accent",
    icon: <FileText aria-hidden size={15} />,
    emptyLabel: "No drafts need action",
    actionHref: "/drafts",
    actionLabel: "Open Drafts",
  },
  "needs-evidence": {
    label: "Needs evidence",
    tone: "danger",
    icon: <Inbox aria-hidden size={15} />,
    emptyLabel: "No items blocked on evidence",
    actionHref: "/import",
    actionLabel: "Open Import",
  },
};

const GROUP_ORDER: DashboardQueueGroup[] = [
  "urgent",
  "pending-my-reply",
  "decision-required",
  "drafts",
  "needs-evidence",
  "waiting-on-others",
];

// ─── component ───────────────────────────────────────────────────────────────

export async function DashboardCommandCenter() {
  const [caseRows, draftRows, draftReviews, intakeRows] = await Promise.all([
    listCases(),
    listDraftResponses(),
    listDraftRedTeamReviews(),
    listIntakeItems(),
  ]);

  const reviewedIds = new Set(draftReviews.map((r) => r.draft_id));
  const pendingRedTeam = draftRows.filter((d) => !reviewedIds.has(d.draft_id)).length;
  const failedRedTeam = draftReviews.filter((r) => r.verdict === "reject").length;
  const pendingIntake = intakeRows.filter((r) => r.status === "unclassified").length;

  // Live counts to annotate group headers
  const liveCounts: Partial<Record<DashboardQueueGroup, number>> = {
    urgent: dashboardStatuses.find((s) => s.group === "urgent")?.count ?? 0,
    "pending-my-reply": dashboardStatuses.find((s) => s.group === "pending-my-reply")?.count ?? 0,
    "waiting-on-others": dashboardStatuses.find((s) => s.group === "waiting-on-others")?.count ?? 0,
    "decision-required": dashboardStatuses.find((s) => s.group === "decision-required")?.count ?? 0,
    drafts: pendingRedTeam + failedRedTeam,
    "needs-evidence": pendingIntake,
  };

  // Group items
  const itemsByGroup = GROUP_ORDER.reduce<Record<DashboardQueueGroup, DashboardQueueItem[]>>(
    (acc, g) => {
      acc[g] = dashboardQueueItems.filter((item) => item.group === g);
      return acc;
    },
    {} as Record<DashboardQueueGroup, DashboardQueueItem[]>,
  );

  const totalNeedsAction =
    (liveCounts.urgent ?? 0) +
    (liveCounts["pending-my-reply"] ?? 0) +
    (liveCounts["decision-required"] ?? 0);

  return (
    <section className="space-y-6">
      <StickyPageHeader
        eyebrow="NSML WorkDesk"
        title="What needs you"
        description={
          totalNeedsAction > 0
            ? `${totalNeedsAction} item${totalNeedsAction === 1 ? "" : "s"} need action now — urgent, pending reply, or decision required.`
            : "No items need immediate action. Review the queue below."
        }
        primaryAction={{ href: "/import", label: "Capture email", variant: "primary" }}
        secondaryActions={[
          { href: "/cases", label: "Cases" },
          { href: "/drafts", label: "Drafts" },
        ]}
      />

      {/* Live summary strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {GROUP_ORDER.map((group) => {
          const cfg = GROUP_CONFIG[group];
          const count = liveCounts[group] ?? 0;
          return (
            <Link
              key={group}
              href={cfg.actionHref}
              className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-300 hover:bg-teal-50 transition"
            >
              <div className="flex items-center gap-1.5 text-slate-500">
                {cfg.icon}
                <span className="text-[11px] font-semibold uppercase tracking-wide truncate">
                  {cfg.label}
                </span>
              </div>
              <span
                className={`text-2xl font-bold ${
                  count > 0 && cfg.tone === "danger"
                    ? "text-red-600"
                    : count > 0 && cfg.tone === "warning"
                      ? "text-amber-600"
                      : "text-slate-950"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Triage queue */}
      <div className="space-y-4">
        {GROUP_ORDER.map((group) => {
          const cfg = GROUP_CONFIG[group];
          const items = itemsByGroup[group];
          const count = liveCounts[group] ?? 0;

          return (
            <section key={group} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cfg.tone === "danger" ? "text-red-500" : cfg.tone === "warning" ? "text-amber-500" : "text-slate-400"}>
                    {cfg.icon}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
                  {count > 0 ? (
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      cfg.tone === "danger" ? "bg-red-100 text-red-700" :
                      cfg.tone === "warning" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-200 text-slate-600"
                    }`}>
                      {count}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={cfg.actionHref}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  {cfg.actionLabel}
                  <ArrowRight aria-hidden size={12} />
                </Link>
              </div>

              {/* Queue rows */}
              {items.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
                  <CheckCircle2 aria-hidden size={14} />
                  {cfg.emptyLabel}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <QueueRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Assurance shortcut */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldAlert aria-hidden size={15} className="text-slate-400" />
          <span>Assurance signals, support items, and the weekly pack</span>
        </div>
        <Link
          href="/assurance"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
        >
          Open Assurance
          <ArrowRight aria-hidden size={14} />
        </Link>
      </div>
    </section>
  );
}

// ─── queue row ───────────────────────────────────────────────────────────────

function QueueRow({ item }: { item: DashboardQueueItem }) {
  const primaryLink = item.drilldowns[0];

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        {/* Workspace + status */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.workspaceLabel}
          </span>
          <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
        </div>

        {/* Issue */}
        <p className="text-sm font-semibold text-slate-900 leading-5">{item.issue}</p>

        {/* Next action */}
        <p className="text-xs text-slate-500 leading-5">{item.suggestedNextAction}</p>
      </div>

      {/* Action */}
      {primaryLink ? (
        <div className="shrink-0">
          <Link
            href={primaryLink.href}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800 whitespace-nowrap"
          >
            {primaryLink.label}
            <ArrowRight aria-hidden size={12} />
          </Link>
        </div>
      ) : null}
    </li>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusTone(status: string): StatusTone {
  if (status === "Pending My Reply" || status === "Decision Required") return "warning";
  if (status === "Draft Failed Red-Team" || status === "Needs Evidence") return "danger";
  if (status === "Waiting on Vessel" || status === "Waiting on Vendor" || status === "Waiting on Class" || status === "Waiting on Management") return "neutral";
  return "neutral";
}
