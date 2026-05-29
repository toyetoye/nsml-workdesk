import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

import { saveEvidence } from "@/lib/persistence/repository";
import { ingestEmlEvidence } from "@/lib/email-ingestion/ingest";
import { composeEml, type ComposeAttachment } from "@/lib/email-ingestion/compose-eml";
import type { ImportWorkspaceAssignment } from "@/lib/mock-data";

// mailparser needs the Node runtime; never statically cache an ingest endpoint.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

const WORKSPACE_VALUES: ImportWorkspaceAssignment[] = [
  "Import/Staging",
  "LNG PORTHARCOURT II",
  "LPG ALFRED TEMILE",
  "LPG ALFRED TEMILE 10",
  "Projects",
  "Other",
  "Assurance",
];

// Compare via fixed-length SHA-256 digests so the check is constant-time
// regardless of the supplied token's length.
function tokensMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function authorize(request: NextRequest): boolean {
  const secret = process.env.NSML_INGEST_SECRET?.trim() ?? "";
  if (!secret) {
    // Fail closed: with no configured secret the endpoint accepts nothing.
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return false;
  }

  return tokensMatch(token, secret);
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function normalizeWorkspace(value: unknown): ImportWorkspaceAssignment {
  const candidate = String(value ?? "").trim();
  return (WORKSPACE_VALUES as string[]).includes(candidate)
    ? (candidate as ImportWorkspaceAssignment)
    : "Import/Staging";
}

function sanitizeFilename(subject: string): string {
  const base =
    subject.replace(/[^a-zA-Z0-9.\-_ ]/g, "").trim().slice(0, 80) || "captured-email";
  return `${base}.eml`;
}

function parseAttachments(value: unknown): ComposeAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const a = (entry ?? {}) as Record<string, unknown>;
    return {
      name: String(a.name ?? "attachment.bin"),
      contentType: String(a.contentType ?? "application/octet-stream"),
      sizeBytes: typeof a.sizeBytes === "number" ? a.sizeBytes : null,
      contentBase64: typeof a.contentBase64 === "string" ? a.contentBase64 : null,
    } satisfies ComposeAttachment;
  });
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return jsonError(401, "Unauthorized.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError(413, "Payload too large.");
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonError(413, "Payload too large.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const subject = String(payload.subject ?? "").trim();
  const from = String(payload.from ?? "").trim();
  const bodyText = String(payload.bodyText ?? "");

  if (!subject && !from && !bodyText) {
    return jsonError(400, "A subject, sender, or body is required.");
  }

  const workspace = normalizeWorkspace(payload.workspaceAssignment);
  const linkedCaseId = String(payload.linkedCaseId ?? "").trim() || null;
  const sentAt = typeof payload.sentAt === "string" ? payload.sentAt : null;

  const composed = composeEml({
    subject: subject || "Untitled email",
    from: from || "Unknown sender",
    to: asStringArray(payload.to),
    cc: asStringArray(payload.cc),
    sentAtIso: sentAt,
    messageId: typeof payload.messageId === "string" ? payload.messageId : null,
    inReplyTo: typeof payload.inReplyTo === "string" ? payload.inReplyTo : null,
    references: asStringArray(payload.references),
    bodyText,
    attachments: parseAttachments(payload.attachments),
  });

  try {
    const evidence = await saveEvidence({
      title: subject || "Captured email",
      type: "eml-placeholder",
      source: from || "Outlook capture",
      date: sentAt ?? new Date().toISOString(),
      description: "Captured from Outlook via the WorkDesk add-in.",
      status: "Captured",
      source_type: "eml-placeholder",
      workspace_assignment: workspace,
      case_id: linkedCaseId,
      original_filename: sanitizeFilename(subject || "captured-email"),
      mime_type: "message/rfc822",
      storage_state: "metadata-only",
    });

    const outcome = await ingestEmlEvidence(evidence.row.evidence_id, {
      rawBuffer: composed.buffer,
    });

    return NextResponse.json({
      ok: outcome.parseStatus === "parsed",
      evidenceId: evidence.row.evidence_id,
      threadId: outcome.threadRow?.thread_id ?? null,
      messageId: outcome.messageRow?.message_id ?? null,
      parseStatus: outcome.parseStatus,
      capturedAttachments: composed.capturedAttachments,
      metadataOnlyAttachments: composed.metadataOnlyAttachments,
      note: outcome.note,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed.";
    return jsonError(500, message);
  }
}
