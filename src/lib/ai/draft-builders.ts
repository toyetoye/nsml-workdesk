import type { CaseRecord, EmailThread, EvidenceRecord, ImportIntakeItem } from "@/lib/mock-data";
import type { DraftMode, DraftRequest } from "./types";

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
  triageContext?: DraftRequest["triageContext"],
): DraftRequest {
  return {
    sourceType,
    sourceIds: unique(sourceIds),
    sourceLabel,
    sourceSnapshot,
    draftId,
    toneMode,
    triageContext: triageContext ?? null,
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

export const draftModeOptions: Array<{ value: DraftMode; label: string }> = [
  { value: "holding_statement", label: "Holding statement" },
  { value: "normal_technical_reply", label: "Normal technical reply" },
  { value: "firm_but_polite", label: "Firm but polite" },
  { value: "management_summary", label: "Management summary" },
  { value: "vessel_instruction", label: "Vessel instruction" },
  { value: "vendor_clarification", label: "Vendor clarification" },
  { value: "owner_charterer_sensitive", label: "Owner / charterer sensitive" },
];

export function describeDraftMode(mode: DraftMode) {
  return draftModeOptions.find((entry) => entry.value === mode)?.label ?? mode;
}

export function buildIntakeDraftRequest(
  intakeItem: ImportIntakeItem,
  evidenceRecords: EvidenceRecord[],
  draftId: string,
  toneMode: DraftMode,
  triageContext?: DraftRequest["triageContext"],
): DraftRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedIntakeItemRef === intakeItem.id ||
      record.linkedIntakeItemRef === intakeItem.title ||
      record.linkedIntakeItemRef === intakeItem.createdLabel,
  );

  return baseRequest(
    "intake_item",
    [intakeItem.id, ...linkedEvidence.map((record) => record.evidenceId)],
    intakeItem.title,
    {
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
      triage: buildTriageSnapshot(triageContext),
    },
    draftId,
    toneMode,
    triageContext,
  );
}

export function buildThreadDraftRequest(
  thread: EmailThread,
  evidenceRecords: EvidenceRecord[],
  draftId: string,
  toneMode: DraftMode,
  triageContext?: DraftRequest["triageContext"],
): DraftRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.evidenceId === thread.sourceEvidenceId ||
      record.parsedThreadId === thread.id ||
      record.parsedMessageId === thread.messageIdHeader,
  );

  return baseRequest(
    "correspondence_thread",
    [thread.id, ...linkedEvidence.map((record) => record.evidenceId)],
    thread.subject,
    {
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
      triage: buildTriageSnapshot(triageContext),
    },
    draftId,
    toneMode,
    triageContext,
  );
}

export function buildCaseDraftRequest(
  caseRecord: CaseRecord,
  evidenceRecords: EvidenceRecord[],
  threads: EmailThread[],
  draftId: string,
  toneMode: DraftMode,
  triageContext?: DraftRequest["triageContext"],
): DraftRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedCaseId === caseRecord.caseId || record.linkedCaseRef === caseRecord.caseId,
  );
  const linkedThreads = threads.filter(
    (thread) => thread.linkedCase === caseRecord.caseId || thread.id === caseRecord.caseId,
  );

  return baseRequest(
    "case",
    [
      caseRecord.caseId,
      ...linkedEvidence.map((record) => record.evidenceId),
      ...linkedThreads.map((thread) => thread.id),
    ],
    caseRecord.title,
    {
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
    },
    draftId,
    toneMode,
    triageContext,
  );
}
