import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { AttentionQueue } from "@/components/AttentionQueue";
import { DashboardCard } from "@/components/DashboardCard";
import { WorkspaceSummary } from "@/components/WorkspaceSummary";
import {
  allWorkspaces,
  attentionQueue,
  dashboardStatuses,
  recentImports,
} from "@/lib/mock-data";

export function Dashboard() {
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
            decisions, and reviewed response preparation.
          </p>
        </div>

        <Link href="/import" className="btn-primary">
          <Upload aria-hidden size={18} />
          Import manually
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {dashboardStatuses.map((status) => (
          <DashboardCard key={status.label} status={status} />
        ))}
      </section>

      <AttentionQueue items={attentionQueue} />

      <section className="grid gap-4 2xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Workspaces
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                Vessel and project overview
              </h2>
            </div>
          </div>

          <div className="grid gap-4">
            {allWorkspaces.map((workspace) => (
              <WorkspaceSummary key={workspace.slug} workspace={workspace} compact />
            ))}
          </div>
        </div>

        <aside className="card h-fit p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Recent Imports
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Manual intake</h2>
            </div>
            <Link
              href="/import"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-800"
              aria-label="Open import"
            >
              <ArrowRight aria-hidden size={18} />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-200">
            {recentImports.map((item) => (
              <div key={`${item.label}-${item.workspace}`} className="py-3 first:pt-0 last:pb-0">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.workspace}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
