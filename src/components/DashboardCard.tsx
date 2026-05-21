import { ArrowRight, AlertTriangle, CheckCircle2, Clock3, FileWarning } from "lucide-react";
import type { DashboardStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

const icons = {
  danger: AlertTriangle,
  warning: Clock3,
  accent: CheckCircle2,
  neutral: FileWarning,
};

export function DashboardCard({ status }: { status: DashboardStatus }) {
  const Icon = icons[status.tone];

  return (
    <article className="card flex min-h-56 flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{status.label}</p>
          <p className="mt-2 text-4xl font-bold text-slate-950">{status.count}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon aria-hidden size={20} />
        </div>
      </div>

      <div className="mt-4">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{status.why}</p>

      <p className="mt-auto flex items-start gap-2 pt-4 text-sm font-semibold leading-6 text-slate-900">
        <ArrowRight aria-hidden className="mt-1 shrink-0 text-teal-700" size={16} />
        <span>{status.nextAction}</span>
      </p>
    </article>
  );
}
