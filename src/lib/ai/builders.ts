import type { CaseRecord, EmailThread, EvidenceRecord, ImportIntakeItem } from "@/lib/mock-data";
import type { TriageRequest, TriageSourceType } from "./types";

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
      220,
    ),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function buildIntakeTriageRequest(
  intakeItem: ImportIntakeItem,
  evidenceRecords: EvidenceRecord[],
): TriageRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedIntakeItemRef === intakeItem.id ||
      record.linkedIntakeItemRef === intakeItem.title ||
      record.linkedIntakeItemRef === intakeItem.createdLabel,
  );

  const sourceIds = unique([intakeItem.id, ...linkedEvidence.map((record) => record.evidenceId)]);

  return {
    sourceType: "intake_item",
    sourceIds,
    sourceLabel: intakeItem.title,
    sourceSnapshot: {
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
      evidence: linkedEvidence.map(evidenceSummary),
    },
  };
}

export function buildThreadTriageRequest(
  thread: EmailThread,
  evidenceRecords: EvidenceRecord[],
): TriageRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.evidenceId === thread.sourceEvidenceId ||
      record.parsedThreadId === thread.id ||
      record.parsedMessageId === thread.messageIdHeader,
  );

  const sourceIds = unique([thread.id, ...linkedEvidence.map((record) => record.evidenceId)]);

  return {
    sourceType: "correspondence_thread",
    sourceIds,
    sourceLabel: thread.subject,
    sourceSnapshot: {
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
      evidence: linkedEvidence.map(evidenceSummary),
    },
  };
}

export function buildCaseTriageRequest(
  caseRecord: CaseRecord,
  evidenceRecords: EvidenceRecord[],
  threads: EmailThread[],
): TriageRequest {
  const linkedEvidence = evidenceRecords.filter(
    (record) =>
      record.linkedCaseId === caseRecord.caseId || record.linkedCaseRef === caseRecord.caseId,
  );
  const linkedThreads = threads.filter(
    (thread) => thread.linkedCase === caseRecord.caseId || thread.id === caseRecord.caseId,
  );

  const sourceIds = unique([
    caseRecord.caseId,
    ...linkedEvidence.map((record) => record.evidenceId),
    ...linkedThreads.map((thread) => thread.id),
  ]);

  return {
    sourceType: "case",
    sourceIds,
    sourceLabel: caseRecord.title,
    sourceSnapshot: {
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
      evidence: linkedEvidence.map(evidenceSummary),
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
    },
  };
}

export function describeTriageSourceType(sourceType: TriageSourceType) {
  switch (sourceType) {
    case "intake_item":
      return "Intake item";
    case "correspondence_thread":
      return "Correspondence thread";
    case "case":
      return "Case";
    default:
      return sourceType;
  }
}
