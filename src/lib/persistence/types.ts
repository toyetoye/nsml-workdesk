import type { WritingStyleProfileSnapshot } from "@/lib/writing-style/profile";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export type WorkspaceRow = {
  slug: string;
  name: string;
  kind: "vessel" | "project" | "general" | "staging";
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ImportBatchRow = {
  batch_id: string;
  source_type: string;
  source_label: string;
  received_at: string;
  workspace_key: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type IntakeItemRow = {
  intake_id: string;
  batch_id: string | null;
  subject_title: string;
  source_type: string;
  workspace_assignment: string;
  status: string;
  sender_source: string;
  received_at: string;
  body_content: string;
  tags: string[];
  route_note: string | null;
  created_from_label: string | null;
  linked_case_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseRow = {
  case_id: string;
  title: string;
  summary: string;
  workspace_key: string;
  workspace_label: string;
  vessel_project: string;
  owner: string;
  status: string;
  priority: string;
  category: string;
  opened_at: string;
  age_label: string;
  due_label: string;
  waiting_on: string;
  next_action: string;
  risk_note: string;
  decision_required: string;
  tags: string[];
  source_intake_ref: string | null;
  workspace_href: string;
  linked_thread_ids: string[];
  linked_evidence_ids: string[];
  created_at: string;
  updated_at: string;
};

export type EvidenceRow = {
  evidence_id: string;
  case_id: string | null;
  title: string;
  type: string;
  source: string;
  date: string;
  description: string;
  status: string;
  storage_state: string;
  source_type: string;
  workspace_assignment: string;
  linked_intake_item_ref: string | null;
  linked_case_ref: string | null;
  original_filename: string | null;
  file_size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  uploaded_at: string | null;
  parse_status: string;
  parse_error: string | null;
  parsed_thread_id: string | null;
  parsed_message_id: string | null;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrespondenceThreadRow = {
  thread_id: string;
  workspace_key: string;
  case_id: string | null;
  subject: string;
  sender: string;
  recipients: string[];
  cc: string[];
  date_time: string;
  status: string;
  vessel_project: string;
  source_intake_item_id: string | null;
  linked_case_id: string | null;
  source_evidence_id: string | null;
  parse_status: string;
  parse_error: string | null;
  original_filename: string | null;
  message_id_header: string | null;
  in_reply_to: string | null;
  references: string[];
  bcc: string[];
  body_text: string | null;
  body_html_text: string | null;
  attachment_metadata: Json;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrespondenceMessageRow = {
  message_id: string;
  thread_id: string;
  sender: string;
  body: string;
  timestamp: string;
  sort_order: number;
  recipients: string[];
  cc_recipients: string[];
  bcc_recipients: string[];
  subject: string;
  message_id_header: string | null;
  in_reply_to: string | null;
  references: string[];
  body_text: string;
  body_html_text: string | null;
  attachment_metadata: Json;
  source_evidence_id: string | null;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseEvidenceLinkRow = {
  link_id: string;
  case_id: string;
  evidence_id: string;
  link_role: string;
  created_at: string;
};

export type CaseCorrespondenceLinkRow = {
  link_id: string;
  case_id: string;
  thread_id: string;
  created_at: string;
};

export type TimelineEventRow = {
  event_id: string;
  case_id: string;
  event_type: string;
  title: string;
  note: string;
  happened_at: string;
  tone: string;
  source_ref: string | null;
  created_at: string;
  updated_at: string;
};

export type DecisionRow = {
  decision_id: string;
  case_id: string;
  title: string;
  status: string;
  note: string;
  decision_required: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DraftResponsePlaceholderRow = {
  draft_id: string;
  case_id: string | null;
  source_type: string;
  source_ids: string[];
  source_label: string;
  source_snapshot: Json;
  triage_audit_log_id: string | null;
  triage_source_type: string | null;
  triage_source_ids: string[];
  intended_recipient_placeholder: string;
  subject_placeholder: string;
  draft_body: string;
  draft_purpose: string;
  tone_mode: string;
  evidence_basis: string;
  assumptions: string[];
  missing_information: string[];
  liability_cautions: string[];
  recommended_attachments: string[];
  status: string;
  confidence: number;
  must_be_red_teamed: boolean;
  persistence_state: string;
  created_at: string;
  updated_at: string;
};

export type DraftRedTeamReviewRow = {
  review_id: string;
  draft_id: string;
  source_type: string;
  source_label: string;
  source_ids_reviewed: string[];
  source_snapshot: Json;
  verdict: string;
  readiness_status: string;
  summary: string;
  unsupported_claims: string[];
  liability_risks: string[];
  technical_risks: string[];
  tone_risks: string[];
  missing_information: string[];
  evidence_gaps: string[];
  confidentiality_concerns: string[];
  recommended_revisions: string[];
  required_user_checks: string[];
  safe_to_copy: boolean;
  confidence: number;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
};

export type WritingStyleProfileRow = WritingStyleProfileSnapshot & {
  persistence_state: string;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  audit_id: string;
  actor: string | null;
  action: string;
  object_type: string;
  object_id: string;
  details: Json | null;
  created_at: string;
};

export type IntakeItemInput = Partial<IntakeItemRow> & {
  subject_title: string;
  source_type: string;
  workspace_assignment: string;
  status: string;
  sender_source: string;
  received_at: string;
  body_content: string;
  tags?: string[];
};

export type CaseInput = Partial<CaseRow> & {
  case_id?: string;
  title: string;
  summary: string;
  workspace_key: string;
  workspace_label: string;
  vessel_project: string;
  owner: string;
  status: string;
  priority: string;
  category: string;
  opened_at: string;
  age_label: string;
  due_label: string;
  waiting_on: string;
  next_action: string;
  risk_note: string;
  decision_required: string;
  tags?: string[];
  workspace_href: string;
};

export type EvidenceInput = Partial<EvidenceRow> & {
  evidence_id?: string;
  case_id?: string | null;
  title: string;
  type: string;
  source: string;
  date: string;
  description: string;
  status: string;
  storage_state?: string;
  source_type?: string;
  workspace_assignment?: string;
  linked_intake_item_ref?: string | null;
  linked_case_ref?: string | null;
  original_filename?: string | null;
  file_size_bytes?: number | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  uploaded_at?: string | null;
  parse_status?: string;
  parse_error?: string | null;
  parsed_thread_id?: string | null;
  parsed_message_id?: string | null;
  parsed_at?: string | null;
};

export type DraftResponseInput = Partial<DraftResponsePlaceholderRow> & {
  draft_id?: string;
  case_id?: string | null;
  source_type: string;
  source_ids: string[];
  source_label: string;
  source_snapshot: Json;
  triage_audit_log_id?: string | null;
  triage_source_type?: string | null;
  triage_source_ids?: string[];
  intended_recipient_placeholder: string;
  subject_placeholder: string;
  draft_body: string;
  draft_purpose: string;
  tone_mode: string;
  evidence_basis: string;
  assumptions?: string[];
  missing_information?: string[];
  liability_cautions?: string[];
  recommended_attachments?: string[];
  status: string;
  confidence: number;
  must_be_red_teamed?: boolean;
  persistence_state?: string;
};

export type DraftRedTeamReviewInput = Partial<DraftRedTeamReviewRow> & {
  review_id?: string;
  draft_id: string;
  source_type: string;
  source_label: string;
  source_ids_reviewed: string[];
  source_snapshot: Json;
  verdict: string;
  readiness_status: string;
  summary: string;
  unsupported_claims?: string[];
  liability_risks?: string[];
  technical_risks?: string[];
  tone_risks?: string[];
  missing_information?: string[];
  evidence_gaps?: string[];
  confidentiality_concerns?: string[];
  recommended_revisions?: string[];
  required_user_checks?: string[];
  safe_to_copy: boolean;
  confidence: number;
  reviewed_at: string;
};

export type WritingStyleProfileInput = Partial<WritingStyleProfileRow> &
  WritingStyleProfileSnapshot & {
    persistence_state?: string;
  };

export type CorrespondenceThreadInput = Partial<CorrespondenceThreadRow> & {
  thread_id?: string;
  workspace_key: string;
  case_id?: string | null;
  subject: string;
  sender: string;
  recipients: string[];
  cc: string[];
  date_time: string;
  status: string;
  vessel_project: string;
  source_evidence_id?: string | null;
  parse_status?: string;
  parse_error?: string | null;
  original_filename?: string | null;
  message_id_header?: string | null;
  in_reply_to?: string | null;
  references?: string[];
  bcc?: string[];
  body_text?: string | null;
  body_html_text?: string | null;
  attachment_metadata?: Json;
  parsed_at?: string | null;
};

export type CorrespondenceMessageInput = Partial<CorrespondenceMessageRow> & {
  message_id?: string;
  thread_id: string;
  sender: string;
  body: string;
  timestamp: string;
  sort_order: number;
  recipients?: string[];
  cc_recipients?: string[];
  bcc_recipients?: string[];
  subject?: string;
  message_id_header?: string | null;
  in_reply_to?: string | null;
  references?: string[];
  body_text?: string;
  body_html_text?: string | null;
  attachment_metadata?: Json;
  source_evidence_id?: string | null;
  parsed_at?: string | null;
};

export type TimelineEventInput = Partial<TimelineEventRow> & {
  event_id?: string;
  case_id: string;
  event_type: string;
  title: string;
  note: string;
  happened_at: string;
  tone: string;
};

export type ImportBatchInput = Partial<ImportBatchRow> & {
  batch_id?: string;
  source_type: string;
  source_label: string;
  received_at: string;
  workspace_key?: string | null;
  status: string;
};

export interface Database {
  public: {
    Tables: {
      workspaces: Table<WorkspaceRow>;
      import_batches: Table<ImportBatchRow>;
      intake_items: Table<IntakeItemRow>;
      cases: Table<CaseRow>;
      evidence_items: Table<EvidenceRow>;
      correspondence_threads: Table<CorrespondenceThreadRow>;
      correspondence_messages: Table<CorrespondenceMessageRow>;
      case_evidence_links: Table<CaseEvidenceLinkRow>;
      case_correspondence_links: Table<CaseCorrespondenceLinkRow>;
      timeline_events: Table<TimelineEventRow>;
      decisions: Table<DecisionRow>;
      draft_responses_placeholder: Table<DraftResponsePlaceholderRow>;
      draft_red_team_reviews: Table<DraftRedTeamReviewRow>;
      writing_style_profiles: Table<WritingStyleProfileRow>;
      audit_logs: Table<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
