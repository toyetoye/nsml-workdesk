import Link from "next/link";
import { ArrowLeft, ClipboardList, Upload } from "lucide-react";
import type { WorkspaceSummary as WorkspaceSummaryData } from "@/lib/mock-data";
import { WorkspaceSummary } from "@/components/WorkspaceSummary";

export function WorkspacePage({ workspace }: { workspace: WorkspaceSummaryData }) {
  return (
    <section className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-800"
      >
        <ArrowLeft aria-hidden size={16} />
        Dashboard
      </Link>

      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          {workspace.type} Workspace
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">{workspace.name}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {workspace.description}
        </p>
      </header>

      <WorkspaceSummary workspace={workspace} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
              <ClipboardList aria-hidden size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Case View
              </p>
              <h2 className="text-xl font-bold text-slate-950">Mock case summary</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <MockRow label="Open operational cases" value={workspace.openCases} />
            <MockRow label="Pending user replies" value={workspace.pendingReplies} />
            <MockRow label="Evidence gaps" value={workspace.needsEvidence} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-800">
              <Upload aria-hidden size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Intake
              </p>
              <h2 className="text-xl font-bold text-slate-950">Manual material only</h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Emails, EMLs, screenshots, documents, and notes will be added manually in a
            later approved sprint. Sprint 000 keeps this workspace as mock structure only.
          </p>

          <Link href="/import" className="btn-secondary mt-5">
            Open Import
          </Link>
        </div>
      </section>
    </section>
  );
}

function MockRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="text-lg font-bold text-slate-950">{value}</span>
    </div>
  );
}
