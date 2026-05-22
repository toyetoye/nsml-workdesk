"use client";

import type { ReactNode } from "react";
import { Sparkles, Workflow } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { describeTriageSourceType } from "@/lib/ai/builders";
import type { StructuredTriageResult, TriageSourceType } from "@/lib/ai/types";

const urgencyTone: Record<StructuredTriageResult["urgency_level"], "danger" | "warning" | "accent" | "neutral"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

function confidenceLabel(value: number) {
  if (Number.isNaN(value)) {
    return "Unknown";
  }

  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

export function TriageResultPanel({
  sourceType,
  sourceLabel,
  sourceIds,
  result,
  running,
  note,
  disabledReason,
  auditLogId,
  persisted,
  provider,
  model,
}: {
  sourceType: TriageSourceType;
  sourceLabel: string;
  sourceIds: string[];
  result: StructuredTriageResult | null;
  running: boolean;
  note: string | null;
  disabledReason?: string | null;
  auditLogId?: string | null;
  persisted?: boolean;
  provider?: string | null;
  model?: string | null;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles aria-hidden className="text-teal-700" size={18} />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              AI triage
            </p>
            <StatusBadge tone="neutral">{describeTriageSourceType(sourceType)}</StatusBadge>
            <StatusBadge tone={persisted ? "accent" : "neutral"}>
              {persisted ? "Persisted audit log" : "Session-only"}
            </StatusBadge>
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{sourceLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Advisory only. AI suggestions never change workspace, case, or status automatically.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {running ? "Running analysis" : "Structured output"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Source IDs" value={sourceIds.length > 0 ? sourceIds.join(", ") : "None"} />
        <MiniStat label="Provider" value={provider ?? "Not configured"} />
        <MiniStat label="Model" value={model ?? "Not configured"} />
        <MiniStat label="Audit log" value={auditLogId ?? "Session only"} />
      </div>

      {note ? (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-950">
          {note}
        </div>
      ) : null}

      {disabledReason ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
          {disabledReason}
        </div>
      ) : null}

      {!result ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">No triage result yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Run triage on the selected source material to populate advisory output here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {result.summary_1line}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {result.expanded_summary}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Suggested workspace" value={result.suggested_workspace} />
            <InfoCard label="Suggested case title" value={result.suggested_case_title} />
            <InfoCard label="Suggested status" value={result.suggested_status} />
            <InfoCard
              label="Urgency"
              value={result.urgency_level}
              badge={
                <StatusBadge tone={urgencyTone[result.urgency_level]}>
                  {result.urgency_level}
                </StatusBadge>
              }
            />
            <InfoCard label="Waiting on" value={result.waiting_on} />
            <InfoCard label="Priority reason" value={result.priority_reason} />
            <InfoCard label="Required next action" value={result.required_next_action} />
            <InfoCard label="Confidence" value={confidenceLabel(result.confidence)} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <TagPanel title="Risk flags" items={result.risk_flags} emptyLabel="No risk flags captured." />
            <TagPanel
              title="Missing information"
              items={result.missing_information}
              emptyLabel="No missing information flagged."
            />
            <TagPanel
              title="Recommended follow-up questions"
              items={result.recommended_followup_questions}
              emptyLabel="No follow-up questions suggested."
            />
            <TagPanel title="Suggested tags" items={result.suggested_tags} emptyLabel="No tags suggested." />
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evidence used
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The triage result should always be traceable to the exact source material used.
                </p>
              </div>
              <Workflow aria-hidden className="text-teal-700" size={18} />
            </div>

            <div className="mt-3 space-y-2">
              {result.evidence_used.length > 0 ? (
                result.evidence_used.map((item) => (
                  <div
                    key={item.source_id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.source_type} · {item.source_id}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 leading-6 text-slate-700">{item.note}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  No explicit evidence references were returned.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Caution notes
            </p>
            <div className="mt-2 space-y-2 text-sm leading-6 text-amber-950">
              {result.caution_notes.length > 0 ? (
                result.caution_notes.map((noteItem, index) => (
                  <p key={`${noteItem}-${index}`}>• {noteItem}</p>
                ))
              ) : (
                <p>No caution notes captured.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InfoCard
              label="Should create case"
              value={result.should_create_case ? "Yes" : "No"}
              compact
            />
            <InfoCard
              label="Should prepare draft later"
              value={result.should_prepare_draft_later ? "Yes" : "No"}
              compact
            />
          </div>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  badge,
  compact = false,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {badge}
      </div>
      <p className={`mt-2 leading-6 ${compact ? "text-sm" : "text-sm text-slate-800"}`}>{value}</p>
    </div>
  );
}

function TagPanel({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm leading-6 text-slate-600">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}
