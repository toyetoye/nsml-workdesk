"use server";

import { requireWritableAccess } from "@/lib/auth-session";
import {
  saveCase,
  saveTimelineEvent,
} from "@/lib/persistence/repository";
import { buildCaseRecordFromSubmission, type CaseSubmission } from "@/lib/workbench-data";

type SaveCaseResult = {
  caseRecord: ReturnType<typeof buildCaseRecordFromSubmission>["caseRecord"];
  persisted: boolean;
};

export async function saveCaseAction(submission: CaseSubmission): Promise<SaveCaseResult> {
  await requireWritableAccess("/cases");

  const { caseRecord, timelineEvents } = buildCaseRecordFromSubmission(submission);
  const savedCase = await saveCase({
    case_id: caseRecord.caseId,
    title: caseRecord.title,
    summary: caseRecord.summary,
    workspace_key: caseRecord.workspaceKey,
    workspace_label: caseRecord.workspaceLabel,
    vessel_project: caseRecord.vesselProject,
    owner: caseRecord.owner,
    status: caseRecord.status,
    priority: caseRecord.priority,
    category: caseRecord.category,
    opened_at: caseRecord.openedDate,
    age_label: caseRecord.age,
    due_label: caseRecord.dueLabel,
    waiting_on: caseRecord.waitingOn,
    next_action: caseRecord.nextAction,
    risk_note: caseRecord.riskNote,
    decision_required: caseRecord.decisionRequired,
    tags: caseRecord.tags,
    source_intake_ref: caseRecord.sourceIntakeRef,
    workspace_href: caseRecord.workspaceHref,
    linked_thread_ids: caseRecord.linkedThreads,
    linked_evidence_ids: caseRecord.linkedEvidence,
  });

  const timelineResults = await Promise.all(
    timelineEvents.map((event) =>
      saveTimelineEvent({
        event_id: event.id,
        case_id: caseRecord.caseId,
        event_type: event.tone,
        title: event.title,
        note: event.note,
        happened_at: event.dateTime,
        tone: event.tone,
        source_ref: caseRecord.sourceIntakeRef,
      }),
    ),
  );

  return {
    caseRecord,
    persisted:
      savedCase.persisted && timelineResults.every((result) => result.persisted),
  };
}
