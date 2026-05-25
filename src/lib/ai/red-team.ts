import "server-only";

import OpenAI from "openai";
import { appendAuditLog, saveDraftRedTeamReview } from "@/lib/persistence/repository";
import { buildIMSReferencesForContext, formatIMSReferencePromptSection } from "@/lib/ims/search";
import type { DraftResponsePlaceholderRow, Json } from "@/lib/persistence/types";
import { getAiConfigStatus } from "./config";
import { describeRedTeamVerdict } from "./red-team-builders";
import type {
  DraftReadinessStatus,
  DraftReviewVerdict,
  DraftSourceType,
  RedTeamRunOutcome,
  StructuredRedTeamReview,
} from "./types";

const RED_TEAM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "review_id",
    "draft_id",
    "source_ids_reviewed",
    "verdict",
    "readiness_status",
    "summary",
    "unsupported_claims",
    "liability_risks",
    "technical_risks",
    "tone_risks",
    "missing_information",
    "evidence_gaps",
    "confidentiality_concerns",
    "recommended_revisions",
    "required_user_checks",
    "safe_to_copy",
    "confidence",
    "reviewed_at",
  ],
  properties: {
    review_id: { type: "string" },
    draft_id: { type: "string" },
    source_ids_reviewed: { type: "array", items: { type: "string" } },
    verdict: {
      type: "string",
      enum: ["pass", "pass_with_caution", "revise", "reject", "needs_more_evidence"],
    },
    readiness_status: { type: "string", enum: ["ready_to_copy", "not_ready"] },
    summary: { type: "string" },
    unsupported_claims: { type: "array", items: { type: "string" } },
    liability_risks: { type: "array", items: { type: "string" } },
    technical_risks: { type: "array", items: { type: "string" } },
    tone_risks: { type: "array", items: { type: "string" } },
    missing_information: { type: "array", items: { type: "string" } },
    evidence_gaps: { type: "array", items: { type: "string" } },
    confidentiality_concerns: { type: "array", items: { type: "string" } },
    recommended_revisions: { type: "array", items: { type: "string" } },
    required_user_checks: { type: "array", items: { type: "string" } },
    safe_to_copy: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reviewed_at: { type: "string" },
  },
} as const;

const RED_TEAM_INSTRUCTIONS = [
  "You are NSML WorkDesk's advisory red-team reviewer for generated drafts.",
  "Return only structured JSON that matches the requested schema.",
  "Review the draft against the selected source evidence and identify unsupported claims, liability risks, technical risks, tone risks, missing information, evidence gaps, confidentiality concerns, recommended revisions, and required user checks.",
  "Do not rewrite the draft. Do not send email. Do not mark anything ready outside the schema.",
  "Flag any wording that sounds final when facts are still preliminary.",
  "Flag any statement that implies fault, delay acceptance, unsafe approval, or class/owner/charterer confirmation without evidence.",
  "Flag liability admissions or unsupported certainty.",
  "Only pass a draft when the evidence and wording support manual external copy. Otherwise choose revise, reject, or needs_more_evidence.",
  "Only pass or pass_with_caution may set safe_to_copy true.",
  "Keep the review human, concise, professional, and clearly tied to the selected source material.",
  "Do not include unrelated vessels, projects, or the whole evidence library.",
].join("\n");

function resolveOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

function safeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => safeText(item)).filter(Boolean);
}

function normalizeVerdict(value: unknown): DraftReviewVerdict {
  if (
    value === "pass" ||
    value === "pass_with_caution" ||
    value === "revise" ||
    value === "reject" ||
    value === "needs_more_evidence"
  ) {
    return value;
  }

  return "revise";
}

function normalizeReadinessStatus(
  value: unknown,
  verdict: DraftReviewVerdict,
  safeToCopy: boolean,
): DraftReadinessStatus {
  if (safeToCopy && (verdict === "pass" || verdict === "pass_with_caution")) {
    return "ready_to_copy";
  }

  if (value === "ready_to_copy" && safeToCopy) {
    return "ready_to_copy";
  }

  return "not_ready";
}

function normalizeRedTeamReview(parsed: unknown, draft: DraftResponsePlaceholderRow): StructuredRedTeamReview {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The red-team response was empty or invalid.");
  }

  const value = parsed as Record<string, unknown>;
  const verdict = normalizeVerdict(value.verdict);
  const safeToCopy = verdict === "pass" || verdict === "pass_with_caution";
  const confidence =
    typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0;

  return {
    review_id: safeText(value.review_id) || `review-${draft.draft_id}`,
    draft_id: draft.draft_id,
    source_ids_reviewed: draft.source_ids,
    verdict,
    readiness_status: normalizeReadinessStatus(value.readiness_status, verdict, safeToCopy),
    summary: safeText(value.summary),
    unsupported_claims: stringArray(value.unsupported_claims),
    liability_risks: stringArray(value.liability_risks),
    technical_risks: stringArray(value.technical_risks),
    tone_risks: stringArray(value.tone_risks),
    missing_information: stringArray(value.missing_information),
    evidence_gaps: stringArray(value.evidence_gaps),
    confidentiality_concerns: stringArray(value.confidentiality_concerns),
    recommended_revisions: stringArray(value.recommended_revisions),
    required_user_checks: stringArray(value.required_user_checks),
    safe_to_copy: safeToCopy,
    confidence,
    reviewed_at: safeText(value.reviewed_at) || new Date().toISOString(),
  };
}

function buildPrompt(draft: DraftResponsePlaceholderRow, imsSection: string) {
  return [
    "Selected draft ID:",
    draft.draft_id,
    "",
    "Selected source type:",
    draft.source_type,
    "",
    "Selected source IDs:",
    draft.source_ids.join(", "),
    "",
    "Selected source label:",
    draft.source_label,
    "",
    "Selected draft body:",
    draft.draft_body,
    "",
    "Draft purpose:",
    draft.draft_purpose,
    "",
    "Tone mode:",
    draft.tone_mode,
    "",
    "Evidence basis:",
    draft.evidence_basis,
    "",
    "Assumptions:",
    draft.assumptions.length > 0 ? draft.assumptions.join(" | ") : "None",
    "",
    "Missing information:",
    draft.missing_information.length > 0 ? draft.missing_information.join(" | ") : "None",
    "",
    "Liability cautions:",
    draft.liability_cautions.length > 0 ? draft.liability_cautions.join(" | ") : "None",
    "",
    "Recommended attachments:",
    draft.recommended_attachments.length > 0 ? draft.recommended_attachments.join(" | ") : "None",
    "",
    "Source snapshot:",
    JSON.stringify(draft.source_snapshot, null, 2),
    "",
    imsSection,
    "",
    "Do not rewrite the draft. Review it for safety to copy only.",
  ].join("\n");
}

export async function runRedTeamReview(
  draft: DraftResponsePlaceholderRow,
): Promise<RedTeamRunOutcome> {
  const sourceType = draft.source_type as DraftSourceType;
  const config = getAiConfigStatus();
  const sourceSnapshot = draft.source_snapshot as Record<string, unknown>;
  const ims = await buildIMSReferencesForContext({
    sourceType: draft.source_type,
    sourceLabel: draft.source_label,
    sourceSnapshot: {
      ...sourceSnapshot,
      draft: {
        draftId: draft.draft_id,
        draftBody: draft.draft_body,
        draftPurpose: draft.draft_purpose,
        evidenceBasis: draft.evidence_basis,
        toneMode: draft.tone_mode,
        assumptions: draft.assumptions,
        missingInformation: draft.missing_information,
        liabilityCautions: draft.liability_cautions,
        recommendedAttachments: draft.recommended_attachments,
        status: draft.status,
        confidence: draft.confidence,
      },
    },
    extraTerms: [draft.draft_body, draft.draft_purpose, draft.evidence_basis],
  });
  const imsSection = formatIMSReferencePromptSection(ims.references, ims.note);

  if (!config.enabled) {
    return {
      aiEnabled: false,
      persisted: false,
      note: config.message,
      draftId: draft.draft_id,
      sourceType,
      sourceIds: draft.source_ids,
      sourceLabel: draft.source_label,
      reviewResult: null,
      reviewRecordId: null,
      auditLogId: null,
      provider: null,
      model: null,
      imsReferencesUsed: ims.references,
      imsReferenceNote: ims.note,
    };
  }

  const client = resolveOpenAIClient();

  if (!client) {
    return {
      aiEnabled: false,
      persisted: false,
      note: "AI not configured. Set OPENAI_API_KEY to enable structured red-team review.",
      draftId: draft.draft_id,
      sourceType,
      sourceIds: draft.source_ids,
      sourceLabel: draft.source_label,
      reviewResult: null,
      reviewRecordId: null,
      auditLogId: null,
      provider: null,
      model: null,
      imsReferencesUsed: ims.references,
      imsReferenceNote: ims.note,
    };
  }

  const response = await client.responses.create({
    model: config.model,
    instructions: RED_TEAM_INSTRUCTIONS,
    input: buildPrompt(draft, imsSection),
    text: {
      format: {
        type: "json_schema",
        name: "nsml_workdesk_red_team_review",
        description: "Structured advisory red-team review output for NSML WorkDesk.",
        schema: RED_TEAM_SCHEMA,
        strict: true,
      },
    },
  });

  const review = normalizeRedTeamReview(JSON.parse(response.output_text), draft);
  const saved = await saveDraftRedTeamReview({
    review_id: review.review_id,
    draft_id: draft.draft_id,
    source_type: draft.source_type,
    source_label: draft.source_label,
    source_ids_reviewed: review.source_ids_reviewed,
    source_snapshot: draft.source_snapshot as Json,
    verdict: review.verdict,
    readiness_status: review.readiness_status,
    summary: review.summary,
    unsupported_claims: review.unsupported_claims,
    liability_risks: review.liability_risks,
    technical_risks: review.technical_risks,
    tone_risks: review.tone_risks,
    missing_information: review.missing_information,
    evidence_gaps: review.evidence_gaps,
    confidentiality_concerns: review.confidentiality_concerns,
    recommended_revisions: review.recommended_revisions,
    required_user_checks: review.required_user_checks,
    safe_to_copy: review.safe_to_copy,
    confidence: review.confidence,
    reviewed_at: review.reviewed_at,
  });

  const audit = await appendAuditLog({
    actor: "ai:red-team",
    action: "draft_red_team_review",
    object_type: "draft",
    object_id: draft.draft_id,
    details: {
      review_id: saved.row.review_id,
      draft_id: draft.draft_id,
      source_type: draft.source_type,
      source_ids_reviewed: review.source_ids_reviewed,
      verdict: review.verdict,
      readiness_status: review.readiness_status,
      safe_to_copy: review.safe_to_copy,
      confidence: review.confidence,
    } as Json,
  });

  return {
    aiEnabled: true,
    persisted: saved.persisted,
    note: saved.persisted
      ? `Red-team review ${describeRedTeamVerdict(review.verdict).toLowerCase()} and saved.`
      : `Red-team review ${describeRedTeamVerdict(review.verdict).toLowerCase()}. Persistence is unavailable, so the review is session-only.`,
    draftId: draft.draft_id,
    sourceType,
    sourceIds: draft.source_ids,
    sourceLabel: draft.source_label,
    reviewResult: review,
      reviewRecordId: saved.row.review_id,
      auditLogId: audit.row.audit_id,
      provider: config.provider,
      model: config.model,
      imsReferencesUsed: ims.references,
      imsReferenceNote: ims.note,
    };
}
