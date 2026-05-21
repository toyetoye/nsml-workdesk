import Link from "next/link";
import { ArrowRight, FolderKanban, Ship, Inbox } from "lucide-react";
import type { WorkspaceSummary as WorkspaceSummaryData } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

const workspaceIcons = {
  Vessel: Ship,
  Project: FolderKanban,
  General: Inbox,
};

export function WorkspaceSummary({
  workspace,
  compact = false,
}: {
  workspace: WorkspaceSummaryData;
  compact?: boolean;
}) {
  const Icon = workspaceIcons[workspace.type];

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon aria-hidden size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">{workspace.name}</h2>
              <StatusBadge>{workspace.type}</StatusBadge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.description}
            </p>
          </div>
        </div>

        {compact && (
          <Link
            href={workspace.href}
            className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800 sm:inline-flex"
          >
            Open
            <ArrowRight aria-hidden size={16} />
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Open cases" value={workspace.openCases} />
        <Metric label="Pending replies" value={workspace.pendingReplies} />
        <Metric label="Needs evidence" value={workspace.needsEvidence} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {workspace.focusAreas.map((area) => (
          <span
            key={area}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            {area}
          </span>
        ))}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
