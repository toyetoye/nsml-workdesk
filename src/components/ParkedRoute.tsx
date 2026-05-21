import Link from "next/link";
import { ArrowLeft, PauseCircle } from "lucide-react";

export function ParkedRoute({ name }: { name: string }) {
  return (
    <section className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-800"
      >
        <ArrowLeft aria-hidden size={16} />
        Dashboard
      </Link>

      <div className="card max-w-3xl p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <PauseCircle aria-hidden size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Parked Route
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{name}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This inherited route is not part of NSML WorkDesk Sprint 000. It has
              been neutralized so the app shell stays limited to approved mock-data
              workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
