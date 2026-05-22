import { FileSearch, Layers3 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { DraftResponsePlaceholderRow } from "@/lib/persistence/types";

function statusTone(status: string): "danger" | "warning" | "accent" | "neutral" {
  if (status === "pending_red_team") {
    return "warning";
  }

  if (status === "needs_evidence" || status === "blocked") {
    return "danger";
  }

  return "neutral";
}

function persistenceTone(value: string) {
  return value === "persisted" ? "accent" : "neutral";
}

function confidenceLabel(value: number) {
  if (Number.isNaN(value)) {
    return "Unknown";
  }

  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

export function DraftsWorkbench({
  drafts,
  caseTitles,
}: {
  drafts: DraftResponsePlaceholderRow[];
  caseTitles: Map<string, string>;
}) {
  const sortedDrafts = [...drafts].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
  const pendingCount = sortedDrafts.filter((item) => item.status === "pending_red_team").length;
  const needsEvidenceCount = sortedDrafts.filter((item) => item.status === "needs_evidence").length;
  const blockedCount = sortedDrafts.filter((item) => item.status === "blocked").length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Drafts</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Draft workbench</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Drafts are generated replies only. They stay pending red-team review and are never
            marked ready in this sprint.
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
          This draft has not passed red-team review and is not ready to send.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Pending red-team" value={pendingCount} />
        <StatCard label="Needs evidence" value={needsEvidenceCount} />
        <StatCard label="Blocked" value={blockedCount} />
      </div>

      {sortedDrafts.length > 0 ? (
        <div className="space-y-3">
          {sortedDrafts.map((draft) => (
            <article key={draft.draft_id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {draft.source_type.replace(/_/g, " ")}
                    </p>
                    <StatusBadge tone={statusTone(draft.status)}>{draft.status}</StatusBadge>
                    <StatusBadge tone={persistenceTone(draft.persistence_state)}>
                      {draft.persistence_state}
                    </StatusBadge>
                    <StatusBadge tone="neutral">{draft.tone_mode.replace(/_/g, " ")}</StatusBadge>
                    <StatusBadge tone="neutral">Red-team required</StatusBadge>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {draft.subject_placeholder}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Recipient: {draft.intended_recipient_placeholder}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Source: {draft.source_label}
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confidence {confidenceLabel(draft.confidence)}
                </div>
              </div>

              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  This draft has not passed red-team review and is not ready to send.
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950">
                  {draft.draft_body}
                </p>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <InfoBlock label="Draft purpose" value={draft.draft_purpose} />
                <InfoBlock label="Evidence basis" value={draft.evidence_basis} />
                <InfoBlock
                  label="Assumptions"
                  value={draft.assumptions.length > 0 ? draft.assumptions.join("; ") : "None"}
                />
                <InfoBlock
                  label="Missing information"
                  value={draft.missing_information.length > 0 ? draft.missing_information.join("; ") : "None"}
                />
                <InfoBlock
                  label="Liability cautions"
                  value={draft.liability_cautions.length > 0 ? draft.liability_cautions.join("; ") : "None"}
                />
                <InfoBlock
                  label="Recommended attachments"
                  value={
                    draft.recommended_attachments.length > 0
                      ? draft.recommended_attachments.join("; ")
                      : "None"
                  }
                />
                <InfoBlock
                  label="Source IDs"
                  value={draft.source_ids.length > 0 ? draft.source_ids.join(", ") : "None"}
                />
                <InfoBlock
                  label="Triage reference"
                  value={draft.triage_audit_log_id ?? "None"}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge tone="warning">Pending Red-Team</StatusBadge>
                <StatusBadge tone="neutral">
                  {draft.must_be_red_teamed ? "Must be red-teamed" : "Red-team missing"}
                </StatusBadge>
                {draft.case_id ? (
                  <StatusBadge tone="accent">
                    Case {caseTitles.get(draft.case_id) ?? draft.case_id}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyDrafts />
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <Layers3 aria-hidden className="text-teal-700" size={18} />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function EmptyDrafts() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <FileSearch aria-hidden size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            No generated drafts yet
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">Draft records will appear here</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate a draft from import, correspondence, or case workbench to create a not-ready
            draft record. Session-only drafts will appear here when persistence is unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}
