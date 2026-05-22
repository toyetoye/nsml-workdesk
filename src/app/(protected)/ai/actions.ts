"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import { buildCaseTriageRequest, buildIntakeTriageRequest, buildThreadTriageRequest } from "@/lib/ai/builders";
import { runTriageAnalysis } from "@/lib/ai/triage";
import type { TriageRunOutcome } from "@/lib/ai/types";
import type { CaseRecord, EmailThread, EvidenceRecord, ImportIntakeItem } from "@/lib/mock-data";

type TriageActionResponse = TriageRunOutcome;

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
