export type AiProvider = "openai";

export type AiConfigStatus = {
  provider: AiProvider;
  model: string;
  enabled: boolean;
  message: string;
};

export type TriageSourceType = "intake_item" | "correspondence_thread" | "case";
export type DraftSourceType = TriageSourceType;

export type TriageUrgencyLevel = "low" | "medium" | "high" | "critical";

export type TriageEvidenceReference = {
  source_id: string;
  source_type: string;
  label: string;
  note: string;
};

export type StructuredTriageResult = {
  summary_1line: string;
  expanded_summary: string;
  suggested_workspace: string;
  suggested_case_title: string;
  suggested_status: string;
  urgency_level: TriageUrgencyLevel;
  priority_reason: string;
  waiting_on: string;
  required_next_action: string;
  risk_flags: string[];
  missing_information: string[];
  evidence_used: TriageEvidenceReference[];
  confidence: number;
  recommended_followup_questions: string[];
  suggested_tags: string[];
  should_create_case: boolean;
  should_prepare_draft_later: boolean;
  caution_notes: string[];
};

export type TriageRequest = {
  sourceType: TriageSourceType;
  sourceIds: string[];
  sourceLabel: string;
  sourceSnapshot: Record<string, unknown>;
};

export type TriageRunOutcome = {
  aiEnabled: boolean;
  persisted: boolean;
  note: string;
  sourceType: TriageSourceType;
  sourceIds: string[];
  sourceLabel: string;
  triageResult: StructuredTriageResult | null;
  auditLogId: string | null;
  provider: AiProvider | null;
  model: string | null;
};

export type DraftMode =
  | "holding_statement"
  | "normal_technical_reply"
  | "firm_but_polite"
  | "management_summary"
  | "vessel_instruction"
  | "vendor_clarification"
  | "owner_charterer_sensitive";

export type DraftStatus = "pending_red_team" | "needs_evidence" | "blocked";

export type StructuredDraftResult = {
  draft_id: string;
  source_type: DraftSourceType;
  source_ids: string[];
  intended_recipient_placeholder: string;
  subject_placeholder: string;
  draft_body: string;
  draft_purpose: string;
  tone_mode: DraftMode;
  evidence_basis: string;
  assumptions: string[];
  missing_information: string[];
  liability_cautions: string[];
  recommended_attachments: string[];
  status: DraftStatus;
  confidence: number;
  created_at: string;
  must_be_red_teamed: true;
};

export type DraftRequest = {
  sourceType: DraftSourceType;
  sourceIds: string[];
  sourceLabel: string;
  sourceSnapshot: Record<string, unknown>;
  draftId: string;
  toneMode: DraftMode;
  triageContext?: {
    sourceType: TriageSourceType;
    sourceIds: string[];
    sourceLabel: string;
    auditLogId: string | null;
    result: StructuredTriageResult;
  } | null;
};

export type DraftRunOutcome = {
  aiEnabled: boolean;
  persisted: boolean;
  note: string;
  sourceType: DraftSourceType;
  sourceIds: string[];
  sourceLabel: string;
  draftResult: StructuredDraftResult | null;
  draftRecordId: string | null;
  auditLogId: string | null;
  provider: AiProvider | null;
  model: string | null;
  triageAuditLogId: string | null;
};
