import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import type { AttentionItem } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Attention Queue
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Needs review first</h2>
        </div>
        <ClipboardCheck aria-hidden className="hidden text-teal-700 sm:block" size={24} />
      </div>

      <div className="mt-4 divide-y divide-slate-200">
        {items.map((item) => (
          <article key={`${item.vessel}-${item.topic}`} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.vessel}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-950">{item.topic}</h3>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Why it matters
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.whyUrgent}</p>
              </div>

              <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  Suggested next step
                </p>
                <p className="mt-2 flex gap-2 text-sm font-semibold leading-6 text-teal-950">
                  <ArrowUpRight aria-hidden className="mt-1 shrink-0" size={16} />
                  <span>{item.suggestedNextStep}</span>
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
