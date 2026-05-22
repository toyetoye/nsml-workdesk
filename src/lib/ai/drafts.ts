import "server-only";

import OpenAI from "openai";
import { saveDraftResponse } from "@/lib/persistence/repository";
import { getAiConfigStatus } from "./config";
import type {
  DraftRequest,
  DraftRunOutcome,
  StructuredDraftResult,
  DraftMode,
  DraftStatus,
} from "./types";
import type { Json } from "@/lib/persistence/types";

const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "draft_id",
    "source_type",
    "source_ids",
    "intended_recipient_placeholder",
    "subject_placeholder",
    "draft_body",
    "draft_purpose",
    "tone_mode",
    "evidence_basis",
    "assumptions",
    "missing_information",
    "liability_cautions",
    "recommended_attachments",
    "status",
    "confidence",
    "created_at",
    "must_be_red_teamed",
  ],
  properties: {
    draft_id: { type: "string" },
    source_type: { type: "string", enum: ["intake_item", "correspondence_thread", "case"] },
    source_ids: { type: "array", items: { type: "string" } },
    intended_recipient_placeholder: { type: "string" },
    subject_placeholder: { type: "string" },
    draft_body: { type: "string" },
    draft_purpose: { type: "string" },
    tone_mode: {
      type: "string",
      enum: [
        "holding_statement",
        "normal_technical_reply",
        "firm_but_polite",
        "management_summary",
        "vessel_instruction",
        "vendor_clarification",
        "owner_charterer_sensitive",
      ],
    },
    evidence_basis: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    missing_information: { type: "array", items: { type: "string" } },
    liability_cautions: { type: "array", items: { type: "string" } },
    recommended_attachments: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["pending_red_team", "needs_evidence", "blocked"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    created_at: { type: "string" },
    must_be_red_teamed: { type: "boolean" },
  },
} as const;

const DRAFT_INSTRUCTIONS = [
  "You are NSML WorkDesk's advisory draft generator.",
  "Return only structured JSON that matches the requested schema.",
  "Generate a draft reply only; do not claim the draft is ready to send.",
  "The output is advisory and must remain traceable to the provided selected source material.",
  "Use only the selected source material and direct linked context provided in the request.",
  "Do not claim facts that are not present in the source material.",
  "Do not admit fault or liability unless the selected source material explicitly supports it and the wording is cautious.",
  "Separate confirmed facts from assumptions, list missing information, and include liability cautions where needed.",
  "If evidence is insufficient for a safe draft, set status to needs_evidence or blocked as appropriate.",
  "Every draft must require red-team review and must not be marked ready.",
  "Do not send emails, do not mention sending, and do not include unrelated vessels, projects, or records.",
  "Keep the writing human, concise, professional, technically grounded, polite but not weak, and clear about next action.",
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

function normalizeStatus(value: unknown): DraftStatus {
  if (value === "pending_red_team" || value === "needs_evidence" || value === "blocked") {
    return value;
  }

  return "pending_red_team";
}

function normalizeToneMode(value: unknown, fallback: DraftMode): DraftMode {
  if (
    value === "holding_statement" ||
    value === "normal_technical_reply" ||
    value === "firm_but_polite" ||
    value === "management_summary" ||
    value === "vessel_instruction" ||
    value === "vendor_clarification" ||
    value === "owner_charterer_sensitive"
  ) {
    return value;
  }

  return fallback;
}

function normalizeDraftResult(parsed: unknown, request: DraftRequest): StructuredDraftResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The draft response was empty or invalid.");
  }

  const value = parsed as Record<string, unknown>;
  const confidence = typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0;
  const draftId = safeText(value.draft_id) || request.draftId;
  const toneMode = normalizeToneMode(value.tone_mode, request.toneMode);

  return {
    draft_id: draftId,
    source_type: request.sourceType,
    source_ids: request.sourceIds,
    intended_recipient_placeholder: safeText(value.intended_recipient_placeholder),
    subject_placeholder: safeText(value.subject_placeholder),
    draft_body: safeText(value.draft_body),
    draft_purpose: safeText(value.draft_purpose),
    tone_mode: toneMode,
    evidence_basis: safeText(value.evidence_basis),
    assumptions: stringArray(value.assumptions),
    missing_information: stringArray(value.missing_information),
    liability_cautions: stringArray(value.liability_cautions),
    recommended_attachments: stringArray(value.recommended_attachments),
    status: normalizeStatus(value.status),
    confidence,
    created_at: safeText(value.created_at) || new Date().toISOString(),
    must_be_red_teamed: true,
  };
}

function buildPrompt(request: DraftRequest) {
  return [
    "Selected source type:",
    request.sourceType,
    "",
    "Selected source IDs:",
    request.sourceIds.join(", "),
    "",
    "Selected draft mode:",
    request.toneMode,
    "",
    "Selected source label:",
    request.sourceLabel,
    "",
    "Selected source material:",
    JSON.stringify(request.sourceSnapshot, null, 2),
    "",
    "Draft must be red-teamed and must not be marked ready.",
    "",
    request.triageContext
      ? [
          "Existing triage context:",
          JSON.stringify(
            {
              sourceType: request.triageContext.sourceType,
              sourceIds: request.triageContext.sourceIds,
              sourceLabel: request.triageContext.sourceLabel,
              auditLogId: request.triageContext.auditLogId,
              result: request.triageContext.result,
            },
            null,
            2,
          ),
        ].join("\n")
      : "Existing triage context: none",
  ].join("\n");
}

function sourceCaseId(request: DraftRequest) {
  if (request.sourceType === "case") {
    return request.sourceIds[0] ?? null;
  }

  return null;
}

export async function runDraftGeneration(request: DraftRequest): Promise<DraftRunOutcome> {
  const config = getAiConfigStatus();

  if (!config.enabled) {
    return {
      aiEnabled: false,
      persisted: false,
      note: config.message,
      sourceType: request.sourceType,
      sourceIds: request.sourceIds,
      sourceLabel: request.sourceLabel,
      draftResult: null,
      draftRecordId: null,
      auditLogId: null,
      provider: null,
      model: null,
      triageAuditLogId: request.triageContext?.auditLogId ?? null,
    };
  }

  const client = resolveOpenAIClient();

  if (!client) {
    return {
      aiEnabled: false,
      persisted: false,
      note: "AI not configured. Set OPENAI_API_KEY to enable structured draft generation.",
      sourceType: request.sourceType,
      sourceIds: request.sourceIds,
      sourceLabel: request.sourceLabel,
      draftResult: null,
      draftRecordId: null,
      auditLogId: null,
      provider: null,
      model: null,
      triageAuditLogId: request.triageContext?.auditLogId ?? null,
    };
  }

  const response = await client.responses.create({
    model: config.model,
    instructions: DRAFT_INSTRUCTIONS,
    input: buildPrompt(request),
    text: {
      format: {
        type: "json_schema",
        name: "nsml_workdesk_draft_result",
        description: "Structured advisory draft output for NSML WorkDesk.",
        schema: DRAFT_SCHEMA,
        strict: true,
      },
    },
  });

  const parsed = normalizeDraftResult(JSON.parse(response.output_text), request);
  const saved = await saveDraftResponse({
    draft_id: parsed.draft_id,
    case_id: sourceCaseId(request),
    source_type: parsed.source_type,
    source_ids: parsed.source_ids,
    source_label: request.sourceLabel,
    source_snapshot: request.sourceSnapshot as Json,
    triage_audit_log_id: request.triageContext?.auditLogId ?? null,
    triage_source_type: request.triageContext?.sourceType ?? null,
    triage_source_ids: request.triageContext?.sourceIds ?? [],
    intended_recipient_placeholder: parsed.intended_recipient_placeholder,
    subject_placeholder: parsed.subject_placeholder,
    draft_body: parsed.draft_body,
    draft_purpose: parsed.draft_purpose,
    tone_mode: parsed.tone_mode,
    evidence_basis: parsed.evidence_basis,
    assumptions: parsed.assumptions,
    missing_information: parsed.missing_information,
    liability_cautions: parsed.liability_cautions,
    recommended_attachments: parsed.recommended_attachments,
    status: parsed.status,
    confidence: parsed.confidence,
    must_be_red_teamed: true,
    persistence_state: "persisted",
  });

  return {
    aiEnabled: true,
    persisted: saved.persisted,
    note: saved.persisted
      ? "Structured draft generated and saved as a draft record."
      : "Structured draft generated. Persistence is unavailable, so the draft is session-only.",
    sourceType: request.sourceType,
    sourceIds: request.sourceIds,
    sourceLabel: request.sourceLabel,
    draftResult: parsed,
    draftRecordId: saved.row.draft_id,
    auditLogId: null,
    provider: config.provider,
    model: config.model,
    triageAuditLogId: request.triageContext?.auditLogId ?? null,
  };
}
