import type { CaseRecord, EmailThread, EvidenceRecord, ImportIntakeItem } from "@/lib/mock-data";
import type { DraftMode } from "./draft-modes";
import type { DraftRequest } from "./types";
import type { WritingStyleProfileSnapshot } from "@/lib/writing-style/profile";

export { describeDraftMode } from "./draft-modes";

function limitText(value: string, maxLength = 1200) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}…`;
}

function evidenceSummary(record: EvidenceRecord) {
  return {
    source_id: record.evidenceId,
    source_type: record.type,
    label: record.title,
    note: limitText(
      [
        record.status,
        record.storageState,
        record.parseStatus,
        record.originalFilename ? `file: ${record.originalFilename}` : null,
        record.mimeType ? `mime: ${record.mimeType}` : null,
        record.fileSizeBytes ? `size: ${record.fileSizeBytes} bytes` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      240,
    ),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function baseRequest(
  sourceType: DraftRequest["sourceType"],
  sourceIds: string[],
  sourceLabel: string,
  sourceSnapshot: Record<string, unknown>,
  draftId: string,
  toneMode: DraftMode,
  writingStyleProfile?: WritingStyleProfileSnapshot | null,
  triageContext?: DraftRequest["triageContext"],
  imsReferencesUsed: DraftRequest["imsReferencesUsed"] = [],
  imsReferenceNote: DraftRequest["imsReferenceNote"] = null,
): DraftRequest {
  return {
    sourceType,
    sourceIds: unique(sourceIds),
    sourceLabel,
    sourceSnapshot,
    draftId,
    toneMode,
    writingStyleProfile: writingStyleProfile ?? null,
    triageContext: triageContext ?? null,
    imsReferencesUsed,
    imsReferenceNote,
  };
}

function buildSourceEvidence(records: EvidenceRecord[]) {
  return records.map(evidenceSummary);
}

function buildTriageSnapshot(
  triageContext: DraftRequest["triageContext"],
): Record<string, unknown> | null {
  if (!triageContext) {
    return null;
  }

  const { sourceType, sourceIds, sourceLabel, auditLogId, result } = triageContext;

  return {
    sourceType,
    sourceIds,
    sourceLabel,
    auditLogId,
    result,
  };
}

export async function buildIntakeDraftRequest(
  intakeItem: ImportIntakeItem,
  evidenceRecords: EvidenceRecord[],
  draftId: string,
  toneMode: DraftMode,
  writingStyleProfile?: WritingStyleProfileSnapshot | null,
  triageContext?: DraftRequest["triageContext"],
): Promise<DraftRequest> {
  const { buildIMSReferencesForContext } = await import("@/lib/ims/search");
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedIntakeItemRef === intakeItem.id ||
      record.linkedIntakeItemRef === intakeItem.title ||
      record.linkedIntakeItemRef === intakeItem.createdLabel,
  );

  const sourceSnapshot = {
    intakeItem: {
      id: intakeItem.id,
      title: intakeItem.title,
      sourceType: intakeItem.sourceType,
      workspaceAssignment: intakeItem.workspaceAssignment,
      status: intakeItem.status,
      senderSource: intakeItem.senderSource,
      dateTime: intakeItem.dateTime,
      bodyContent: limitText(intakeItem.bodyContent, 1800),
      tags: intakeItem.tags,
      routeNote: intakeItem.routeNote,
      casePlaceholder: intakeItem.casePlaceholder,
      createdLabel: intakeItem.createdLabel,
    },
    evidence: buildSourceEvidence(linkedEvidence),
    writingStyleProfile: writingStyleProfile ?? null,
    triage: buildTriageSnapshot(triageContext),
  };
  const ims = await buildIMSReferencesForContext({
    sourceType: "intake_item",
    sourceLabel: intakeItem.title,
    sourceSnapshot,
  });

  return baseRequest(
    "intake_item",
    [intakeItem.id, ...linkedEvidence.map((record) => record.evidenceId)],
    intakeItem.title,
    sourceSnapshot,
    draftId,
    toneMode,
    writingStyleProfile,
    triageContext,
    ims.references,
    ims.note,
  );
}

export async function buildThreadDraftRequest(
  thread: EmailThread,
  evidenceRecords: EvidenceRecord[],
  draftId: string,
  toneMode: DraftMode,
  writingStyleProfile?: WritingStyleProfileSnapshot | null,
  triageContext?: DraftRequest["triageContext"],
): Promise<DraftRequest> {
  const { buildIMSReferencesForContext } = await import("@/lib/ims/search");
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.evidenceId === thread.sourceEvidenceId ||
      record.parsedThreadId === thread.id ||
      record.parsedMessageId === thread.messageIdHeader,
  );

  const sourceSnapshot = {
    thread: {
      id: thread.id,
      subject: thread.subject,
      sender: thread.sender,
      recipients: thread.recipients,
      cc: thread.cc,
      bcc: thread.bcc ?? [],
      dateTime: thread.dateTime,
      vesselProject: thread.vesselProject,
      status: thread.status,
      parseStatus: thread.parseStatus ?? "parsed",
      parseError: thread.parseError ?? null,
      sourceEvidenceId: thread.sourceEvidenceId ?? null,
      originalFilename: thread.originalFilename ?? null,
      messageIdHeader: thread.messageIdHeader ?? null,
      inReplyTo: thread.inReplyTo ?? null,
      references: thread.references ?? [],
      bodyText: limitText(thread.bodyText ?? "", 1600),
      bodyHtmlText: thread.bodyHtmlText ? "[HTML stored as text-only placeholder]" : null,
    },
    messages: thread.messages.map((message, index) => ({
      id: `${thread.id}-message-${index + 1}`,
      sender: message.sender,
      timestamp: message.timestamp,
      subject: message.subject ?? thread.subject,
      to: message.to ?? [],
      cc: message.cc ?? [],
      bcc: message.bcc ?? [],
      messageId: message.messageId ?? null,
      inReplyTo: message.inReplyTo ?? null,
      references: message.references ?? [],
      body: limitText(message.body, 1200),
      sourceEvidenceId: message.sourceEvidenceId ?? null,
      attachmentMetadata: (message.attachmentMetadata ?? []).map((attachment) => ({
        name: attachment.name,
        kind: attachment.kind,
        size: attachment.size,
      })),
    })),
    evidence: buildSourceEvidence(linkedEvidence),
    writingStyleProfile: writingStyleProfile ?? null,
    triage: buildTriageSnapshot(triageContext),
  };
  const ims = await buildIMSReferencesForContext({
    sourceType: "correspondence_thread",
    sourceLabel: thread.subject,
    sourceSnapshot,
  });

  return baseRequest(
    "correspondence_thread",
    [thread.id, ...linkedEvidence.map((record) => record.evidenceId)],
    thread.subject,
    sourceSnapshot,
    draftId,
    toneMode,
    writingStyleProfile,
    triageContext,
    ims.references,
    ims.note,
  );
}

export async function buildCaseDraftRequest(
  caseRecord: CaseRecord,
  evidenceRecords: EvidenceRecord[],
  threads: EmailThread[],
  draftId: string,
  toneMode: DraftMode,
  writingStyleProfile?: WritingStyleProfileSnapshot | null,
  triageContext?: DraftRequest["triageContext"],
): Promise<DraftRequest> {
  const { buildIMSReferencesForContext } = await import("@/lib/ims/search");
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedCaseId === caseRecord.caseId || record.linkedCaseRef === caseRecord.caseId,
  );
  const linkedThreads = threads.filter(
    (thread) => thread.linkedCase === caseRecord.caseId || thread.id === caseRecord.caseId,
  );

  const sourceSnapshot = {
    case: {
      caseId: caseRecord.caseId,
      title: caseRecord.title,
      summary: limitText(caseRecord.summary, 1600),
      workspaceKey: caseRecord.workspaceKey,
      workspaceLabel: caseRecord.workspaceLabel,
      vesselProject: caseRecord.vesselProject,
      owner: caseRecord.owner,
      status: caseRecord.status,
      priority: caseRecord.priority,
      category: caseRecord.category,
      openedDate: caseRecord.openedDate,
      age: caseRecord.age,
      dueLabel: caseRecord.dueLabel,
      waitingOn: caseRecord.waitingOn,
      nextAction: caseRecord.nextAction,
      riskNote: caseRecord.riskNote,
      decisionRequired: caseRecord.decisionRequired,
      tags: caseRecord.tags,
      sourceIntakeRef: caseRecord.sourceIntakeRef,
      workspaceHref: caseRecord.workspaceHref,
      linkedThreads: caseRecord.linkedThreads,
      linkedEvidence: caseRecord.linkedEvidence,
    },
    evidence: buildSourceEvidence(linkedEvidence),
    writingStyleProfile: writingStyleProfile ?? null,
    correspondence: linkedThreads.map((thread) => ({
      threadId: thread.id,
      subject: thread.subject,
      sender: thread.sender,
      status: thread.status,
      parseStatus: thread.parseStatus ?? "parsed",
      parseError: thread.parseError ?? null,
      sourceEvidenceId: thread.sourceEvidenceId ?? null,
      linkedCase: thread.linkedCase,
      dateTime: thread.dateTime,
      messageCount: thread.messages.length,
      attachmentCount: thread.attachments.length,
    })),
    triage: buildTriageSnapshot(triageContext),
  };
  const ims = await buildIMSReferencesForContext({
    sourceType: "case",
    sourceLabel: caseRecord.title,
    sourceSnapshot,
  });

  return baseRequest(
    "case",
    [
      caseRecord.caseId,
      ...linkedEvidence.map((record) => record.evidenceId),
      ...linkedThreads.map((thread) => thread.id),
    ],
    caseRecord.title,
    sourceSnapshot,
    draftId,
    toneMode,
    writingStyleProfile,
    triageContext,
    ims.references,
    ims.note,
  );
}
