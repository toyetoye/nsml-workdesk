"use client";

import { useMemo, useState } from "react";
import { Copy, FileSearch, Layers3, ShieldCheck } from "lucide-react";
import { runRedTeamReviewAction } from "@/app/(protected)/ai/actions";
import { StatusBadge } from "@/components/StatusBadge";
import type { AiConfigStatus } from "@/lib/ai/types";
import type { DraftRedTeamReviewRow, DraftResponsePlaceholderRow } from "@/lib/persistence/types";

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

function verdictLabel(review?: DraftRedTeamReviewRow | null) {
  if (!review) {
    return "Pending Red-Team";
  }

  if (review.verdict === "pass") {
    return "Passed Red-Team";
  }

  if (review.verdict === "pass_with_caution") {
    return "Passed with Caution";
  }

  if (review.verdict === "revise") {
    return "Needs Revision";
  }

  if (review.verdict === "reject") {
    return "Rejected";
  }

  return "Needs More Evidence";
}

function verdictTone(review?: DraftRedTeamReviewRow | null): "danger" | "warning" | "accent" | "neutral" {
  if (!review) {
    return "warning";
  }

  if (review.verdict === "pass") {
    return "accent";
  }

  if (review.verdict === "pass_with_caution") {
    return "warning";
  }

  if (review.verdict === "reject") {
    return "danger";
  }

  if (review.verdict === "needs_more_evidence") {
    return "danger";
  }

  return "warning";
}

function readinessTone(review?: DraftRedTeamReviewRow | null): "danger" | "warning" | "accent" | "neutral" {
  if (!review) {
    return "warning";
  }

  return review.safe_to_copy ? "accent" : "danger";
}

function joinList(items: string[]) {
  return items.length > 0 ? items.join("; ") : "None";
}

function copyableLabel(review?: DraftRedTeamReviewRow | null) {
  return review?.safe_to_copy ? "Copy reviewed draft" : "Copy reviewed draft";
}

export function DraftsWorkbench({
  drafts,
  initialReviews,
  caseTitles,
  aiConfig,
}: {
  drafts: DraftResponsePlaceholderRow[];
  initialReviews: DraftRedTeamReviewRow[];
  caseTitles: Map<string, string>;
  aiConfig: AiConfigStatus;
}) {
  const [draftRows] = useState<DraftResponsePlaceholderRow[]>(() => [...drafts]);
  const [reviewsByDraftId, setReviewsByDraftId] = useState<Record<string, DraftRedTeamReviewRow>>(() =>
    Object.fromEntries(initialReviews.map((review) => [review.draft_id, review] as const)),
  );
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [copyNoticeByDraftId, setCopyNoticeByDraftId] = useState<Record<string, string>>({});

  const sortedDrafts = useMemo(
    () =>
      [...draftRows].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    [draftRows],
  );

  const reviewMap = useMemo(
    () => new Map(Object.entries(reviewsByDraftId).map(([draftId, review]) => [draftId, review] as const)),
    [reviewsByDraftId],
  );

  const pendingCount = sortedDrafts.filter((item) => !reviewMap.get(item.draft_id)).length;
  const passedCount = sortedDrafts.filter((item) => reviewMap.get(item.draft_id)?.verdict === "pass").length;
  const cautionCount = sortedDrafts.filter(
    (item) => reviewMap.get(item.draft_id)?.verdict === "pass_with_caution",
  ).length;
  const reviseCount = sortedDrafts.filter((item) => reviewMap.get(item.draft_id)?.verdict === "revise").length;
  const rejectCount = sortedDrafts.filter((item) => reviewMap.get(item.draft_id)?.verdict === "reject").length;
  const evidenceCount = sortedDrafts.filter(
    (item) => reviewMap.get(item.draft_id)?.verdict === "needs_more_evidence",
  ).length;

  async function handleRunReview(draft: DraftResponsePlaceholderRow) {
    if (!aiConfig.enabled || reviewTargetId === draft.draft_id) {
      return;
    }

    setReviewTargetId(draft.draft_id);
    setReviewError(null);
    setReviewNotice(null);

    try {
      const outcome = await runRedTeamReviewAction({ draftId: draft.draft_id });
      const reviewResult = outcome.reviewResult;

      if (reviewResult) {
        setReviewsByDraftId((current) => ({
          ...current,
          [draft.draft_id]: {
            review_id: reviewResult.review_id,
            draft_id: reviewResult.draft_id,
            source_type: draft.source_type,
            source_label: draft.source_label,
            source_ids_reviewed: reviewResult.source_ids_reviewed,
            source_snapshot: draft.source_snapshot,
            verdict: reviewResult.verdict,
            readiness_status: reviewResult.readiness_status,
            summary: reviewResult.summary,
            unsupported_claims: reviewResult.unsupported_claims,
            liability_risks: reviewResult.liability_risks,
            technical_risks: reviewResult.technical_risks,
            tone_risks: reviewResult.tone_risks,
            missing_information: reviewResult.missing_information,
            evidence_gaps: reviewResult.evidence_gaps,
            confidentiality_concerns: reviewResult.confidentiality_concerns,
            recommended_revisions: reviewResult.recommended_revisions,
            required_user_checks: reviewResult.required_user_checks,
            safe_to_copy: reviewResult.safe_to_copy,
            confidence: reviewResult.confidence,
            reviewed_at: reviewResult.reviewed_at,
            created_at: reviewResult.reviewed_at,
            updated_at: reviewResult.reviewed_at,
          },
        }));
      }

      setReviewNotice(outcome.note);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Red-team review failed.");
    } finally {
      setReviewTargetId(null);
    }
  }

  async function handleCopyReviewedDraft(draft: DraftResponsePlaceholderRow) {
    const review = reviewMap.get(draft.draft_id);

    if (!review?.safe_to_copy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draft.draft_body);
      setCopyNoticeByDraftId((current) => ({
        ...current,
        [draft.draft_id]: "Copied for manual external paste only.",
      }));
    } catch {
      setCopyNoticeByDraftId((current) => ({
        ...current,
        [draft.draft_id]: "Copy failed in this browser.",
      }));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Drafts</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Draft workbench</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Drafts are generated replies only. They stay pending red-team review until a review
            verdict says they can be copied.
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
          This draft has not passed red-team review and is not ready to send.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <StatCard label="Pending red-team" value={pendingCount} />
        <StatCard label="Passed red-team" value={passedCount} />
        <StatCard label="Passed with caution" value={cautionCount} />
        <StatCard label="Needs revision" value={reviseCount} />
        <StatCard label="Rejected" value={rejectCount} />
        <StatCard label="Needs more evidence" value={evidenceCount} />
      </div>

      {!aiConfig.enabled ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          {aiConfig.message}
        </div>
      ) : null}

      {reviewNotice ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
          {reviewNotice}
        </div>
      ) : null}

      {reviewError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950">
          {reviewError}
        </div>
      ) : null}

      {sortedDrafts.length > 0 ? (
        <div className="space-y-3">
          {sortedDrafts.map((draft) => {
            const review = reviewMap.get(draft.draft_id) ?? null;
            const safeToCopy = review?.safe_to_copy ?? false;

            return (
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
                      <StatusBadge tone={review ? verdictTone(review) : "warning"}>
                        {verdictLabel(review)}
                      </StatusBadge>
                      <StatusBadge tone={review ? readinessTone(review) : "warning"}>
                        {review ? review.readiness_status : "not_ready"}
                      </StatusBadge>
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
                    Confidence {confidenceLabel(review?.confidence ?? draft.confidence)}
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-md border p-4 ${
                    review ? (safeToCopy ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50") : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      safeToCopy ? "text-teal-700" : "text-amber-700"
                    }`}
                  >
                    {review
                      ? safeToCopy
                        ? "This draft passed red-team review and may be copied manually."
                        : "This draft was reviewed and remains not ready to send."
                      : "This draft has not passed red-team review and is not ready to send."}
                  </p>
                  <p
                    className={`mt-2 whitespace-pre-line text-sm leading-6 ${
                      safeToCopy ? "text-teal-950" : "text-amber-950"
                    }`}
                  >
                    {draft.draft_body}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!aiConfig.enabled || reviewTargetId !== null}
                    onClick={() => handleRunReview(draft)}
                  >
                    {reviewTargetId === draft.draft_id ? "Reviewing..." : "Run Red-Team Review"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!safeToCopy}
                    onClick={() => handleCopyReviewedDraft(draft)}
                  >
                    <Copy aria-hidden size={14} />
                    {copyableLabel(review)}
                  </button>
                  <span className="text-xs text-slate-500">
                    Copy is only enabled after a passing red-team verdict and is for manual external
                    paste only.
                  </span>
                  {copyNoticeByDraftId[draft.draft_id] ? (
                    <span className="text-xs font-semibold text-teal-700">
                      {copyNoticeByDraftId[draft.draft_id]}
                    </span>
                  ) : null}
                </div>

                {review ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck aria-hidden className="text-teal-700" size={16} />
                        <StatusBadge tone={safeToCopy ? "accent" : "warning"}>
                          {review.verdict}
                        </StatusBadge>
                        <StatusBadge tone={safeToCopy ? "accent" : "danger"}>
                          {review.readiness_status}
                        </StatusBadge>
                        <StatusBadge tone={safeToCopy ? "accent" : "danger"}>
                          {safeToCopy ? "Safe to copy" : "Not safe to copy"}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-800">{review.summary}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                        Reviewed at {review.reviewed_at}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Source IDs reviewed:{" "}
                        {review.source_ids_reviewed.length > 0
                          ? review.source_ids_reviewed.join(", ")
                          : "None"}
                      </p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <InfoBlock
                          label="Unsupported claims"
                          value={joinList(review.unsupported_claims)}
                        />
                        <InfoBlock label="Liability risks" value={joinList(review.liability_risks)} />
                        <InfoBlock label="Technical risks" value={joinList(review.technical_risks)} />
                        <InfoBlock label="Tone risks" value={joinList(review.tone_risks)} />
                        <InfoBlock label="Evidence gaps" value={joinList(review.evidence_gaps)} />
                        <InfoBlock
                          label="Missing information"
                          value={joinList(review.missing_information)}
                        />
                        <InfoBlock
                          label="Confidentiality concerns"
                          value={joinList(review.confidentiality_concerns)}
                        />
                        <InfoBlock
                          label="Recommended revisions"
                          value={joinList(review.recommended_revisions)}
                        />
                        <InfoBlock
                          label="Required user checks"
                          value={joinList(review.required_user_checks)}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

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
                    value={
                      draft.liability_cautions.length > 0
                        ? draft.liability_cautions.join("; ")
                        : "None"
                    }
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
                    label="Source label"
                    value={draft.source_label}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {draft.case_id ? (
                    <StatusBadge tone="accent">
                      Case {caseTitles.get(draft.case_id) ?? draft.case_id}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Not linked to case</StatusBadge>
                  )}
                  <StatusBadge tone="neutral">
                    {draft.must_be_red_teamed ? "Must be red-teamed" : "Red-team missing"}
                  </StatusBadge>
                </div>
              </article>
            );
          })}
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
    <div className="rounded-md border border-slate-200 bg-white p-3">
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
