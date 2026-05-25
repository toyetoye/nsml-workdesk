import "server-only";

import {
  listIMSDocuments,
  listIMSIndexRuns,
  searchIMSChunks,
} from "@/lib/persistence/repository";
import type {
  IMSReferenceChunkRow,
  IMSReferenceSearchContext,
  IMSReferenceSearchHit,
  IMSReferenceSearchResult,
  IMSReferenceUsage,
} from "./types";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "have",
  "has",
  "been",
  "will",
  "into",
  "your",
  "their",
  "about",
  "case",
  "cases",
  "evidence",
  "document",
  "documents",
  "reference",
  "references",
  "source",
  "material",
  "controlled",
  "ims",
  "workdesk",
]);

function safeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function flattenText(value: unknown, collector: string[] = [], depth = 0): string[] {
  if (depth > 3 || value == null) {
    return collector;
  }

  if (typeof value === "string") {
    collector.push(value);
    return collector;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    collector.push(String(value));
    return collector;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenText(item, collector, depth + 1);
    }
    return collector;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      flattenText(item, collector, depth + 1);
    }
  }

  return collector;
}

function buildQueryTerms(context: IMSReferenceSearchContext) {
  const raw = [
    context.sourceType,
    context.sourceLabel,
    ...flattenText(context.sourceSnapshot),
    ...(context.extraTerms ?? []),
  ]
    .map((value) => safeText(value).toLowerCase())
    .join(" ");

  return unique(
    raw
      .split(/[^a-z0-9]+/g)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)),
  );
}

function extractSnippet(text: string, terms: string[]) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return "";
  }

  const lower = normalized.toLowerCase();
  const matchIndex = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (typeof matchIndex !== "number" || matchIndex < 0) {
    return normalized.slice(0, 220);
  }

  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(normalized.length, matchIndex + 220);
  return normalized.slice(start, end);
}

function scoreChunk(chunk: IMSReferenceChunkRow, terms: string[], documentTitle: string) {
  const lowerTitle = documentTitle.toLowerCase();
  const lowerHeading = (chunk.heading_optional ?? "").toLowerCase();
  const lowerPath = chunk.source_path.toLowerCase();
  const lowerKeywords = chunk.keywords_optional.map((keyword) => keyword.toLowerCase());
  const lowerText = chunk.text.toLowerCase();
  let score = 0;
  const hits: string[] = [];

  for (const term of terms) {
    let matched = false;

    if (lowerTitle.includes(term)) {
      score += 10;
      hits.push(`title:${term}`);
      matched = true;
    }

    if (lowerHeading.includes(term)) {
      score += 8;
      hits.push(`heading:${term}`);
      matched = true;
    }

    if (lowerPath.includes(term)) {
      score += 4;
      hits.push(`path:${term}`);
      matched = true;
    }

    if (lowerKeywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) {
      score += 6;
      hits.push(`keyword:${term}`);
      matched = true;
    }

    if (lowerText.includes(term)) {
      score += 2;
      hits.push(`text:${term}`);
      matched = true;
    }

    if (matched) {
      score += Math.min(3, term.length / 6);
    }
  }

  return { score, hits };
}

function chunkToUsage(
  chunk: IMSReferenceChunkRow,
  documentTitle: string,
  score: number,
  terms: string[],
  hits: string[],
): IMSReferenceSearchHit {
  const snippet = extractSnippet(chunk.text, terms);
  const firstHit = hits[0] ?? "text";

  return {
    document_id: chunk.document_id,
    document_title: documentTitle,
    source_path: chunk.source_path,
    chunk_id: chunk.id,
    heading_optional: chunk.heading_optional,
    chunk_index: chunk.chunk_index,
    token_estimate: chunk.token_estimate,
    snippet,
    relevance_note:
      hits.length > 0
        ? `Matched ${hits.length} query signal${hits.length === 1 ? "" : "s"} (${firstHit}).`
        : "Matched the broad request context.",
    score,
  };
}

export async function buildIMSReferencesForContext(
  context: IMSReferenceSearchContext,
  limit = 4,
): Promise<IMSReferenceSearchResult> {
  const terms = buildQueryTerms(context);

  if (terms.length === 0) {
    return {
      configured: false,
      note: "IMS reference not configured.",
      query: "",
      references: [],
    };
  }

  const documents = await listIMSDocuments();
  const indexedDocuments = documents.filter((document) => document.status === "indexed");

  if (indexedDocuments.length === 0) {
    return {
      configured: false,
      note: "IMS reference not configured.",
      query: terms.join(" "),
      references: [],
    };
  }

  const chunks = await searchIMSChunks(terms.join(" "), limit * 3);
  const documentMap = new Map(indexedDocuments.map((document) => [document.id, document] as const));
  const hits = chunks
    .map((chunk) => {
      const document = documentMap.get(chunk.document_id);

      if (!document) {
        return null;
      }

      const scored = scoreChunk(chunk, terms, document.title);

      if (scored.score <= 0) {
        return null;
      }

      return chunkToUsage(chunk, document.title, scored.score, terms, scored.hits);
    })
    .filter((item): item is IMSReferenceSearchHit => Boolean(item))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  if (hits.length === 0) {
    return {
      configured: true,
      note: "No relevant IMS reference found.",
      query: terms.join(" "),
      references: [],
    };
  }

  return {
    configured: true,
    note: "Relevant IMS reference guidance found.",
    query: terms.join(" "),
    references: hits,
  };
}

export function buildIMSQueryFromContext(context: IMSReferenceSearchContext) {
  const terms = buildQueryTerms(context);
  return terms.join(" ");
}

export function formatIMSReferencePromptSection(
  references: IMSReferenceUsage[],
  note: string | null,
): string {
  const lines: string[] = [
    "IMS reference guidance (controlled reference material; not case evidence):",
    note ? note : "No IMS reference note available.",
  ];

  if (references.length === 0) {
    lines.push("No relevant IMS reference found.");
    return lines.join("\n");
  }

  for (const reference of references) {
    lines.push("");
    lines.push(`- ${reference.document_title}`);
    lines.push(`  source: ${reference.source_path}`);
    lines.push(`  chunk: ${reference.chunk_id}`);
    lines.push(`  note: ${reference.relevance_note}`);
    lines.push(`  snippet: ${reference.snippet}`);
  }

  return lines.join("\n");
}

export async function getIMSStatusSnapshot() {
  const [documents, indexRuns] = await Promise.all([listIMSDocuments(), listIMSIndexRuns()]);

  const indexedDocuments = documents.filter((document) => document.status === "indexed");
  const latestIndexRun = indexRuns[0] ?? null;

  return {
    configured: indexedDocuments.length > 0 || indexRuns.length > 0,
    documents,
    indexedDocuments,
    indexRuns,
    latestIndexRun,
    note:
      indexedDocuments.length > 0 || indexRuns.length > 0
        ? "IMS reference library is available."
        : "IMS reference not configured.",
  };
}
