"use client";
import { Copy, FileEdit } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { describeDraftMode } from "@/lib/ai/draft-builders";
import type { DraftStatus, StructuredDraftResult } from "@/lib/ai/types";

const statusTone: Record<DraftStatus, "danger" | "warning" | "accent" | "neutral"> = {
  pending_red_team: "warning",
  needs_evidence: "danger",
  blocked: "danger",
};

function confidenceLabel(value: number) {
  if (Number.isNaN(value)) {
    return "Unknown";
  }

  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

export function DraftResultPanel({
  sourceType,
  sourceLabel,
  sourceIds,
  result,
  running,
  note,
  disabledReason,
  persisted,
  provider,
  model,
  triageAuditLogId,
}: {
  sourceType: string;
  sourceLabel: string;
  sourceIds: string[];
  result: StructuredDraftResult | null;
  running: boolean;
  note: string | null;
  disabledReason?: string | null;
  persisted?: boolean;
  provider?: string | null;
  model?: string | null;
  triageAuditLogId?: string | null;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileEdit aria-hidden className="text-teal-700" size={18} />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              AI draft
            </p>
            <StatusBadge tone="neutral">{sourceType.replace(/_/g, " ")}</StatusBadge>
            <StatusBadge tone={persisted ? "accent" : "neutral"}>
              {persisted ? "Persisted draft" : "Session-only"}
            </StatusBadge>
            {result ? (
              <StatusBadge tone={statusTone[result.status]}>{result.status}</StatusBadge>
            ) : null}
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{sourceLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This draft has not passed red-team review and is not ready to send.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {running ? "Generating draft" : "Structured output"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone="warning">Pending Red-Team</StatusBadge>
        <StatusBadge tone={result?.must_be_red_teamed ? "danger" : "neutral"}>
          Red-team required
        </StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Source IDs" value={sourceIds.length > 0 ? sourceIds.join(", ") : "None"} />
        <MiniStat label="Provider" value={provider ?? "Not configured"} />
        <MiniStat label="Model" value={model ?? "Not configured"} />
        <MiniStat label="Triage ref" value={triageAuditLogId ?? "None"} />
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
          <p className="text-sm font-semibold text-slate-900">No draft generated yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate a draft from the selected source material to see the unreviewed reply here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              This draft has not passed red-team review and is not ready to send.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Treat the content as a starting point only. Confirm facts, remove assumptions, and
              apply red-team review before copying anywhere.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Draft body
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Human, concise, professional, and advisory only.
                </p>
              </div>
              <StatusBadge tone={statusTone[result.status]}>{result.status}</StatusBadge>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-800">
              {result.draft_body}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary" disabled>
                <Copy aria-hidden size={14} />
                Copy unreviewed draft
              </button>
              <span className="text-xs text-slate-500">
                Copy remains disabled until red-team review exists.
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <InfoCard label="Intended recipient" value={result.intended_recipient_placeholder} />
            <InfoCard label="Subject" value={result.subject_placeholder} />
            <InfoCard label="Draft purpose" value={result.draft_purpose} />
            <InfoCard label="Tone mode" value={describeDraftMode(result.tone_mode)} />
            <InfoCard label="Confidence" value={confidenceLabel(result.confidence)} />
            <InfoCard label="Created at" value={result.created_at} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <TagPanel
              title="Evidence basis"
              value={result.evidence_basis}
              emptyLabel="No evidence basis provided."
            />
            <TagPanel
              title="Assumptions"
              items={result.assumptions}
              emptyLabel="No assumptions listed."
            />
            <TagPanel
              title="Missing information"
              items={result.missing_information}
              emptyLabel="No missing information listed."
            />
            <TagPanel
              title="Liability cautions"
              items={result.liability_cautions}
              emptyLabel="No liability cautions listed."
            />
            <TagPanel
              title="Recommended attachments"
              items={result.recommended_attachments}
              emptyLabel="No attachments recommended."
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function TagPanel({
  title,
  items,
  value,
  emptyLabel,
}: {
  title: string;
  items?: string[];
  value?: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {value ? (
        <p className="mt-3 text-sm leading-6 text-slate-700">{value}</p>
      ) : null}
      {items ? (
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
      ) : null}
      {!value && !items?.length ? (
        <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm leading-6 text-slate-600">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}
