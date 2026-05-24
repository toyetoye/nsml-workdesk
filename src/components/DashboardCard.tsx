import type { ReactNode } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusTone } from "@/lib/mock-data";

export function DashboardCard({
  label,
  count,
  tone,
  summary,
  icon,
}: {
  label: string;
  count: number | string;
  tone: StatusTone;
  summary: string;
  icon: ReactNode;
}) {

  return (
    <article className="card flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{count}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-600">{summary}</p>
    </article>
  );
}
