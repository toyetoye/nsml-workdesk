import {
  allWorkspaces,
  type CasePriority,
  type CaseRecord,
  type CaseStatus,
  type CaseTimelineEvent,
  type EvidenceRecord,
  type EvidenceStatus,
  type EvidenceStorageState,
  type ImportIntakeItem,
  type ImportIntakeStatus,
  type ImportSourceType,
  type ImportWorkspaceAssignment,
  type EmailThreadScope,
} from "@/lib/mock-data";
import type {
  CaseRow,
  EvidenceRow,
  IntakeItemRow,
  TimelineEventRow,
} from "@/lib/persistence/types";

type IntakeSubmission = {
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  status: ImportIntakeStatus;
  senderSource: string;
  dateTime: string;
  bodyContent: string;
  tags: string;
};

type CaseSubmission = {
  title: string;
  summary: string;
  workspaceKey: EmailThreadScope;
  status: CaseStatus;
  priority: CasePriority;
  category: string;
  owner: string;
  waitingOn: string;
  dueLabel: string;
  nextAction: string;
  riskNote: string;
  decisionRequired: string;
  sourceIntakeRef: string;
  tags: string;
};

type EvidenceSubmission = {
  evidenceId?: string;
  title: string;
  sourceType: ImportSourceType;
  workspaceAssignment: ImportWorkspaceAssignment;
  status: EvidenceStatus;
  description: string;
  linkedIntakeItemRef: string;
  linkedCaseRef: string;
  linkedCaseId: string | null;
  sourceLabel: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  storageState: EvidenceStorageState;
  storageBucket: string | null;
  storagePath: string | null;
  uploadedAt: string | null;
};

function formatDisplayDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatEvidenceDate(value: string | null) {
  if (!value) {
    return "Not uploaded yet";
  }

  return formatDisplayDateTime(value);
}

function sourceTypeToEvidenceType(sourceType: ImportSourceType): EvidenceRecord["type"] {
  switch (sourceType) {
    case "manual-note":
      return "note";
    case "screenshot-placeholder":
      return "screenshot";
    case "document-placeholder":
      return "document";
    case "eml-placeholder":
      return "eml-placeholder";
    case "pasted-email":
    default:
      return "email";
  }
}

export function formatEvidenceSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${kib.toFixed(1)} KB`;
  }

  return `${(kib / 1024).toFixed(1)} MB`;
}

function createRouteNote(workspaceAssignment: ImportWorkspaceAssignment) {
  if (workspaceAssignment === "Import/Staging") {
    return "Still staged for manual classification.";
  }

  return `Simulated assignment to ${workspaceAssignment}.`;
}

export function buildIntakeItemFromSubmission(submission: IntakeSubmission): ImportIntakeItem {
  const sourceLabel = submission.sourceType.replace(/-/g, " ");

  return {
    id: `intake-${Date.now()}`,
    title: submission.title.trim() || "Untitled intake",
    sourceType: submission.sourceType,
    workspaceAssignment: submission.workspaceAssignment,
    status: submission.status,
    senderSource: submission.senderSource.trim() || "Unknown source",
    dateTime: formatDisplayDateTime(submission.dateTime),
    bodyContent:
      submission.bodyContent.trim() || "No body provided yet. This is a placeholder intake entry.",
    tags: submission.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    routeNote: createRouteNote(submission.workspaceAssignment),
    casePlaceholder: "Case link placeholder: Unlinked",
    createdLabel: `Created from ${sourceLabel}`,
  };
}

export function mapIntakeRowsToItems(rows: IntakeItemRow[]): ImportIntakeItem[] {
  return rows.map((row) => ({
    id: row.intake_id,
    title: row.subject_title,
    sourceType: row.source_type as ImportSourceType,
    workspaceAssignment: row.workspace_assignment as ImportWorkspaceAssignment,
    status: row.status as ImportIntakeStatus,
    senderSource: row.sender_source,
    dateTime: formatDisplayDateTime(row.received_at),
    bodyContent: row.body_content,
    tags: row.tags,
    routeNote: row.route_note ?? createRouteNote(row.workspace_assignment as ImportWorkspaceAssignment),
    casePlaceholder: row.linked_case_id
      ? `Case link placeholder: ${row.linked_case_id}`
      : "Case link placeholder: Unlinked",
    createdLabel: row.created_from_label ?? `Created from ${row.source_type}`,
  }));
}

export function buildCaseRecordFromSubmission(submission: CaseSubmission): {
  caseRecord: CaseRecord;
  timelineEvents: CaseTimelineEvent[];
} {
  const workspace =
    allWorkspaces.find((item) => item.slug === submission.workspaceKey) ?? allWorkspaces[0];
  const openedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  const openedTime = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const caseId = `CASE-NEW-${Date.now()}`;
  const timelineEvents: CaseTimelineEvent[] = [
    {
      id: `${caseId}-created`,
      dateTime: openedTime,
      title: "Case created",
      note: "Created in the client-side prototype case drawer.",
      tone: "neutral",
    },
    {
      id: `${caseId}-review`,
      dateTime: openedTime,
      title: "Ready for review",
      note: "The new case is selected and ready for evidence to be attached.",
      tone: "accent",
    },
  ];

  return {
    caseRecord: {
      caseId,
      title: submission.title.trim() || "Untitled case",
      summary: submission.summary.trim() || "No summary captured yet.",
      workspaceKey: workspace.slug as EmailThreadScope,
      workspaceLabel: workspace.name,
      vesselProject: workspace.name,
      owner: submission.owner.trim() || "Toye Omolade",
      status: submission.status,
      priority: submission.priority,
      category: submission.category.trim() || "Unclassified",
      openedDate,
      age: "New",
      dueLabel: submission.dueLabel.trim() || "Due soon",
      waitingOn: submission.waitingOn.trim() || "TBD",
      nextAction: submission.nextAction.trim() || "Define the next operational step.",
      riskNote: submission.riskNote.trim() || "No risk note captured yet.",
      linkedThreads: [],
      linkedEvidence: [],
      timelineEvents,
      decisionRequired:
        submission.decisionRequired.trim() || "No decision requirement captured yet.",
      tags: submission.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sourceIntakeRef: submission.sourceIntakeRef.trim() || "Create from intake item placeholder",
      workspaceHref: workspace.href,
    },
    timelineEvents,
  };
}

export function mapCaseRowsToRecords(
  caseRows: CaseRow[],
  timelineRows: TimelineEventRow[],
): CaseRecord[] {
  const timelineByCase = new Map<string, CaseTimelineEvent[]>();

  for (const row of timelineRows) {
    const list = timelineByCase.get(row.case_id) ?? [];
    list.push({
      id: row.event_id,
      dateTime: formatDisplayDateTime(row.happened_at),
      title: row.title,
      note: row.note,
      tone: row.tone as CaseTimelineEvent["tone"],
    });
    timelineByCase.set(row.case_id, list);
  }

  return caseRows.map((row) => ({
    caseId: row.case_id,
    title: row.title,
    summary: row.summary,
    workspaceKey: row.workspace_key as EmailThreadScope,
    workspaceLabel: row.workspace_label,
    vesselProject: row.vessel_project,
    owner: row.owner,
    status: row.status as CaseStatus,
    priority: row.priority as CasePriority,
    category: row.category,
    openedDate: row.opened_at,
    age: row.age_label,
    dueLabel: row.due_label,
    waitingOn: row.waiting_on,
    nextAction: row.next_action,
    riskNote: row.risk_note,
    linkedThreads: row.linked_thread_ids,
    linkedEvidence: row.linked_evidence_ids,
    timelineEvents: timelineByCase.get(row.case_id) ?? [],
    decisionRequired: row.decision_required,
    tags: row.tags,
    sourceIntakeRef: row.source_intake_ref ?? "Create from intake item placeholder",
    workspaceHref: row.workspace_href,
  }));
}

export function buildEvidenceRecordFromSubmission(submission: EvidenceSubmission): EvidenceRecord {
  return {
    evidenceId: submission.evidenceId ?? `EVID-${Date.now()}`,
    title: submission.title.trim() || "Untitled evidence",
    type: sourceTypeToEvidenceType(submission.sourceType),
    source: submission.sourceLabel.trim() || "Evidence upload",
    date: formatEvidenceDate(submission.uploadedAt),
    linkedCaseId: submission.linkedCaseId,
    description: submission.description.trim() || "No description captured yet.",
    status: submission.status,
    storageState: submission.storageState,
    sourceType: submission.sourceType,
    workspaceAssignment: submission.workspaceAssignment,
    linkedIntakeItemRef: submission.linkedIntakeItemRef.trim() || "Evidence intake placeholder",
    linkedCaseRef: submission.linkedCaseRef.trim() || "Evidence case placeholder",
    originalFilename: submission.fileName,
    fileSizeBytes: submission.fileSizeBytes,
    storageBucket: submission.storageBucket,
    storagePath: submission.storagePath,
    mimeType: submission.mimeType,
    uploadedAt: submission.uploadedAt,
  };
}

export function mapEvidenceRowsToRecords(rows: EvidenceRow[]): EvidenceRecord[] {
  return rows.map((row) => ({
    evidenceId: row.evidence_id,
    title: row.title,
    type: row.type as EvidenceRecord["type"],
    source: row.source,
    date: formatEvidenceDate(row.uploaded_at ?? row.created_at),
    linkedCaseId: row.case_id,
    description: row.description,
    status: row.status as EvidenceStatus,
    storageState: row.storage_state as EvidenceStorageState,
    sourceType: row.source_type as ImportSourceType,
    workspaceAssignment: row.workspace_assignment as ImportWorkspaceAssignment,
    linkedIntakeItemRef: row.linked_intake_item_ref ?? "Evidence intake placeholder",
    linkedCaseRef: row.linked_case_ref ?? row.case_id ?? "Evidence case placeholder",
    originalFilename: row.original_filename ?? null,
    fileSizeBytes: row.file_size_bytes ?? null,
    storageBucket: row.storage_bucket ?? null,
    storagePath: row.storage_path ?? null,
    mimeType: row.mime_type ?? null,
    uploadedAt: row.uploaded_at ?? null,
  }));
}

export type { IntakeSubmission, CaseSubmission, EvidenceSubmission };
