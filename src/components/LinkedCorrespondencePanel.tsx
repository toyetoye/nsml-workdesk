import { ArrowRight, Link2 } from "lucide-react";
import { linkedCorrespondence, type EmailStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

const statusTone: Record<EmailStatus, "danger" | "warning" | "accent" | "neutral"> = {
  "Pending My Reply": "warning",
  "Waiting on Vessel": "neutral",
  "Needs Evidence": "danger",
  "Draft Ready": "accent",
};

export function LinkedCorrespondencePanel() {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <Link2 aria-hidden size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Cases
          </p>
          <h2 className="text-2xl font-bold text-slate-950">Linked correspondence</h2>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Imported threads can later be linked into cases. For Sprint 000, this view
        simply shows how case-linked correspondence might be organized.
      </p>

      <div className="mt-4 grid gap-3">
        {linkedCorrespondence.map((item) => (
          <article key={item.caseRef} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-950">{item.caseRef}</h3>
                  <StatusBadge tone={statusTone[item.status]}>{item.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">Threads</p>
                <p className="text-2xl font-bold text-slate-950">{item.threadCount}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-800">{item.vesselProject}.</span>{" "}
                {item.latestNote}
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                Open case link
                <ArrowRight aria-hidden size={16} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
