import "server-only";

import { randomUUID } from "node:crypto";
import {
  getCaseById,
  getEvidenceById,
  listCorrespondenceMessages,
  listCorrespondenceThreads,
  linkCorrespondenceToCase,
  saveCorrespondenceMessage,
  saveCorrespondenceThread,
  saveEvidence,
} from "@/lib/persistence/repository";
import { hasEvidenceStorageConfig } from "@/lib/persistence/config";
import { downloadEvidenceFile } from "@/lib/storage/evidence";
import {
  allWorkspaces,
  type EmailParseStatus,
} from "@/lib/mock-data";
import {
  isEmlEvidenceCandidate,
} from "./shared";
import { parseEmlBuffer } from "./parser";
import type { EmailIngestionOutcome } from "./types";
import { matchParsedThreadToExistingThreads } from "@/lib/correspondence/threading";

const MAX_EML_BYTES = 10 * 1024 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function bufferToArrayBuffer(buffer: Buffer) {
  return Uint8Array.from(buffer).buffer;
}

function resolveWorkspaceKey(workspaceAssignment: string) {
  const normalized = workspaceAssignment.trim().toLowerCase();

  if (normalized === "import/staging") {
    return "unclassified";
  }

  if (normalized.includes("lng portharcourt ii")) {
    return "lng-portharcourt-ii";
  }

  if (normalized.includes("lpg alfred temile 10")) {
    return "lpg-alfred-temile-10";
  }

  if (normalized.includes("lpg alfred temile")) {
    return "lpg-alfred-temile";
  }

  if (normalized.includes("project")) {
    return "projects";
  }

  if (normalized.includes("assurance")) {
    return "other";
  }

  if (normalized.includes("other")) {
    return "other";
  }

  return "unclassified";
}

function resolveWorkspaceLabel(workspaceKey: string, fallbackLabel: string) {
  return allWorkspaces.find((workspace) => workspace.slug === workspaceKey)?.name ?? fallbackLabel;
}

function deriveThreadStatus(parseStatus: EmailParseStatus, linkedCaseId: string | null) {
  if (parseStatus !== "parsed") {
    return "Needs Evidence";
  }

  return linkedCaseId ? "Pending My Reply" : "Waiting on Vessel";
}

type IngestEmlOptions = {
  rawBuffer?: Buffer | null;
};

export async function ingestEmlEvidence(
  evidenceId: string,
  options: IngestEmlOptions = {},
): Promise<EmailIngestionOutcome> {
  const evidence = await getEvidenceById(evidenceId);

  if (!evidence) {
    throw new Error("Evidence record not found.");
  }

  const rawBuffer = options.rawBuffer ?? null;

  if (!hasEvidenceStorageConfig() && !rawBuffer) {
    const updated = await saveEvidence({
      ...evidence,
      parse_status: "unsupported",
      parse_error: "EML parsing is disabled until private storage is configured.",
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "unsupported",
      parseError: "EML parsing is disabled until private storage is configured.",
      supported: false,
      storageAvailable: false,
      note: "EML parsing is disabled until private storage is configured.",
    };
  }

  if (!isEmlEvidenceCandidate({
    sourceType: evidence.source_type,
    originalFilename: evidence.original_filename,
    mimeType: evidence.mime_type,
    type: evidence.type,
  })) {
    const updated = await saveEvidence({
      ...evidence,
      parse_status: "unsupported",
      parse_error: "This evidence is not an eligible EML file.",
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "unsupported",
      parseError: "This evidence is not an eligible EML file.",
      supported: false,
      storageAvailable: true,
      note: "This evidence is not an eligible EML file.",
    };
  }

  const staged = await saveEvidence({
    ...evidence,
    parse_status: "parsing",
    parse_error: null,
    parsed_thread_id: null,
    parsed_message_id: null,
    parsed_at: null,
  });

  if (!staged.row.storage_bucket || !staged.row.storage_path) {
    if (rawBuffer) {
      // Continue with the in-memory buffer fallback below.
    } else {
    const updated = await saveEvidence({
      ...staged.row,
      parse_status: "failed",
      parse_error: "Private evidence file is missing storage metadata.",
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "failed",
      parseError: "Private evidence file is missing storage metadata.",
      supported: true,
      storageAvailable: true,
      note: "Private evidence file is missing storage metadata.",
    };
    }
  }

  let file =
    hasEvidenceStorageConfig() && staged.row.storage_bucket && staged.row.storage_path
      ? await downloadEvidenceFile(staged.row.storage_bucket, staged.row.storage_path)
      : null;

  if (!file && rawBuffer) {
    file = {
      buffer: bufferToArrayBuffer(rawBuffer),
      mimeType: evidence.mime_type || null,
      originalFilename: evidence.original_filename || null,
    };
  }

  if (!file) {
    const updated = await saveEvidence({
      ...staged.row,
      parse_status: "failed",
      parse_error: "Private evidence file could not be loaded for parsing.",
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "failed",
      parseError: "Private evidence file could not be loaded for parsing.",
      supported: true,
      storageAvailable: true,
      note: "Private evidence file could not be loaded for parsing.",
    };
  }

  if (file.buffer.byteLength > MAX_EML_BYTES) {
    const updated = await saveEvidence({
      ...staged.row,
      parse_status: "unsupported",
      parse_error: `The EML file is larger than the ${Math.round(MAX_EML_BYTES / 1024 / 1024)} MB parsing limit.`,
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "unsupported",
      parseError: `The EML file is larger than the ${Math.round(MAX_EML_BYTES / 1024 / 1024)} MB parsing limit.`,
      supported: false,
      storageAvailable: true,
      note: "The evidence file is too large to parse in this sprint.",
    };
  }

  try {
    const parsed = await parseEmlBuffer(Buffer.from(file.buffer));
    const [existingThreadRows, existingMessageRows] = await Promise.all([
      listCorrespondenceThreads(),
      listCorrespondenceMessages(),
    ]);
    const linkedCase = staged.row.case_id ? await getCaseById(staged.row.case_id) : null;
    const workspaceKey = linkedCase?.workspace_key ?? resolveWorkspaceKey(staged.row.workspace_assignment);
    const workspaceLabel = linkedCase?.workspace_label ?? resolveWorkspaceLabel(workspaceKey, staged.row.workspace_assignment);
    const sourceCaseId = linkedCase?.case_id ?? staged.row.case_id ?? null;
    const threadingMatch = matchParsedThreadToExistingThreads(
      {
        messageId: parsed.messageId,
        inReplyTo: parsed.inReplyTo,
        references: parsed.references,
        subject: parsed.subject,
        from: parsed.from,
        sentAtIso: parsed.sentAtIso,
        workspaceKey,
        caseId: sourceCaseId,
      },
      existingThreadRows,
      existingMessageRows,
    );
    const parseStatus = "parsed";
    const threadStatus = deriveThreadStatus(parseStatus, sourceCaseId);
    const threadId = threadingMatch.threadId ?? staged.row.parsed_thread_id ?? `thread-${randomUUID()}`;
    const messageId = staged.row.parsed_message_id ?? `message-${randomUUID()}`;
    const references = parsed.references;
    const nextSortOrder =
      existingMessageRows.filter((message) => message.thread_id === threadId).length + 1;

    const threadRow = await saveCorrespondenceThread({
      thread_id: threadId,
      workspace_key: workspaceKey,
      case_id: sourceCaseId,
      subject: parsed.subject,
      sender: parsed.from,
      recipients: parsed.to,
      cc: parsed.cc,
      date_time: parsed.sentAtIso,
      status: threadStatus,
      vessel_project: workspaceLabel,
      source_intake_item_id: null,
      linked_case_id: sourceCaseId,
      source_evidence_id: staged.row.evidence_id,
      parse_status: parseStatus,
      parse_error: null,
      original_filename: staged.row.original_filename,
      message_id_header: parsed.messageId,
      in_reply_to: parsed.inReplyTo,
      references,
      bcc: parsed.bcc,
      body_text: parsed.bodyText,
      body_html_text: parsed.bodyHtmlText,
      attachment_metadata: parsed.attachments,
      parsed_at: nowIso(),
    });

    const messageRow = await saveCorrespondenceMessage({
      message_id: messageId,
      thread_id: threadRow.thread_id,
      sender: parsed.from,
      body: parsed.bodyText,
      timestamp: parsed.sentAtIso,
      sort_order: nextSortOrder,
      recipients: parsed.to,
      cc_recipients: parsed.cc,
      bcc_recipients: parsed.bcc,
      subject: parsed.subject,
      message_id_header: parsed.messageId,
      in_reply_to: parsed.inReplyTo,
      references,
      body_text: parsed.bodyText,
      body_html_text: parsed.bodyHtmlText,
      attachment_metadata: parsed.attachments,
      source_evidence_id: staged.row.evidence_id,
      parsed_at: nowIso(),
    });

    if (sourceCaseId) {
      await linkCorrespondenceToCase(sourceCaseId, threadRow.thread_id);
    }

    const updatedEvidence = await saveEvidence({
      ...staged.row,
      parse_status: parseStatus,
      parse_error: null,
      parsed_thread_id: threadRow.thread_id,
      parsed_message_id: messageRow.message_id,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updatedEvidence.row,
      threadRow,
      messageRow,
      parseStatus,
      parseError: null,
      supported: true,
      storageAvailable: true,
      note:
        threadingMatch.threadId !== null
          ? `Parsed EML metadata and added the message to an existing thread via ${threadingMatch.matchKind}.`
          : "Parsed EML metadata and created a new structured correspondence thread.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse the EML file.";
    const updated = await saveEvidence({
      ...staged.row,
      parse_status: "failed",
      parse_error: message,
      parsed_thread_id: null,
      parsed_message_id: null,
      parsed_at: nowIso(),
    });

    return {
      evidenceRow: updated.row,
      threadRow: null,
      messageRow: null,
      parseStatus: "failed",
      parseError: message,
      supported: true,
      storageAvailable: true,
      note: message,
    };
  }
}
