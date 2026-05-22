import type { DraftResponsePlaceholderRow } from "@/lib/persistence/types";
import type { DraftReadinessStatus, DraftReviewVerdict, RedTeamRequest } from "./types";

export const redTeamVerdictOptions: Array<{ value: DraftReviewVerdict; label: string }> = [
  { value: "pass", label: "Pass" },
  { value: "pass_with_caution", label: "Pass with caution" },
  { value: "revise", label: "Revise" },
  { value: "reject", label: "Reject" },
  { value: "needs_more_evidence", label: "Needs more evidence" },
];

export function describeRedTeamVerdict(verdict: DraftReviewVerdict) {
  return redTeamVerdictOptions.find((entry) => entry.value === verdict)?.label ?? verdict;
}

export function describeReadinessStatus(status: DraftReadinessStatus) {
  return status === "ready_to_copy" ? "Ready to copy" : "Not ready";
}

export function buildRedTeamReviewRequest(draft: DraftResponsePlaceholderRow): RedTeamRequest {
  return {
    draftId: draft.draft_id,
  };
}
