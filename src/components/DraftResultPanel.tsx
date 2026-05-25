"use client";

import { useState } from "react";
import { Copy, FileEdit, ShieldCheck } from "lucide-react";
import { IMSReferenceList } from "@/components/IMSReferenceList";
import { StatusBadge } from "@/components/StatusBadge";
import { describeDraftMode } from "@/lib/ai/descriptions";
import { describeReadinessStatus, describeRedTeamVerdict } from "@/lib/ai/red-team-builders";
import { runRedTeamReviewAction } from "@/app/(protected)/ai/actions";
import type { DraftStatus, RedTeamRunOutcome, StructuredDraftResult } from "@/lib/ai/types";
import type { IMSReferenceUsage } from "@/lib/ims/types";

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

function draftStatusLabel(value: DraftStatus) {
  if (value === "pending_red_team") {
    return "Pending red-team";
  }

  if (value === "needs_evidence") {
    return "Needs evidence";
  }

  return "Blocked";
}

type DraftResultPanelProps = {
  sourceType: string;
  sourceLabel: string;
  sourceIds: string[];
  draftRecordId?: string | null;
  result: StructuredDraftResult | null;
  running: boolean;
  note: string | null;
  disabledReason?: string | null;
  persisted?: boolean;
  provider?: string | null;
  model?: string | null;
  triageAuditLogId?: string | null;
  reviewDisabledReason?: string | null;
  writingStyleProfileName?: string | null;
  imsReferencesUsed?: IMSReferenceUsage[];
  imsReferenceNote?: string | null;
};

export function DraftResultPanel(props: DraftResultPanelProps) {
  const draftKey = props.draftRecordId ?? props.sourceLabel;

  return <DraftResultPanelBody key={draftKey} {...props} />;
}

function DraftResultPanelBody({
  sourceType,
  sourceLabel,
  sourceIds,
  draftRecordId,
  result,
  running,
  note,
  disabledReason,
  persisted,
  provider,
  model,
  triageAuditLogId,
  reviewDisabledReason,
  writingStyleProfileName,
  imsReferencesUsed = [],
  imsReferenceNote = null,
}: DraftResultPanelProps) {
  const [reviewOutcome, setReviewOutcome] = useState<RedTeamRunOutcome | null>(null);
  const [reviewRunning, setReviewRunning] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  async function handleRunRedTeamReview() {
    if (!draftRecordId || reviewRunning) {
      return;
    }

    setReviewRunning(true);
    setReviewError(null);
    setReviewNote(null);

    try {
      const outcome = await runRedTeamReviewAction({ draftId: draftRecordId });
      setReviewOutcome(outcome);
      setReviewNote(outcome.note);
    } catch (error) {
      setReviewOutcome(null);
      setReviewError(error instanceof Error ? error.message : "Red-team review failed.");
    } finally {
      setReviewRunning(false);
    }
  }

  async function handleCopyReviewedDraft() {
    if (!result || !reviewOutcome?.reviewResult?.safe_to_copy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.draft_body);
      setCopyNotice("Copied for manual external paste only.");
    } catch {
      setCopyNotice("Copy failed in this browser.");
    }
  }

  const activeReview = reviewOutcome?.reviewResult ?? null;
  const safeToCopy = activeReview?.safe_to_copy ?? false;
  const reviewHeadline = activeReview
    ? safeToCopy
      ? "This draft passed red-team review and can be copied manually."
      : "This draft was reviewed and remains not ready to send."
    : "This draft has not passed red-team review and is not ready to send.";

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
            <StatusBadge tone={writingStyleProfileName ? "accent" : "warning"}>
              {writingStyleProfileName ?? "Default safe style"}
            </StatusBadge>
            {result ? (
              <StatusBadge tone={statusTone[result.status]}>{draftStatusLabel(result.status)}</StatusBadge>
            ) : null}
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{sourceLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{reviewHeadline}</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {running ? "Generating draft" : "Structured output"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {activeReview ? (
          <StatusBadge tone={safeToCopy ? "accent" : "warning"}>
            {describeRedTeamVerdict(activeReview.verdict)}
          </StatusBadge>
        ) : (
          <StatusBadge tone="warning">Pending Red-Team</StatusBadge>
        )}
        <StatusBadge tone={result?.must_be_red_teamed ? "danger" : "neutral"}>
          Red-team required
        </StatusBadge>
        {activeReview ? (
          <StatusBadge tone={safeToCopy ? "accent" : activeReview.verdict === "reject" ? "danger" : "warning"}>
            {describeReadinessStatus(activeReview.readiness_status)}
          </StatusBadge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Source IDs" value={sourceIds.length > 0 ? sourceIds.join(", ") : "None"} />
        <MiniStat
          label="Reviewed source IDs"
          value={activeReview?.source_ids_reviewed?.length
            ? activeReview.source_ids_reviewed.join(", ")
            : "Not reviewed yet"}
        />
        <MiniStat label="Provider" value={provider ?? "Not configured"} />
        <MiniStat label="Model" value={model ?? "Not configured"} />
        <MiniStat label="Triage ref" value={triageAuditLogId ?? "None"} />
        <MiniStat label="Writing style" value={writingStyleProfileName ?? "Default safe style"} />
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Red-team review
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Review the draft against the source material before copying anywhere.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!draftRecordId || Boolean(reviewDisabledReason) || reviewRunning}
            onClick={handleRunRedTeamReview}
          >
            {reviewRunning ? "Reviewing..." : "Run Red-Team Review"}
          </button>
        </div>

        {reviewDisabledReason ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
            {reviewDisabledReason}
          </div>
        ) : null}

        {reviewNote ? (
          <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-950">
            {reviewNote}
          </div>
        ) : null}

        {reviewError ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-950">
            {reviewError}
          </div>
        ) : null}

        {!activeReview ? (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {activeReview ? "Red-Team Review Complete" : "Pending Red-Team"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeReview
                ? "Use the reviewed draft only for manual external paste after confirming the verdict and required checks."
                : "This draft has not been reviewed yet. It remains unreviewed and cannot be copied."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary" disabled>
                <Copy aria-hidden size={14} />
                Copy reviewed draft
              </button>
              <span className="text-xs text-slate-500">
                Red-team review is required before copy unlocks.
              </span>
            </div>
          </div>
        ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck aria-hidden className="text-teal-700" size={16} />
                <StatusBadge tone={safeToCopy ? "accent" : "warning"}>
                  {describeReadinessStatus(activeReview.readiness_status)}
                </StatusBadge>
                <StatusBadge tone={safeToCopy ? "accent" : "danger"}>
                  {describeRedTeamVerdict(activeReview.verdict)}
                </StatusBadge>
                <StatusBadge tone={safeToCopy ? "accent" : "danger"}>
                  {safeToCopy ? "Safe to copy" : "Not safe to copy"}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-800">{activeReview.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                Reviewed at {activeReview.reviewed_at}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Source IDs reviewed:{" "}
                {activeReview.source_ids_reviewed.length > 0
                  ? activeReview.source_ids_reviewed.join(", ")
                  : "None"}
              </p>
              {copyNotice ? (
                <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-950">
                  {copyNotice}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!safeToCopy}
                  onClick={handleCopyReviewedDraft}
                >
                  <Copy aria-hidden size={14} />
                  Copy reviewed draft
                </button>
                <span className="text-xs text-slate-500">
                  Copy is only enabled after a passing red-team verdict and is for manual external
                  paste only.
                </span>
              </div>
              </div>

              <IMSReferenceList
                title="IMS references used in red-team review"
                note={reviewOutcome?.imsReferenceNote ?? null}
                references={reviewOutcome?.imsReferencesUsed ?? []}
                emptyLabel="No IMS reference used for red-team review."
                compact
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <InfoCard label="Unsupported claims" value={joinList(activeReview.unsupported_claims)} />
              <InfoCard label="Liability risks" value={joinList(activeReview.liability_risks)} />
              <InfoCard label="Technical risks" value={joinList(activeReview.technical_risks)} />
              <InfoCard label="Tone risks" value={joinList(activeReview.tone_risks)} />
              <InfoCard label="Evidence gaps" value={joinList(activeReview.evidence_gaps)} />
              <InfoCard label="Missing information" value={joinList(activeReview.missing_information)} />
              <InfoCard
                label="Confidentiality concerns"
                value={joinList(activeReview.confidentiality_concerns)}
              />
              <InfoCard
                label="Required user checks"
                value={joinList(activeReview.required_user_checks)}
              />
              <InfoCard
                label="Recommended revisions"
                value={joinList(activeReview.recommended_revisions)}
              />
            </div>
          </div>
        )}
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
          <div className={`rounded-md border p-4 ${safeToCopy ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                safeToCopy ? "text-teal-700" : "text-amber-700"
              }`}
            >
              {safeToCopy
                ? "This draft passed red-team review and may be copied manually."
                : "This draft has not passed red-team review and is not ready to send."}
            </p>
            <p
              className={`mt-2 text-sm leading-6 ${
                safeToCopy ? "text-teal-950" : "text-amber-950"
              }`}
            >
              {safeToCopy
                ? "Treat the reviewed text as manual external paste only, then confirm the final wording before use."
                : "Treat the content as a starting point only. Confirm facts, remove assumptions, and apply red-team review before copying anywhere."}
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

          <IMSReferenceList
            title="IMS references used in draft generation"
            note={imsReferenceNote}
            references={imsReferencesUsed}
            emptyLabel="No IMS reference used for this draft."
            compact
          />
        </div>
      )}
    </section>
  );
}

function joinList(items: string[]) {
  return items.length > 0 ? items.join("; ") : "None";
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
