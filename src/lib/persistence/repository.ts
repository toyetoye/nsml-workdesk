import "server-only";

import { randomUUID } from "node:crypto";
import {
  allWorkspaces,
  caseRecords,
  evidenceRecords,
  importedEmailThreads,
  importIntakeSeedItems,
  recentImportActivity,
  type CaseRecord,
  type EmailThread,
  type ImportIntakeItem,
  type RecentImportActivity,
} from "@/lib/mock-data";
import { deriveInitialEvidenceParseStatus } from "@/lib/email-ingestion/shared";
import { createPersistenceClient, isPersistenceAvailable } from "./client";
import type {
  AuditLogRow,
  CaseCorrespondenceLinkRow,
  CaseEvidenceLinkRow,
  CaseInput,
  CaseRow,
  CorrespondenceMessageInput,
  CorrespondenceMessageRow,
  CorrespondenceThreadInput,
  CorrespondenceThreadRow,
  DecisionRow,
  DraftResponsePlaceholderRow,
  DraftResponseInput,
  EvidenceInput,
  EvidenceRow,
  ImportBatchInput,
  ImportBatchRow,
  IntakeItemInput,
  IntakeItemRow,
  TimelineEventInput,
  TimelineEventRow,
  WorkspaceRow,
} from "./types";

type PersistenceStore = {
  workspaces: WorkspaceRow[];
  import_batches: ImportBatchRow[];
  intake_items: IntakeItemRow[];
  cases: CaseRow[];
  evidence_items: EvidenceRow[];
  correspondence_threads: CorrespondenceThreadRow[];
  correspondence_messages: CorrespondenceMessageRow[];
  case_evidence_links: CaseEvidenceLinkRow[];
  case_correspondence_links: CaseCorrespondenceLinkRow[];
  timeline_events: TimelineEventRow[];
  decisions: DecisionRow[];
  draft_responses_placeholder: DraftResponsePlaceholderRow[];
  audit_logs: AuditLogRow[];
};

type RepoQueryResult = {
  data: unknown;
  error: unknown;
};

type RepoQuery = PromiseLike<RepoQueryResult> & {
  select: (...args: unknown[]) => RepoQuery;
  insert: (value: unknown) => RepoQuery;
  upsert: (value: unknown) => RepoQuery;
  update: (value: unknown) => RepoQuery;
  delete: () => RepoQuery;
  eq: (...args: unknown[]) => RepoQuery;
  neq: (...args: unknown[]) => RepoQuery;
  order: (...args: unknown[]) => RepoQuery;
  limit: (...args: unknown[]) => RepoQuery;
  range: (...args: unknown[]) => RepoQuery;
  contains: (...args: unknown[]) => RepoQuery;
  in: (...args: unknown[]) => RepoQuery;
  ilike: (...args: unknown[]) => RepoQuery;
  gte: (...args: unknown[]) => RepoQuery;
  lte: (...args: unknown[]) => RepoQuery;
  is: (...args: unknown[]) => RepoQuery;
  not: (...args: unknown[]) => RepoQuery;
  or: (...args: unknown[]) => RepoQuery;
  single: () => Promise<RepoQueryResult>;
  maybeSingle: () => Promise<RepoQueryResult>;
};

type RepoClient = {
  from: (table: string) => RepoQuery;
};

type WriteResult<Row> = {
  row: Row;
  persisted: boolean;
};

const nowIso = () => new Date().toISOString();

function toIsoDateTime(display: string) {
  const parsed = new Date(display);

  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function toWorkspaceRow(workspace: (typeof allWorkspaces)[number]): WorkspaceRow {
  return {
    slug: workspace.slug,
    name: workspace.name,
    kind:
      workspace.type === "Vessel"
        ? "vessel"
        : workspace.type === "Project"
          ? "project"
          : "general",
    description: workspace.description,
    sort_order:
      workspace.slug === "lng-portharcourt-ii"
        ? 1
        : workspace.slug === "lpg-alfred-temile"
          ? 2
          : workspace.slug === "lpg-alfred-temile-10"
            ? 3
            : workspace.slug === "projects"
              ? 4
              : 5,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toIntakeRow(item: ImportIntakeItem): IntakeItemRow {
  return {
    intake_id: item.id,
    batch_id: null,
    subject_title: item.title,
    source_type: item.sourceType,
    workspace_assignment: item.workspaceAssignment,
    status: item.status,
    sender_source: item.senderSource,
    received_at: toIsoDateTime(item.dateTime),
    body_content: item.bodyContent,
    tags: item.tags,
    route_note: item.routeNote,
    created_from_label: item.createdLabel,
    linked_case_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toCaseRow(item: CaseRecord): CaseRow {
  return {
    case_id: item.caseId,
    title: item.title,
    summary: item.summary,
    workspace_key: item.workspaceKey,
    workspace_label: item.workspaceLabel,
    vessel_project: item.vesselProject,
    owner: item.owner,
    status: item.status,
    priority: item.priority,
    category: item.category,
    opened_at: item.openedDate,
    age_label: item.age,
    due_label: item.dueLabel,
    waiting_on: item.waitingOn,
    next_action: item.nextAction,
    risk_note: item.riskNote,
    decision_required: item.decisionRequired,
    tags: item.tags,
    source_intake_ref: item.sourceIntakeRef,
    workspace_href: item.workspaceHref,
    linked_thread_ids: item.linkedThreads,
    linked_evidence_ids: item.linkedEvidence,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toEvidenceRow(item: (typeof evidenceRecords)[number]): EvidenceRow {
  return {
    evidence_id: item.evidenceId,
    case_id: item.linkedCaseId || null,
    title: item.title,
    type: item.type,
    source: item.source,
    date: item.date,
    description: item.description,
    status: item.status,
    storage_state: item.storageState,
    source_type: item.sourceType,
    workspace_assignment: item.workspaceAssignment,
    linked_intake_item_ref: item.linkedIntakeItemRef,
    linked_case_ref: item.linkedCaseRef,
    original_filename: item.originalFilename,
    file_size_bytes: item.fileSizeBytes,
    storage_bucket: null,
    storage_path: null,
    mime_type: null,
    uploaded_at: item.uploadedAt,
    parse_status: item.parseStatus,
    parse_error: item.parseError,
    parsed_thread_id: item.parsedThreadId,
    parsed_message_id: item.parsedMessageId,
    parsed_at: item.parsedAt,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toThreadRow(item: EmailThread, caseId: string | null): CorrespondenceThreadRow {
  return {
    thread_id: item.id,
    workspace_key: item.workspaceKey,
    case_id: caseId,
    subject: item.subject,
    sender: item.sender,
    recipients: item.recipients,
    cc: item.cc,
    date_time: toIsoDateTime(item.dateTime),
    status: item.status,
    vessel_project: item.vesselProject,
    source_intake_item_id: item.workspaceKey === "import" || item.workspaceKey === "unclassified" ? item.id : null,
    linked_case_id: caseId,
    source_evidence_id: item.sourceEvidenceId ?? null,
    parse_status: item.parseStatus ?? "not parsed",
    parse_error: item.parseError ?? null,
    original_filename: item.originalFilename ?? null,
    message_id_header: item.messageIdHeader ?? null,
    in_reply_to: item.inReplyTo ?? null,
    references: item.references ?? [],
    bcc: item.bcc ?? [],
    body_text: item.bodyText ?? null,
    body_html_text: item.bodyHtmlText ?? null,
    attachment_metadata: item.messages.flatMap((message) => message.attachmentMetadata ?? []),
    parsed_at: item.parsedAt ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toMessageRows(item: EmailThread): CorrespondenceMessageRow[] {
  return item.messages.map((message, index) => ({
    message_id: `${item.id}-msg-${index + 1}`,
    thread_id: item.id,
    sender: message.sender,
    body: message.body,
    timestamp: toIsoDateTime(message.timestamp),
    sort_order: index + 1,
    recipients: message.to ?? item.recipients,
    cc_recipients: message.cc ?? item.cc,
    bcc_recipients: message.bcc ?? item.bcc ?? [],
    subject: message.subject ?? item.subject,
    message_id_header: message.messageId ?? item.messageIdHeader ?? null,
    in_reply_to: message.inReplyTo ?? item.inReplyTo ?? null,
    references: message.references ?? item.references ?? [],
    body_text: message.body,
    body_html_text: message.bodyHtmlText ?? null,
    attachment_metadata: message.attachmentMetadata ?? [],
    source_evidence_id: message.sourceEvidenceId ?? item.sourceEvidenceId ?? null,
    parsed_at: item.parsedAt ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));
}

function toImportBatchRow(item: RecentImportActivity): ImportBatchRow {
  return {
    batch_id: item.id,
    source_type: "mock-intake",
    source_label: item.summary,
    received_at: toIsoDateTime(item.receivedAt),
    workspace_key: item.workspaceKey,
    status: item.status,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function toTimelineEventRow(caseItem: CaseRecord): TimelineEventRow[] {
  return caseItem.timelineEvents.map((event) => ({
    event_id: event.id,
    case_id: caseItem.caseId,
    event_type: event.tone,
    title: event.title,
    note: event.note,
    happened_at: toIsoDateTime(event.dateTime),
    tone: event.tone,
    source_ref: caseItem.sourceIntakeRef,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));
}

function createFallbackStore(): PersistenceStore {
  const workspaces = allWorkspaces.map(toWorkspaceRow);
  const intake_items = importIntakeSeedItems.map(toIntakeRow);
  const cases = caseRecords.map(toCaseRow);
  const evidence_items = evidenceRecords.map(toEvidenceRow);

  const correspondence_threads = importedEmailThreads.map((thread) => {
    const linkedCase = cases.find((caseRow) => caseRow.case_id === thread.linkedCase) ?? null;

    return toThreadRow(thread, linkedCase?.case_id ?? null);
  });

  const correspondence_messages = importedEmailThreads.flatMap(toMessageRows);
  const import_batches = recentImportActivity.map(toImportBatchRow);
  const case_evidence_links = evidence_items
    .filter((evidence) => Boolean(evidence.case_id))
    .map((evidence) => ({
      link_id: `link-${evidence.evidence_id}`,
      case_id: evidence.case_id ?? "",
      evidence_id: evidence.evidence_id,
      link_role: "primary",
      created_at: nowIso(),
    }));
  const case_correspondence_links = correspondence_threads
    .filter((thread) => thread.case_id)
    .map((thread) => ({
      link_id: `link-${thread.thread_id}`,
      case_id: thread.case_id ?? "",
      thread_id: thread.thread_id,
      created_at: nowIso(),
    }));
  const timeline_events = caseRecords.flatMap(toTimelineEventRow);

  return {
    workspaces,
    import_batches,
    intake_items,
    cases,
    evidence_items,
    correspondence_threads,
    correspondence_messages,
    case_evidence_links,
    case_correspondence_links,
    timeline_events,
    decisions: [],
    draft_responses_placeholder: [],
    audit_logs: [],
  };
}

const fallbackStore = createFallbackStore();

function getRepoClient() {
  return createPersistenceClient() as unknown as RepoClient;
}

function clone<T>(value: T): T {
  return globalThis.structuredClone
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function upsertById<Row extends Record<string, unknown>>(
  rows: Row[],
  idKey: keyof Row,
  row: Row,
) {
  const index = rows.findIndex((item) => item[idKey] === row[idKey]);

  if (index >= 0) {
    rows[index] = row;
    return;
  }

  rows.unshift(row);
}

function resolveCaseIdFromThreadRef(threadRef: string) {
  const fromCase = fallbackStore.cases.find((item) => item.case_id === threadRef);

  if (fromCase) {
    return fromCase.case_id;
  }

  const linkedThread = importedEmailThreads.find((thread) => thread.id === threadRef);
  const linkedCase = linkedThread ? fallbackStore.cases.find((item) => item.case_id === linkedThread.linkedCase) : null;

  return linkedCase?.case_id ?? null;
}

export async function listWorkspaces() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.workspaces);
  }

  const client = getRepoClient();
  const { data, error } = await client.from("workspaces").select("*").order("sort_order");

  if (error || !data) {
    return clone(fallbackStore.workspaces);
  }

  return data as WorkspaceRow[];
}

export async function listImportBatches() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.import_batches);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("import_batches")
    .select("*")
    .order("received_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.import_batches);
  }

  return data as ImportBatchRow[];
}

export async function saveImportBatch(input: ImportBatchInput) {
  const row: ImportBatchRow = {
    batch_id: input.batch_id ?? `batch-${randomUUID()}`,
    source_type: input.source_type,
    source_label: input.source_label,
    received_at: input.received_at,
    workspace_key: input.workspace_key ?? null,
    status: input.status,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.import_batches, "batch_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("import_batches").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.import_batches, "batch_id", row);
    return { row, persisted: false };
  }

  return { row: data as ImportBatchRow, persisted: true };
}

export async function listIntakeItems() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.intake_items);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("intake_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.intake_items);
  }

  return data as IntakeItemRow[];
}

export async function saveIntakeItem(input: IntakeItemInput): Promise<WriteResult<IntakeItemRow>> {
  const row: IntakeItemRow = {
    intake_id: input.intake_id ?? `intake-${randomUUID()}`,
    batch_id: input.batch_id ?? null,
    subject_title: input.subject_title,
    source_type: input.source_type,
    workspace_assignment: input.workspace_assignment,
    status: input.status,
    sender_source: input.sender_source,
    received_at: input.received_at,
    body_content: input.body_content,
    tags: input.tags ?? [],
    route_note: input.route_note ?? null,
    created_from_label: input.created_from_label ?? null,
    linked_case_id: input.linked_case_id ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.intake_items, "intake_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("intake_items").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.intake_items, "intake_id", row);
    return { row, persisted: false };
  }

  return { row: data as IntakeItemRow, persisted: true };
}

export async function listCases() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.cases);
  }

  const client = getRepoClient();
  const { data, error } = await client.from("cases").select("*").order("created_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.cases);
  }

  return data as CaseRow[];
}

export async function saveCase(input: CaseInput): Promise<WriteResult<CaseRow>> {
  const row: CaseRow = {
    case_id: input.case_id ?? `CASE-${randomUUID()}`,
    title: input.title,
    summary: input.summary,
    workspace_key: input.workspace_key,
    workspace_label: input.workspace_label,
    vessel_project: input.vessel_project,
    owner: input.owner,
    status: input.status,
    priority: input.priority,
    category: input.category,
    opened_at: input.opened_at,
    age_label: input.age_label,
    due_label: input.due_label,
    waiting_on: input.waiting_on,
    next_action: input.next_action,
    risk_note: input.risk_note,
    decision_required: input.decision_required,
    tags: input.tags ?? [],
    source_intake_ref: input.source_intake_ref ?? null,
    workspace_href: input.workspace_href,
    linked_thread_ids: input.linked_thread_ids ?? [],
    linked_evidence_ids: input.linked_evidence_ids ?? [],
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.cases, "case_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("cases").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.cases, "case_id", row);
    return { row, persisted: false };
  }

  return { row: data as CaseRow, persisted: true };
}

export async function listEvidence(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.evidence_items.filter((item) => item.case_id === caseId)
    : fallbackStore.evidence_items;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("evidence_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as EvidenceRow[];
}

export async function getEvidenceById(evidenceId: string) {
  const fallback = fallbackStore.evidence_items.find((item) => item.evidence_id === evidenceId) ?? null;

  if (!isPersistenceAvailable()) {
    return fallback ? clone(fallback) : null;
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("evidence_items")
    .select("*")
    .eq("evidence_id", evidenceId)
    .maybeSingle();

  if (error || !data) {
    return fallback ? clone(fallback) : null;
  }

  return data as EvidenceRow;
}

export async function saveEvidence(input: EvidenceInput): Promise<WriteResult<EvidenceRow>> {
  const parseStatus =
    input.parse_status ??
    deriveInitialEvidenceParseStatus({
      sourceType: input.source_type ?? input.type,
      originalFilename: input.original_filename ?? null,
      mimeType: input.mime_type ?? null,
      type: input.type,
    });

  const row: EvidenceRow = {
    evidence_id: input.evidence_id ?? `evidence-${randomUUID()}`,
    case_id: input.case_id ?? null,
    title: input.title,
    type: input.type,
    source: input.source,
    date: input.date,
    description: input.description,
    status: input.status,
    storage_state: input.storage_state ?? "metadata-only",
    source_type: input.source_type ?? input.type,
    workspace_assignment: input.workspace_assignment ?? "Import/Staging",
    linked_intake_item_ref: input.linked_intake_item_ref ?? null,
    linked_case_ref: input.linked_case_ref ?? null,
    original_filename: input.original_filename ?? null,
    file_size_bytes: input.file_size_bytes ?? null,
    storage_bucket: input.storage_bucket ?? null,
    storage_path: input.storage_path ?? null,
    mime_type: input.mime_type ?? null,
    uploaded_at: input.uploaded_at ?? null,
    parse_status: parseStatus,
    parse_error: input.parse_error ?? null,
    parsed_thread_id: input.parsed_thread_id ?? null,
    parsed_message_id: input.parsed_message_id ?? null,
    parsed_at: input.parsed_at ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.evidence_items, "evidence_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("evidence_items").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.evidence_items, "evidence_id", row);
    return { row, persisted: false };
  }

  return { row: data as EvidenceRow, persisted: true };
}

export async function listCorrespondenceThreads(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.correspondence_threads.filter((item) => item.case_id === caseId)
    : fallbackStore.correspondence_threads;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("correspondence_threads")
    .select("*")
    .order("date_time", { ascending: false });

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as CorrespondenceThreadRow[];
}

export async function getCaseById(caseId: string) {
  const fallback = fallbackStore.cases.find((item) => item.case_id === caseId) ?? null;

  if (!isPersistenceAvailable()) {
    return fallback ? clone(fallback) : null;
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("cases")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  if (error || !data) {
    return fallback ? clone(fallback) : null;
  }

  return data as CaseRow;
}

export async function saveCorrespondenceThread(input: CorrespondenceThreadInput) {
  const row: CorrespondenceThreadRow = {
    thread_id: input.thread_id ?? `thread-${randomUUID()}`,
    workspace_key: input.workspace_key,
    case_id: input.case_id ?? null,
    subject: input.subject,
    sender: input.sender,
    recipients: input.recipients,
    cc: input.cc,
    date_time: input.date_time,
    status: input.status,
    vessel_project: input.vessel_project,
    source_intake_item_id: input.source_intake_item_id ?? null,
    linked_case_id: input.linked_case_id ?? input.case_id ?? null,
    source_evidence_id: input.source_evidence_id ?? null,
    parse_status: input.parse_status ?? "not parsed",
    parse_error: input.parse_error ?? null,
    original_filename: input.original_filename ?? null,
    message_id_header: input.message_id_header ?? null,
    in_reply_to: input.in_reply_to ?? null,
    references: input.references ?? [],
    bcc: input.bcc ?? [],
    body_text: input.body_text ?? null,
    body_html_text: input.body_html_text ?? null,
    attachment_metadata: input.attachment_metadata ?? [],
    parsed_at: input.parsed_at ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.correspondence_threads, "thread_id", row);
    return row;
  }

  const client = getRepoClient();
  const { data, error } = await client.from("correspondence_threads").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.correspondence_threads, "thread_id", row);
    return row;
  }

  return data as CorrespondenceThreadRow;
}

export async function listCorrespondenceMessages(threadId?: string) {
  const fallback = threadId
    ? fallbackStore.correspondence_messages.filter((item) => item.thread_id === threadId)
    : fallbackStore.correspondence_messages;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("correspondence_messages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (threadId) {
    query = query.eq("thread_id", threadId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as CorrespondenceMessageRow[];
}

export async function saveCorrespondenceMessage(input: CorrespondenceMessageInput) {
  const row: CorrespondenceMessageRow = {
    message_id: input.message_id ?? `message-${randomUUID()}`,
    thread_id: input.thread_id,
    sender: input.sender,
    body: input.body,
    timestamp: input.timestamp,
    sort_order: input.sort_order,
    recipients: input.recipients ?? [],
    cc_recipients: input.cc_recipients ?? [],
    bcc_recipients: input.bcc_recipients ?? [],
    subject: input.subject ?? "",
    message_id_header: input.message_id_header ?? null,
    in_reply_to: input.in_reply_to ?? null,
    references: input.references ?? [],
    body_text: input.body_text ?? input.body,
    body_html_text: input.body_html_text ?? null,
    attachment_metadata: input.attachment_metadata ?? [],
    source_evidence_id: input.source_evidence_id ?? null,
    parsed_at: input.parsed_at ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.correspondence_messages, "message_id", row);
    return row;
  }

  const client = getRepoClient();
  const { data, error } = await client.from("correspondence_messages").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.correspondence_messages, "message_id", row);
    return row;
  }

  return data as CorrespondenceMessageRow;
}

export async function linkEvidenceToCase(caseId: string, evidenceId: string, linkRole = "primary") {
  const row: CaseEvidenceLinkRow = {
    link_id: `link-${randomUUID()}`,
    case_id: caseId,
    evidence_id: evidenceId,
    link_role: linkRole,
    created_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    fallbackStore.case_evidence_links.unshift(row);
    return row;
  }

  const client = getRepoClient();
  const { data, error } = await client.from("case_evidence_links").insert(row).select().single();

  if (error || !data) {
    fallbackStore.case_evidence_links.unshift(row);
    return row;
  }

  return data as CaseEvidenceLinkRow;
}

export async function listCaseEvidenceLinks(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.case_evidence_links.filter((item) => item.case_id === caseId)
    : fallbackStore.case_evidence_links;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client.from("case_evidence_links").select("*");

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as CaseEvidenceLinkRow[];
}

export async function linkCorrespondenceToCase(caseId: string, threadId: string) {
  const row: CaseCorrespondenceLinkRow = {
    link_id: `link-${randomUUID()}`,
    case_id: caseId,
    thread_id: threadId,
    created_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    fallbackStore.case_correspondence_links.unshift(row);
    return row;
  }

  const client = getRepoClient();
  const { data, error } = await client.from("case_correspondence_links").insert(row).select().single();

  if (error || !data) {
    fallbackStore.case_correspondence_links.unshift(row);
    return row;
  }

  return data as CaseCorrespondenceLinkRow;
}

export async function listCaseCorrespondenceLinks(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.case_correspondence_links.filter((item) => item.case_id === caseId)
    : fallbackStore.case_correspondence_links;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client.from("case_correspondence_links").select("*");

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as CaseCorrespondenceLinkRow[];
}

export async function listTimelineEvents(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.timeline_events.filter((item) => item.case_id === caseId)
    : fallbackStore.timeline_events;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("timeline_events")
    .select("*")
    .order("happened_at", { ascending: true });

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as TimelineEventRow[];
}

export async function saveTimelineEvent(input: TimelineEventInput): Promise<WriteResult<TimelineEventRow>> {
  const row: TimelineEventRow = {
    event_id: input.event_id ?? `event-${randomUUID()}`,
    case_id: input.case_id,
    event_type: input.event_type,
    title: input.title,
    note: input.note,
    happened_at: input.happened_at,
    tone: input.tone,
    source_ref: input.source_ref ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.timeline_events, "event_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("timeline_events").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.timeline_events, "event_id", row);
    return { row, persisted: false };
  }

  return { row: data as TimelineEventRow, persisted: true };
}

export async function listDecisions(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.decisions.filter((item) => item.case_id === caseId)
    : fallbackStore.decisions;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client.from("decisions").select("*");

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as DecisionRow[];
}

export async function listDraftResponses(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.draft_responses_placeholder.filter((item) => item.case_id === caseId)
    : fallbackStore.draft_responses_placeholder;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client.from("draft_responses_placeholder").select("*");

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as DraftResponsePlaceholderRow[];
}

export async function saveDraftResponse(
  input: DraftResponseInput,
): Promise<WriteResult<DraftResponsePlaceholderRow>> {
  const row: DraftResponsePlaceholderRow = {
    draft_id: input.draft_id ?? `draft-${randomUUID()}`,
    case_id: input.case_id ?? null,
    source_type: input.source_type,
    source_ids: input.source_ids,
    source_label: input.source_label,
    source_snapshot: input.source_snapshot,
    triage_audit_log_id: input.triage_audit_log_id ?? null,
    triage_source_type: input.triage_source_type ?? null,
    triage_source_ids: input.triage_source_ids ?? [],
    intended_recipient_placeholder: input.intended_recipient_placeholder,
    subject_placeholder: input.subject_placeholder,
    draft_body: input.draft_body,
    draft_purpose: input.draft_purpose,
    tone_mode: input.tone_mode,
    evidence_basis: input.evidence_basis,
    assumptions: input.assumptions ?? [],
    missing_information: input.missing_information ?? [],
    liability_cautions: input.liability_cautions ?? [],
    recommended_attachments: input.recommended_attachments ?? [],
    status: input.status,
    confidence: input.confidence,
    must_be_red_teamed: input.must_be_red_teamed ?? true,
    persistence_state: input.persistence_state ?? "persisted",
    created_at: input.created_at ?? nowIso(),
    updated_at: input.updated_at ?? nowIso(),
  };

  if (!isPersistenceAvailable()) {
    row.persistence_state = "session-only";
    upsertById(fallbackStore.draft_responses_placeholder, "draft_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("draft_responses_placeholder").upsert(row).select().single();

  if (error || !data) {
    row.persistence_state = "session-only";
    upsertById(fallbackStore.draft_responses_placeholder, "draft_id", row);
    return { row, persisted: false };
  }

  return { row: data as DraftResponsePlaceholderRow, persisted: true };
}

export async function appendAuditLog(
  entry: Omit<AuditLogRow, "audit_id" | "created_at">,
): Promise<WriteResult<AuditLogRow>> {
  const row: AuditLogRow = {
    audit_id: `audit-${randomUUID()}`,
    created_at: nowIso(),
    ...entry,
  };

  if (!isPersistenceAvailable()) {
    fallbackStore.audit_logs.unshift(row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("audit_logs").insert(row).select().single();

  if (error || !data) {
    fallbackStore.audit_logs.unshift(row);
    return { row, persisted: false };
  }

  return { row: data as AuditLogRow, persisted: true };
}

export function getMockWorkspaceSnapshots(): {
  workspaces: WorkspaceRow[];
  importBatches: ImportBatchRow[];
  intakeItems: IntakeItemRow[];
  cases: CaseRow[];
  evidenceItems: EvidenceRow[];
  correspondenceThreads: CorrespondenceThreadRow[];
  correspondenceMessages: CorrespondenceMessageRow[];
  timelineEvents: TimelineEventRow[];
} {
  return {
    workspaces: clone(fallbackStore.workspaces),
    importBatches: clone(fallbackStore.import_batches),
    intakeItems: clone(fallbackStore.intake_items),
    cases: clone(fallbackStore.cases),
    evidenceItems: clone(fallbackStore.evidence_items),
    correspondenceThreads: clone(fallbackStore.correspondence_threads),
    correspondenceMessages: clone(fallbackStore.correspondence_messages),
    timelineEvents: clone(fallbackStore.timeline_events),
  };
}

export function resolveLinkedCaseId(threadRef: string) {
  return resolveCaseIdFromThreadRef(threadRef);
}

