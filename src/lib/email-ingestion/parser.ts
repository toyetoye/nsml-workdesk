import "server-only";

import { simpleParser } from "mailparser";
import type { ParsedAttachmentMetadata, ParsedEmailMetadata } from "./types";

type HeaderLookup = {
  get: (key: string) => unknown;
};

type ParsedAttachmentLike = {
  filename?: string;
  name?: string;
  contentType?: string;
  size?: number;
  cid?: string;
  contentDisposition?: string;
};

type ParsedMailLike = {
  text?: string | Buffer | null;
  html?: string | Buffer | null;
  subject?: string | null;
  from?: unknown;
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
  date?: Date | string | null;
  messageId?: string | null;
  inReplyTo?: unknown;
  references?: unknown;
  attachments?: ParsedAttachmentLike[] | null;
  headers?: HeaderLookup | null;
};

const HTML_BLOCK_BOUNDARY = /<\/(p|div|li|tr|h[1-6])>/gi;
const HTML_BREAK_BOUNDARY = /<br\s*\/?>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const WHITESPACE_PATTERN = /[ \t]+\n/g;
const MULTI_NEWLINE_PATTERN = /\n{3,}/g;
const ENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/&nbsp;/gi, " "],
  [/&amp;/gi, "&"],
  [/&lt;/gi, "<"],
  [/&gt;/gi, ">"],
  [/&quot;/gi, '"'],
  [/&#39;/gi, "'"],
];

function stripHtmlToText(html: string) {
  const withBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(HTML_BREAK_BOUNDARY, "\n")
    .replace(HTML_BLOCK_BOUNDARY, "\n");

  const stripped = withBreaks.replace(HTML_TAG_PATTERN, " ");
  const collapsed = stripped.replace(WHITESPACE_PATTERN, "\n").replace(MULTI_NEWLINE_PATTERN, "\n\n");

  return ENTITY_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    collapsed,
  ).trim();
}

function extractAddressList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value
      .split(/[,;]/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const field = value as { value?: Array<{ address?: string; name?: string }> };
  if (Array.isArray(field.value)) {
    return field.value
      .map((entry) => {
        const address = entry.address?.trim();
        const name = entry.name?.trim();

        if (!address) {
          return name ?? "";
        }

        return name ? `${name} <${address}>` : address;
      })
      .filter(Boolean);
  }

  return [];
}

function extractHeaderValue(headers: HeaderLookup, key: string) {
  return headers.get(key) ?? headers.get(key.toLowerCase()) ?? headers.get(key.toUpperCase()) ?? null;
}

function extractReferences(headers: HeaderLookup, rawReferences: unknown) {
  if (Array.isArray(rawReferences)) {
    return rawReferences.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof rawReferences === "string") {
    return rawReferences
      .split(/\s+/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const header = extractHeaderValue(headers, "references");
  if (typeof header === "string") {
    return header
      .split(/\s+/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function toIsoDate(value: unknown) {
  const parsed = value ? new Date(String(value)) : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function toAttachmentMetadata(attachment: ParsedAttachmentLike): ParsedAttachmentMetadata {
  return {
    name: String(attachment?.filename ?? attachment?.name ?? "attachment.bin"),
    contentType: String(attachment?.contentType ?? "application/octet-stream"),
    sizeBytes: typeof attachment?.size === "number" ? attachment.size : null,
    contentId: attachment?.cid ? String(attachment.cid) : null,
    disposition: attachment?.contentDisposition ? String(attachment.contentDisposition) : null,
  };
}

export async function parseEmlBuffer(buffer: Buffer): Promise<ParsedEmailMetadata> {
  const parsed = (await simpleParser(buffer)) as ParsedMailLike;
  const textBody = typeof parsed.text === "string" ? parsed.text.trim() : "";
  const htmlBody = typeof parsed.html === "string" ? parsed.html.trim() : "";
  const safeText = textBody || (htmlBody ? stripHtmlToText(htmlBody) : "");
  const headers = parsed.headers ?? { get: () => undefined };

  return {
    subject:
      typeof parsed.subject === "string" && parsed.subject.trim()
        ? parsed.subject.trim()
        : "Untitled email",
    from: extractAddressList(parsed.from).join("; ") || "Unknown sender",
    to: extractAddressList(parsed.to),
    cc: extractAddressList(parsed.cc),
    bcc: extractAddressList(parsed.bcc),
    sentAtIso: toIsoDate(parsed.date),
    messageId: typeof parsed.messageId === "string" ? parsed.messageId : null,
    inReplyTo: typeof parsed.inReplyTo === "string" ? String(parsed.inReplyTo) : null,
    references: extractReferences(headers, parsed.references),
    bodyText: safeText,
    bodyHtmlText: htmlBody ? stripHtmlToText(htmlBody) : null,
    attachments: (parsed.attachments ?? []).map(toAttachmentMetadata),
  };
}
