import "server-only";

import { randomUUID } from "node:crypto";

export type ComposeAttachment = {
  name: string;
  contentType: string;
  sizeBytes?: number | null;
  contentBase64?: string | null;
};

export type ComposeEmlInput = {
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  sentAtIso?: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  bodyText: string;
  attachments?: ComposeAttachment[];
};

export type ComposeEmlResult = {
  buffer: Buffer;
  capturedAttachments: number;
  metadataOnlyAttachments: number;
};

// Keep the synthesized message comfortably under the serverless request-body
// ceiling (Vercel functions cap request bodies at ~4.5 MB). Attachments beyond
// this budget are recorded as metadata only and noted back to the caller.
const MAX_ATTACHMENT_BYTES_TOTAL = 3 * 1024 * 1024;

// Strip CR/LF from header values so a crafted subject or sender cannot inject
// extra headers into the synthesized message.
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function foldAddressList(values: string[]): string {
  return values.map((entry) => sanitizeHeaderValue(entry)).filter(Boolean).join(", ");
}

function toRfcDate(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toUTCString().replace(/GMT$/, "+0000");
}

function chunkBase64(b64: string): string {
  return b64
    .replace(/[\r\n]/g, "")
    .replace(/.{76}/g, "$&\r\n")
    .trim();
}

function ensureMessageId(messageId: string | null | undefined): string {
  const trimmed = (messageId ?? "").trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed;
  }
  if (trimmed) {
    return `<${trimmed}>`;
  }
  return `<${randomUUID()}@nsml-workdesk.local>`;
}

function buildHeaderBlock(input: ComposeEmlInput): string[] {
  const headers: string[] = [];

  headers.push(`From: ${sanitizeHeaderValue(input.from || "Unknown sender")}`);
  if (input.to?.length) {
    headers.push(`To: ${foldAddressList(input.to)}`);
  }
  if (input.cc?.length) {
    headers.push(`Cc: ${foldAddressList(input.cc)}`);
  }
  headers.push(`Subject: ${sanitizeHeaderValue(input.subject || "Untitled email")}`);
  headers.push(`Date: ${toRfcDate(input.sentAtIso)}`);
  headers.push(`Message-ID: ${ensureMessageId(input.messageId)}`);
  if (input.inReplyTo) {
    headers.push(`In-Reply-To: ${sanitizeHeaderValue(input.inReplyTo)}`);
  }
  if (input.references?.length) {
    const refs = input.references.map((ref) => sanitizeHeaderValue(ref)).filter(Boolean).join(" ");
    if (refs) {
      headers.push(`References: ${refs}`);
    }
  }
  headers.push("MIME-Version: 1.0");

  return headers;
}

function selectAttachments(attachments: ComposeAttachment[] | undefined) {
  let captured = 0;
  let metadataOnly = 0;
  let runningBytes = 0;
  const includable: ComposeAttachment[] = [];

  for (const att of attachments ?? []) {
    const hasContent = typeof att.contentBase64 === "string" && att.contentBase64.length > 0;
    const decodedBytes = hasContent
      ? Math.floor((att.contentBase64!.length * 3) / 4)
      : att.sizeBytes ?? 0;

    if (hasContent && runningBytes + decodedBytes <= MAX_ATTACHMENT_BYTES_TOTAL) {
      includable.push(att);
      runningBytes += decodedBytes;
      captured += 1;
    } else {
      metadataOnly += 1;
    }
  }

  return { includable, captured, metadataOnly };
}

export function composeEml(input: ComposeEmlInput): ComposeEmlResult {
  const headers = buildHeaderBlock(input);
  const bodyBase64 = chunkBase64(Buffer.from(input.bodyText ?? "", "utf-8").toString("base64"));
  const { includable, captured, metadataOnly } = selectAttachments(input.attachments);

  if (includable.length === 0) {
    const lines = [
      ...headers,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      bodyBase64,
      "",
    ];

    return {
      buffer: Buffer.from(lines.join("\r\n"), "utf-8"),
      capturedAttachments: captured,
      metadataOnlyAttachments: metadataOnly,
    };
  }

  const boundary = `nsml_${randomUUID().replace(/-/g, "")}`;
  const parts: string[] = [
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
  ];

  for (const att of includable) {
    const name = sanitizeHeaderValue(att.name || "attachment.bin");
    const ctype = sanitizeHeaderValue(att.contentType || "application/octet-stream");
    parts.push(
      `--${boundary}`,
      `Content-Type: ${ctype}; name="${name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${name}"`,
      "",
      chunkBase64(att.contentBase64!),
    );
  }

  parts.push(`--${boundary}--`, "");

  const message = `${headers.join("\r\n")}\r\n${parts.join("\r\n")}`;

  return {
    buffer: Buffer.from(message, "utf-8"),
    capturedAttachments: captured,
    metadataOnlyAttachments: metadataOnly,
  };
}
