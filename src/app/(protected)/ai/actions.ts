"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { buildCaseTriageRequest, buildIntakeTriageRequest, buildThreadTriageRequest } from "@/lib/ai/builders";
import { buildCaseDraftRequest, buildIntakeDraftRequest, buildThreadDraftRequest } from "@/lib/ai/draft-builders";
import { runDraftGeneration } from "@/lib/ai/drafts";
import { runRedTeamReview } from "@/lib/ai/red-team";
import { runTriageAnalysis } from "@/lib/ai/triage";
import type {
  DraftMode,
  DraftRunOutcome,
  RedTeamRunOutcome,
  TriageRunOutcome,
  StructuredTriageResult,
} from "@/lib/ai/types";
import { getDraftResponseById } from "@/lib/persistence/repository";
import type { CaseRecord, EmailThread, EvidenceRecord, ImportIntakeItem } from "@/lib/mock-data";

type TriageActionResponse = TriageRunOutcome;
type DraftActionResponse = DraftRunOutcome;
type RedTeamActionResponse = RedTeamRunOutcome;

export async function triageIntakeItemAction(input: {
  item: ImportIntakeItem;
  evidenceRecords: EvidenceRecord[];
}): Promise<TriageActionResponse> {
  await requireWritableAccess("/import");
  return runTriageAnalysis(buildIntakeTriageRequest(input.item, input.evidenceRecords));
}

export async function triageThreadAction(input: {
  thread: EmailThread;
  evidenceRecords: EvidenceRecord[];
  redirectTo?: string;
}): Promise<TriageActionResponse> {
  await requireWritableAccess(input.redirectTo ?? "/import");
  return runTriageAnalysis(buildThreadTriageRequest(input.thread, input.evidenceRecords));
}

export async function triageCaseAction(input: {
  caseRecord: CaseRecord;
  evidenceRecords: EvidenceRecord[];
  correspondenceThreads: EmailThread[];
}): Promise<TriageActionResponse> {
  await requireWritableAccess("/cases");
  return runTriageAnalysis(
    buildCaseTriageRequest(input.caseRecord, input.evidenceRecords, input.correspondenceThreads),
  );
}

export async function generateIntakeDraftAction(input: {
  item: ImportIntakeItem;
  evidenceRecords: EvidenceRecord[];
  mode: DraftMode;
  triageResult?: StructuredTriageResult | null;
  triageAuditLogId?: string | null;
}): Promise<DraftActionResponse> {
  await requireWritableAccess("/import");
  const draftId = `draft-${input.item.id}-${Date.now()}`;
  return runDraftGeneration(
    buildIntakeDraftRequest(
      input.item,
      input.evidenceRecords,
      draftId,
      input.mode,
      input.triageResult
        ? {
            sourceType: "intake_item",
            sourceIds: [input.item.id],
            sourceLabel: input.item.title,
            auditLogId: input.triageAuditLogId ?? null,
            result: input.triageResult,
          }
        : null,
    ),
  );
}

export async function generateThreadDraftAction(input: {
  thread: EmailThread;
  evidenceRecords: EvidenceRecord[];
  mode: DraftMode;
  redirectTo?: string;
  triageResult?: StructuredTriageResult | null;
  triageAuditLogId?: string | null;
}): Promise<DraftActionResponse> {
  await requireWritableAccess(input.redirectTo ?? "/import");
  const draftId = `draft-${input.thread.id}-${Date.now()}`;
  return runDraftGeneration(
    buildThreadDraftRequest(
      input.thread,
      input.evidenceRecords,
      draftId,
      input.mode,
      input.triageResult
        ? {
            sourceType: "correspondence_thread",
            sourceIds: [input.thread.id],
            sourceLabel: input.thread.subject,
            auditLogId: input.triageAuditLogId ?? null,
            result: input.triageResult,
          }
        : null,
    ),
  );
}

export async function generateCaseDraftAction(input: {
  caseRecord: CaseRecord;
  evidenceRecords: EvidenceRecord[];
  correspondenceThreads: EmailThread[];
  mode: DraftMode;
  triageResult?: StructuredTriageResult | null;
  triageAuditLogId?: string | null;
}): Promise<DraftActionResponse> {
  await requireWritableAccess("/cases");
  const draftId = `draft-${input.caseRecord.caseId}-${Date.now()}`;
  return runDraftGeneration(
    buildCaseDraftRequest(
      input.caseRecord,
      input.evidenceRecords,
      input.correspondenceThreads,
      draftId,
      input.mode,
      input.triageResult
        ? {
            sourceType: "case",
            sourceIds: [input.caseRecord.caseId],
            sourceLabel: input.caseRecord.title,
            auditLogId: input.triageAuditLogId ?? null,
            result: input.triageResult,
          }
        : null,
    ),
  );
}

export async function runRedTeamReviewAction(input: { draftId: string }): Promise<RedTeamActionResponse> {
  await requireWritableAccess("/drafts");

  const draft = await getDraftResponseById(input.draftId);

  if (!draft) {
    throw new Error("Draft not found.");
  }

  return runRedTeamReview(draft);
}
