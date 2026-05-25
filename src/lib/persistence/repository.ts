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
import {
  assuranceSignalSeedRows,
  vesselEngagementLogSeedRows,
  vesselSupportItemSeedRows,
} from "@/lib/assurance/mock-data";
import type {
  IMSIndexRunInput,
  IMSIndexRunRow,
  IMSReferenceChunkInput,
  IMSReferenceChunkRow,
  IMSReferenceDocumentInput,
  IMSReferenceDocumentRow,
} from "@/lib/ims/types";
import { deriveInitialEvidenceParseStatus } from "@/lib/email-ingestion/shared";
import type {
  BulkEvidenceBatchInput,
  BulkEvidenceBatchItemInput,
  BulkEvidenceBatchItemRow,
  BulkEvidenceBatchRow,
} from "@/lib/persistence/types";
import {
  defaultWritingStyleProfile,
  normalizeWritingStyleProfile,
} from "@/lib/writing-style/profile";
import { createPersistenceClient, isPersistenceAvailable } from "./client";
import type {
  AuditLogRow,
  AssuranceSignalInput,
  AssuranceSignalRow,
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
  DraftRedTeamReviewInput,
  DraftRedTeamReviewRow,
  EvidenceInput,
  EvidenceRow,
  ImportBatchInput,
  ImportBatchRow,
  IntakeItemInput,
  IntakeItemRow,
  TimelineEventInput,
  TimelineEventRow,
  WritingStyleProfileInput,
  WritingStyleProfileRow,
  VesselEngagementLogInput,
  VesselEngagementLogRow,
  VesselSupportItemInput,
  VesselSupportItemRow,
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
  draft_red_team_reviews: DraftRedTeamReviewRow[];
  writing_style_profiles: WritingStyleProfileRow[];
  audit_logs: AuditLogRow[];
  assurance_signals: AssuranceSignalRow[];
  vessel_support_items: VesselSupportItemRow[];
  vessel_engagement_logs: VesselEngagementLogRow[];
  bulk_evidence_batches: BulkEvidenceBatchRow[];
  bulk_evidence_batch_items: BulkEvidenceBatchItemRow[];
  ims_reference_documents: IMSReferenceDocumentRow[];
  ims_reference_chunks: IMSReferenceChunkRow[];
  ims_index_runs: IMSIndexRunRow[];
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
    draft_red_team_reviews: [],
    writing_style_profiles: [
      {
        ...defaultWritingStyleProfile(),
        persistence_state: "session-only",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
    ],
    audit_logs: [],
    bulk_evidence_batches: [],
    bulk_evidence_batch_items: [],
    ims_reference_documents: [],
    ims_reference_chunks: [],
    ims_index_runs: [],
    assurance_signals: assuranceSignalSeedRows.map((item) => ({ ...item })),
    vessel_support_items: vesselSupportItemSeedRows.map((item) => ({ ...item })),
    vessel_engagement_logs: vesselEngagementLogSeedRows.map((item) => ({ ...item })),
  };
}

const fallbackStore = createFallbackStore();

function getRepoClient() {
  return createPersistenceClient() as unknown as RepoClient;
}

function upsertByDraftId<Row extends Record<string, unknown>>(
  rows: Row[],
  draftIdKey: keyof Row,
  row: Row,
) {
  const index = rows.findIndex((item) => item[draftIdKey] === row[draftIdKey]);

  if (index >= 0) {
    rows[index] = row;
    return;
  }

  rows.unshift(row);
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

function normalizeList(values?: string[] | null) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function toIsoDate(display: string | null | undefined) {
  if (!display) {
    return null;
  }

  const parsed = new Date(display);

  if (Number.isNaN(parsed.getTime())) {
    return display.slice(0, 10) || null;
  }

  return parsed.toISOString().slice(0, 10);
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

export async function listBulkEvidenceBatches() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.bulk_evidence_batches);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("bulk_evidence_batches")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.bulk_evidence_batches);
  }

  return data as BulkEvidenceBatchRow[];
}

export async function saveBulkEvidenceBatch(
  input: BulkEvidenceBatchInput,
): Promise<WriteResult<BulkEvidenceBatchRow>> {
  const row: BulkEvidenceBatchRow = {
    batch_id: input.batch_id ?? `bulk-batch-${randomUUID()}`,
    batch_mode: input.batch_mode,
    workspace_assignment: input.workspace_assignment,
    source_label: input.source_label,
    status: input.status,
    total_files: input.total_files ?? 0,
    eml_files_found: input.eml_files_found ?? 0,
    parsed_successfully: input.parsed_successfully ?? 0,
    skipped: input.skipped ?? 0,
    failed: input.failed ?? 0,
    unsupported: input.unsupported ?? 0,
    warnings: input.warnings ?? 0,
    notes: input.notes ?? "",
    linked_case_id: input.linked_case_id ?? null,
    linked_assurance_signal_id: input.linked_assurance_signal_id ?? null,
    linked_support_item_id: input.linked_support_item_id ?? null,
    original_archive_evidence_id: input.original_archive_evidence_id ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.bulk_evidence_batches, "batch_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("bulk_evidence_batches")
    .upsert(row)
    .select()
    .single();

  if (error || !data) {
    upsertById(fallbackStore.bulk_evidence_batches, "batch_id", row);
    return { row, persisted: false };
  }

  return { row: data as BulkEvidenceBatchRow, persisted: true };
}

export async function listBulkEvidenceBatchItems(batchId?: string) {
  const fallback = batchId
    ? fallbackStore.bulk_evidence_batch_items.filter((item) => item.batch_id === batchId)
    : fallbackStore.bulk_evidence_batch_items;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("bulk_evidence_batch_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as BulkEvidenceBatchItemRow[];
}

export async function saveBulkEvidenceBatchItem(
  input: BulkEvidenceBatchItemInput,
): Promise<WriteResult<BulkEvidenceBatchItemRow>> {
  const row: BulkEvidenceBatchItemRow = {
    batch_item_id: input.batch_item_id ?? `bulk-batch-item-${randomUUID()}`,
    batch_id: input.batch_id,
    source_kind: input.source_kind,
    file_name: input.file_name,
    source_path_in_archive: input.source_path_in_archive ?? null,
    file_size_bytes: input.file_size_bytes ?? null,
    status: input.status,
    note: input.note ?? "",
    evidence_id: input.evidence_id ?? null,
    thread_id: input.thread_id ?? null,
    message_id: input.message_id ?? null,
    parse_status: input.parse_status ?? null,
    parse_error: input.parse_error ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.bulk_evidence_batch_items, "batch_item_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("bulk_evidence_batch_items")
    .upsert(row)
    .select()
    .single();

  if (error || !data) {
    upsertById(fallbackStore.bulk_evidence_batch_items, "batch_item_id", row);
    return { row, persisted: false };
  }

  return { row: data as BulkEvidenceBatchItemRow, persisted: true };
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

export async function listAssuranceSignals(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.assurance_signals.filter((item) => item.linked_case_id === caseId)
    : fallbackStore.assurance_signals;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("assurance_signals")
    .select("*")
    .order("date_time", { ascending: false });

  if (caseId) {
    query = query.eq("linked_case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as AssuranceSignalRow[];
}

export async function saveAssuranceSignal(
  input: AssuranceSignalInput,
): Promise<WriteResult<AssuranceSignalRow>> {
  const evidenceLinks = normalizeList(input.evidence_links);

  const row: AssuranceSignalRow = {
    assurance_signal_id: input.assurance_signal_id ?? `assurance-signal-${randomUUID()}`,
    date_time: toIsoDateTime(input.date_time ?? nowIso()),
    signal_title: input.signal_title ?? "Untitled assurance signal",
    signal_type: input.signal_type ?? "Governance signal",
    source_type: input.source_type ?? "Other",
    source_name_optional: input.source_name_optional ?? null,
    audience: input.audience ?? "Management",
    related_vessel_optional: input.related_vessel_optional ?? null,
    related_department: input.related_department ?? "Operations",
    summary: input.summary ?? "",
    exact_comment_optional: input.exact_comment_optional ?? null,
    evidence_level: input.evidence_level ?? "Reported",
    confidence: input.confidence ?? "Medium",
    operational_risk: input.operational_risk ?? "",
    reputational_risk: input.reputational_risk ?? "",
    governance_risk: input.governance_risk ?? "",
    required_action: input.required_action ?? "",
    action_owner: input.action_owner ?? "",
    due_date: toIsoDate(input.due_date),
    status: input.status ?? "Open",
    evidence_links: evidenceLinks,
    notes: input.notes ?? "",
    linked_case_id: input.linked_case_id ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.assurance_signals, "assurance_signal_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("assurance_signals").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.assurance_signals, "assurance_signal_id", row);
    return { row, persisted: false };
  }

  return { row: data as AssuranceSignalRow, persisted: true };
}

export async function listVesselSupportItems(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.vessel_support_items.filter((item) => item.linked_case_id === caseId)
    : fallbackStore.vessel_support_items;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("vessel_support_items")
    .select("*")
    .order("date_raised", { ascending: false });

  if (caseId) {
    query = query.eq("linked_case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as VesselSupportItemRow[];
}

export async function saveVesselSupportItem(
  input: VesselSupportItemInput,
): Promise<WriteResult<VesselSupportItemRow>> {
  const row: VesselSupportItemRow = {
    support_item_id: input.support_item_id ?? `support-item-${randomUUID()}`,
    vessel: input.vessel ?? "Unassigned vessel",
    issue_title: input.issue_title ?? "Untitled support item",
    issue_description: input.issue_description ?? "",
    date_raised: toIsoDate(input.date_raised ?? nowIso()) ?? toIsoDate(nowIso()) ?? "2026-01-01",
    raised_by: input.raised_by ?? "Unknown",
    category: input.category ?? "Technical",
    priority: input.priority ?? "Medium",
    risk_level: input.risk_level ?? "Medium",
    superintendent_owner: input.superintendent_owner ?? "Unassigned",
    vessel_owner: input.vessel_owner ?? "Unassigned",
    office_support_required: input.office_support_required ?? "",
    current_status: input.current_status ?? "Open",
    blocker_type: input.blocker_type ?? "None",
    last_action_taken: input.last_action_taken ?? "",
    last_contact_date: toIsoDate(input.last_contact_date ?? null),
    next_action: input.next_action ?? "",
    due_date: toIsoDate(input.due_date ?? null),
    close_out_evidence: input.close_out_evidence ?? "",
    status: input.status ?? "Tracking",
    evidence_links: normalizeList(input.evidence_links),
    linked_case_id: input.linked_case_id ?? null,
    source_signal_id: input.source_signal_id ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.vessel_support_items, "support_item_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("vessel_support_items").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.vessel_support_items, "support_item_id", row);
    return { row, persisted: false };
  }

  return { row: data as VesselSupportItemRow, persisted: true };
}

export async function listVesselEngagementLogs(caseId?: string) {
  const fallback = caseId
    ? fallbackStore.vessel_engagement_logs.filter((item) => item.linked_case_id === caseId)
    : fallbackStore.vessel_engagement_logs;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("vessel_engagement_logs")
    .select("*")
    .order("date_time", { ascending: false });

  if (caseId) {
    query = query.eq("linked_case_id", caseId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as VesselEngagementLogRow[];
}

export async function saveVesselEngagementLog(
  input: VesselEngagementLogInput,
): Promise<WriteResult<VesselEngagementLogRow>> {
  const row: VesselEngagementLogRow = {
    engagement_log_id: input.engagement_log_id ?? `engagement-log-${randomUUID()}`,
    vessel: input.vessel ?? "Unassigned vessel",
    date_time: toIsoDateTime(input.date_time ?? nowIso()),
    engagement_type: input.engagement_type ?? "Call",
    attendees: normalizeList(input.attendees),
    topics_discussed: normalizeList(input.topics_discussed),
    actions_agreed: normalizeList(input.actions_agreed),
    owner: input.owner ?? "Unassigned",
    due_date: toIsoDate(input.due_date ?? null),
    follow_up_required: input.follow_up_required ?? false,
    evidence_link: input.evidence_link ?? "",
    linked_case_id: input.linked_case_id ?? null,
    linked_signal_id: input.linked_signal_id ?? null,
    linked_support_item_id: input.linked_support_item_id ?? null,
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.vessel_engagement_logs, "engagement_log_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("vessel_engagement_logs").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.vessel_engagement_logs, "engagement_log_id", row);
    return { row, persisted: false };
  }

  return { row: data as VesselEngagementLogRow, persisted: true };
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

export async function getDraftResponseById(draftId: string) {
  const fallback = fallbackStore.draft_responses_placeholder.find((item) => item.draft_id === draftId) ?? null;

  if (!isPersistenceAvailable()) {
    return fallback ? clone(fallback) : null;
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("draft_responses_placeholder")
    .select("*")
    .eq("draft_id", draftId)
    .maybeSingle();

  if (error || !data) {
    return fallback ? clone(fallback) : null;
  }

  return data as DraftResponsePlaceholderRow;
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

export async function listDraftRedTeamReviews(draftId?: string) {
  const fallback = draftId
    ? fallbackStore.draft_red_team_reviews.filter((item) => item.draft_id === draftId)
    : fallbackStore.draft_red_team_reviews;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("draft_red_team_reviews")
    .select("*")
    .order("reviewed_at", { ascending: false });

  if (draftId) {
    query = query.eq("draft_id", draftId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as DraftRedTeamReviewRow[];
}

export async function saveDraftRedTeamReview(
  input: DraftRedTeamReviewInput,
): Promise<WriteResult<DraftRedTeamReviewRow>> {
  const row: DraftRedTeamReviewRow = {
    review_id: input.review_id ?? `review-${randomUUID()}`,
    draft_id: input.draft_id,
    source_type: input.source_type,
    source_label: input.source_label,
    source_ids_reviewed: input.source_ids_reviewed,
    source_snapshot: input.source_snapshot,
    verdict: input.verdict,
    readiness_status: input.readiness_status,
    summary: input.summary,
    unsupported_claims: input.unsupported_claims ?? [],
    liability_risks: input.liability_risks ?? [],
    technical_risks: input.technical_risks ?? [],
    tone_risks: input.tone_risks ?? [],
    missing_information: input.missing_information ?? [],
    evidence_gaps: input.evidence_gaps ?? [],
    confidentiality_concerns: input.confidentiality_concerns ?? [],
    recommended_revisions: input.recommended_revisions ?? [],
    required_user_checks: input.required_user_checks ?? [],
    safe_to_copy: input.safe_to_copy,
    confidence: input.confidence,
    reviewed_at: input.reviewed_at,
    created_at: input.created_at ?? nowIso(),
    updated_at: input.updated_at ?? nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertByDraftId(fallbackStore.draft_red_team_reviews, "draft_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("draft_red_team_reviews").upsert(row).select().single();

  if (error || !data) {
    upsertByDraftId(fallbackStore.draft_red_team_reviews, "draft_id", row);
    return { row, persisted: false };
  }

  const draftReviewMirror = {
    review_id: row.review_id,
    source_ids_reviewed: row.source_ids_reviewed,
    verdict: row.verdict,
    readiness_status: row.readiness_status,
    review_summary: row.summary,
    unsupported_claims: row.unsupported_claims,
    liability_risks: row.liability_risks,
    technical_risks: row.technical_risks,
    tone_risks: row.tone_risks,
    review_missing_information: row.missing_information,
    evidence_gaps: row.evidence_gaps,
    confidentiality_concerns: row.confidentiality_concerns,
    recommended_revisions: row.recommended_revisions,
    required_user_checks: row.required_user_checks,
    safe_to_copy: row.safe_to_copy,
    red_team_confidence: row.confidence,
    reviewed_at: row.reviewed_at,
    red_team_updated_at: nowIso(),
    updated_at: nowIso(),
  };

  const { error: draftMirrorError } = await client
    .from("draft_responses_placeholder")
    .update(draftReviewMirror)
    .eq("draft_id", row.draft_id);

  if (draftMirrorError) {
    const fallbackDraft = fallbackStore.draft_responses_placeholder.find(
      (item) => item.draft_id === row.draft_id,
    );

    if (fallbackDraft) {
      Object.assign(fallbackDraft, draftReviewMirror);
    }
  }

  return { row: data as DraftRedTeamReviewRow, persisted: true };
}

export async function listWritingStyleProfiles() {
  const fallback = fallbackStore.writing_style_profiles;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("writing_style_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return clone(fallback);
  }

  return data as WritingStyleProfileRow[];
}

export async function getActiveWritingStyleProfile() {
  const fallback =
    fallbackStore.writing_style_profiles.find((item) => item.is_active) ??
    fallbackStore.writing_style_profiles[0] ??
    {
      ...defaultWritingStyleProfile(),
      persistence_state: "session-only",
      created_at: nowIso(),
      updated_at: nowIso(),
    };

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("writing_style_profiles")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return clone(fallback);
  }

  return data[0] as WritingStyleProfileRow;
}

export async function saveWritingStyleProfile(
  input: WritingStyleProfileInput,
): Promise<WriteResult<WritingStyleProfileRow>> {
  const normalized = normalizeWritingStyleProfile(input);
  const row: WritingStyleProfileRow = {
    ...normalized,
    is_active: true,
    persistence_state: input.persistence_state ?? "persisted",
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    row.persistence_state = "session-only";
    upsertById(fallbackStore.writing_style_profiles, "profile_id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("writing_style_profiles").upsert(row).select().single();

  if (error || !data) {
    row.persistence_state = "session-only";
    upsertById(fallbackStore.writing_style_profiles, "profile_id", row);
    return { row, persisted: false };
  }

  return { row: data as WritingStyleProfileRow, persisted: true };
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

function normalizeIMSList(values?: string[] | null) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function normalizeIMSStatus(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function scoreIMSChunk(
  chunk: IMSReferenceChunkRow,
  title: string,
  queryTerms: string[],
) {
  const lowerTitle = title.toLowerCase();
  const lowerHeading = (chunk.heading_optional ?? "").toLowerCase();
  const lowerPath = chunk.source_path.toLowerCase();
  const lowerKeywords = chunk.keywords_optional.map((keyword) => keyword.toLowerCase());
  const lowerText = chunk.text.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (lowerTitle.includes(term)) {
      score += 10;
    }

    if (lowerHeading.includes(term)) {
      score += 8;
    }

    if (lowerPath.includes(term)) {
      score += 4;
    }

    if (lowerKeywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) {
      score += 6;
    }

    if (lowerText.includes(term)) {
      score += 2;
    }
  }

  return score;
}

export async function listIMSDocuments() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.ims_reference_documents);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("ims_reference_documents")
    .select("*")
    .order("indexed_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.ims_reference_documents);
  }

  return data as IMSReferenceDocumentRow[];
}

export async function saveIMSDocument(
  input: IMSReferenceDocumentInput,
): Promise<WriteResult<IMSReferenceDocumentRow>> {
  const row: IMSReferenceDocumentRow = {
    id: input.id ?? `ims-doc-${randomUUID()}`,
    title: input.title ?? "Untitled IMS document",
    source_path: input.source_path ?? "",
    source_type: input.source_type ?? "unknown",
    version_label: input.version_label ?? "",
    effective_date_optional: input.effective_date_optional ?? null,
    status: normalizeIMSStatus(input.status, "indexed") as IMSReferenceDocumentRow["status"],
    indexed_at: input.indexed_at ?? nowIso(),
    checksum_optional: input.checksum_optional ?? null,
    notes: input.notes ?? "",
    created_at: input.created_at ?? nowIso(),
    updated_at: nowIso(),
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.ims_reference_documents, "id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("ims_reference_documents").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.ims_reference_documents, "id", row);
    return { row, persisted: false };
  }

  return { row: data as IMSReferenceDocumentRow, persisted: true };
}

export async function listIMSChunks(documentId?: string) {
  const fallback = documentId
    ? fallbackStore.ims_reference_chunks.filter((item) => item.document_id === documentId)
    : fallbackStore.ims_reference_chunks;

  if (!isPersistenceAvailable()) {
    return clone(fallback);
  }

  const client = getRepoClient();
  let query = client
    .from("ims_reference_chunks")
    .select("*")
    .order("chunk_index", { ascending: true });

  if (documentId) {
    query = query.eq("document_id", documentId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return clone(fallback);
  }

  return data as IMSReferenceChunkRow[];
}

export async function saveIMSChunks(
  input: IMSReferenceChunkInput[],
): Promise<Array<WriteResult<IMSReferenceChunkRow>>> {
  const results: Array<WriteResult<IMSReferenceChunkRow>> = [];

  for (const item of input) {
    const row: IMSReferenceChunkRow = {
      id: item.id ?? `ims-chunk-${randomUUID()}`,
      document_id: item.document_id ?? "",
      source_path: item.source_path ?? "",
      heading_optional: item.heading_optional ?? null,
      chunk_index: item.chunk_index ?? 0,
      text: item.text ?? "",
      token_estimate: item.token_estimate ?? 0,
      keywords_optional: normalizeIMSList(item.keywords_optional),
      status: normalizeIMSStatus(item.status, "indexed") as IMSReferenceChunkRow["status"],
      created_at: item.created_at ?? nowIso(),
      updated_at: nowIso(),
    };

    if (!isPersistenceAvailable()) {
      upsertById(fallbackStore.ims_reference_chunks, "id", row);
      results.push({ row, persisted: false });
      continue;
    }

    const client = getRepoClient();
    const { data, error } = await client.from("ims_reference_chunks").upsert(row).select().single();

    if (error || !data) {
      upsertById(fallbackStore.ims_reference_chunks, "id", row);
      results.push({ row, persisted: false });
      continue;
    }

    results.push({ row: data as IMSReferenceChunkRow, persisted: true });
  }

  return results;
}

export async function searchIMSChunks(query: string, limit = 12) {
  const terms = normalizeIMSList(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3),
  );

  const [documents, chunks] = await Promise.all([listIMSDocuments(), listIMSChunks()]);
  const documentMap = new Map(documents.map((document) => [document.id, document] as const));

  const scored = chunks
    .map((chunk) => {
      const document = documentMap.get(chunk.document_id);

      if (!document || document.status !== "indexed") {
        return null;
      }

      if (terms.length === 0) {
        return {
          chunk,
          document,
          score: 0,
        };
      }

      const score = scoreIMSChunk(chunk, document.title, terms);

      if (score <= 0) {
        return null;
      }

      return {
        chunk,
        document,
        score,
      };
    })
    .filter((item): item is { chunk: IMSReferenceChunkRow; document: IMSReferenceDocumentRow; score: number } =>
      Boolean(item),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return scored.map(({ chunk, document, score }) => ({
    ...chunk,
    document_title: document.title,
    score,
  }));
}

export async function listIMSIndexRuns() {
  if (!isPersistenceAvailable()) {
    return clone(fallbackStore.ims_index_runs);
  }

  const client = getRepoClient();
  const { data, error } = await client
    .from("ims_index_runs")
    .select("*")
    .order("started_at", { ascending: false });

  if (error || !data) {
    return clone(fallbackStore.ims_index_runs);
  }

  return data as IMSIndexRunRow[];
}

export async function saveIMSIndexRun(
  input: IMSIndexRunInput,
): Promise<WriteResult<IMSIndexRunRow>> {
  const row: IMSIndexRunRow = {
    id: input.id ?? `ims-index-run-${randomUUID()}`,
    source_label: input.source_label ?? "IMS source",
    status: normalizeIMSStatus(input.status, "running") as IMSIndexRunRow["status"],
    total_files: input.total_files ?? 0,
    indexed_files: input.indexed_files ?? 0,
    skipped_files: input.skipped_files ?? 0,
    failed_files: input.failed_files ?? 0,
    warnings: normalizeIMSList(input.warnings),
    started_at: input.started_at ?? nowIso(),
    completed_at: input.completed_at ?? null,
  };

  if (!isPersistenceAvailable()) {
    upsertById(fallbackStore.ims_index_runs, "id", row);
    return { row, persisted: false };
  }

  const client = getRepoClient();
  const { data, error } = await client.from("ims_index_runs").upsert(row).select().single();

  if (error || !data) {
    upsertById(fallbackStore.ims_index_runs, "id", row);
    return { row, persisted: false };
  }

  return { row: data as IMSIndexRunRow, persisted: true };
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
  bulkEvidenceBatches: BulkEvidenceBatchRow[];
  bulkEvidenceBatchItems: BulkEvidenceBatchItemRow[];
  imsReferenceDocuments: IMSReferenceDocumentRow[];
  imsReferenceChunks: IMSReferenceChunkRow[];
  imsIndexRuns: IMSIndexRunRow[];
  assuranceSignals: AssuranceSignalRow[];
  vesselSupportItems: VesselSupportItemRow[];
  vesselEngagementLogs: VesselEngagementLogRow[];
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
    bulkEvidenceBatches: clone(fallbackStore.bulk_evidence_batches),
    bulkEvidenceBatchItems: clone(fallbackStore.bulk_evidence_batch_items),
    imsReferenceDocuments: clone(fallbackStore.ims_reference_documents),
    imsReferenceChunks: clone(fallbackStore.ims_reference_chunks),
    imsIndexRuns: clone(fallbackStore.ims_index_runs),
    assuranceSignals: clone(fallbackStore.assurance_signals),
    vesselSupportItems: clone(fallbackStore.vessel_support_items),
    vesselEngagementLogs: clone(fallbackStore.vessel_engagement_logs),
  };
}

export function resolveLinkedCaseId(threadRef: string) {
  return resolveCaseIdFromThreadRef(threadRef);
}

