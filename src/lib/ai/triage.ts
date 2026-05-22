import "server-only";

import OpenAI from "openai";
import { appendAuditLog } from "@/lib/persistence/repository";
import type { Json } from "@/lib/persistence/types";
import { getAiConfigStatus } from "./config";
import type {
  StructuredTriageResult,
  TriageEvidenceReference,
  TriageRequest,
  TriageRunOutcome,
} from "./types";

const TRIAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary_1line",
    "expanded_summary",
    "suggested_workspace",
    "suggested_case_title",
    "suggested_status",
    "urgency_level",
    "priority_reason",
    "waiting_on",
    "required_next_action",
    "risk_flags",
    "missing_information",
    "evidence_used",
    "confidence",
    "recommended_followup_questions",
    "suggested_tags",
    "should_create_case",
    "should_prepare_draft_later",
    "caution_notes",
  ],
  properties: {
    summary_1line: { type: "string" },
    expanded_summary: { type: "string" },
    suggested_workspace: { type: "string" },
    suggested_case_title: { type: "string" },
    suggested_status: { type: "string" },
    urgency_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
    priority_reason: { type: "string" },
    waiting_on: { type: "string" },
    required_next_action: { type: "string" },
    risk_flags: { type: "array", items: { type: "string" } },
    missing_information: { type: "array", items: { type: "string" } },
    evidence_used: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source_id", "source_type", "label", "note"],
        properties: {
          source_id: { type: "string" },
          source_type: { type: "string" },
          label: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    recommended_followup_questions: { type: "array", items: { type: "string" } },
    suggested_tags: { type: "array", items: { type: "string" } },
    should_create_case: { type: "boolean" },
    should_prepare_draft_later: { type: "boolean" },
    caution_notes: { type: "array", items: { type: "string" } },
  },
} as const;

const TRIAGE_INSTRUCTIONS = [
  "You are NSML WorkDesk's advisory triage engine.",
  "Return only structured JSON that matches the requested schema.",
  "Advice is advisory only; do not instruct automatic updates, replies, or case creation.",
  "Use only the selected source material and direct linked context provided in the request.",
  "Do not claim facts that are not present in the source material.",
  "Mark uncertainty clearly, list missing information, and include caution notes where wording, liability, or evidence gaps exist.",
  "Preserve traceability by relying on the source IDs and evidence items provided.",
  "Do not mention unrelated vessels, projects, or records.",
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

function evidenceReferences(value: unknown): TriageEvidenceReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const sourceId = safeText(record.source_id);
      const sourceType = safeText(record.source_type);
      const label = safeText(record.label);
      const note = safeText(record.note);

      if (!sourceId || !sourceType || !label || !note) {
        return null;
      }

      return {
        source_id: sourceId,
        source_type: sourceType,
        label,
        note,
      };
    })
    .filter((item): item is TriageEvidenceReference => Boolean(item));
}

function normalizeTriageResult(parsed: unknown): StructuredTriageResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The triage response was empty or invalid.");
  }

  const value = parsed as Record<string, unknown>;
  const confidence = typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0;
  const urgency_level =
    value.urgency_level === "low" ||
    value.urgency_level === "medium" ||
    value.urgency_level === "high" ||
    value.urgency_level === "critical"
      ? value.urgency_level
      : "low";

  return {
    summary_1line: safeText(value.summary_1line),
    expanded_summary: safeText(value.expanded_summary),
    suggested_workspace: safeText(value.suggested_workspace),
    suggested_case_title: safeText(value.suggested_case_title),
    suggested_status: safeText(value.suggested_status),
    urgency_level,
    priority_reason: safeText(value.priority_reason),
    waiting_on: safeText(value.waiting_on),
    required_next_action: safeText(value.required_next_action),
    risk_flags: stringArray(value.risk_flags),
    missing_information: stringArray(value.missing_information),
    evidence_used: evidenceReferences(value.evidence_used),
    confidence,
    recommended_followup_questions: stringArray(value.recommended_followup_questions),
    suggested_tags: stringArray(value.suggested_tags),
    should_create_case: Boolean(value.should_create_case),
    should_prepare_draft_later: Boolean(value.should_prepare_draft_later),
    caution_notes: stringArray(value.caution_notes),
  };
}

function buildPrompt(request: TriageRequest) {
  return [
    "Selected source type:",
    request.sourceType,
    "",
    "Selected source IDs:",
    request.sourceIds.join(", "),
    "",
    "Selected source label:",
    request.sourceLabel,
    "",
    "Selected source material:",
    JSON.stringify(request.sourceSnapshot, null, 2),
  ].join("\n");
}

export async function runTriageAnalysis(request: TriageRequest): Promise<TriageRunOutcome> {
  const config = getAiConfigStatus();

  if (!config.enabled) {
    return {
      aiEnabled: false,
      persisted: false,
      note: config.message,
      sourceType: request.sourceType,
      sourceIds: request.sourceIds,
      sourceLabel: request.sourceLabel,
      triageResult: null,
      auditLogId: null,
      provider: null,
      model: null,
    };
  }

  const client = resolveOpenAIClient();

  if (!client) {
    return {
      aiEnabled: false,
      persisted: false,
      note: "AI not configured. Set OPENAI_API_KEY to enable structured triage.",
      sourceType: request.sourceType,
      sourceIds: request.sourceIds,
      sourceLabel: request.sourceLabel,
      triageResult: null,
      auditLogId: null,
      provider: null,
      model: null,
    };
  }

  const response = await client.responses.create({
    model: config.model,
    instructions: TRIAGE_INSTRUCTIONS,
    input: buildPrompt(request),
    text: {
      format: {
        type: "json_schema",
        name: "nsml_workdesk_triage_result",
        description: "Structured advisory triage output for NSML WorkDesk.",
        schema: TRIAGE_SCHEMA,
        strict: true,
      },
    },
  });

  const parsed = normalizeTriageResult(JSON.parse(response.output_text));
  const auditLog = await appendAuditLog({
    actor: "system",
    action: "ai.triage",
    object_type: request.sourceType,
    object_id: request.sourceIds[0] ?? request.sourceLabel,
    details: {
      sourceType: request.sourceType,
      sourceIds: request.sourceIds,
      sourceLabel: request.sourceLabel,
      sourceSnapshot: request.sourceSnapshot as Json,
      provider: config.provider,
      model: config.model,
      triageResult: parsed,
    },
  });

  return {
    aiEnabled: true,
    persisted: auditLog.persisted,
    note: auditLog.persisted
      ? "Structured triage complete and saved as an audit-style record."
      : "Structured triage complete. Persistence is unavailable, so the result is session-only.",
    sourceType: request.sourceType,
    sourceIds: request.sourceIds,
    sourceLabel: request.sourceLabel,
    triageResult: parsed,
    auditLogId: auditLog.row.audit_id,
    provider: config.provider,
    model: config.model,
  };
}
