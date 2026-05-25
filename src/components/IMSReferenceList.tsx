"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { IMSReferenceUsage } from "@/lib/ims/types";

type IMSReferenceListProps = {
  title: string;
  note?: string | null;
  references: IMSReferenceUsage[];
  emptyLabel: string;
  compact?: boolean;
};

export function IMSReferenceList({
  title,
  note,
  references,
  emptyLabel,
  compact = false,
}: IMSReferenceListProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            IMS references are controlled guidance only. They support alignment and citation but
            do not replace case evidence.
          </p>
        </div>
        <StatusBadge tone="neutral">IMS</StatusBadge>
      </div>

      {note ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
          {note}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {references.length > 0 ? (
          references.map((reference) => (
            <article
              key={`${reference.source_path}-${reference.chunk_id}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{reference.document_title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {reference.source_path} · chunk {reference.chunk_id}
                  </p>
                </div>
                <StatusBadge tone="accent">Relevant</StatusBadge>
              </div>

              <p className={`mt-2 ${compact ? "text-sm leading-6" : "text-sm leading-6"} text-slate-800`}>
                {reference.snippet}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{reference.relevance_note}</p>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}
