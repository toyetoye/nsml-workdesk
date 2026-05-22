import type { EmailParseStatus } from "@/lib/mock-data";

export type EmailEvidenceCandidate = {
  sourceType?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  type?: string | null;
};

export function isEmlEvidenceCandidate(input: EmailEvidenceCandidate) {
  const filename = input.originalFilename?.trim().toLowerCase() ?? "";
  const mimeType = input.mimeType?.trim().toLowerCase() ?? "";
  const sourceType = input.sourceType?.trim().toLowerCase() ?? "";
  const evidenceType = input.type?.trim().toLowerCase() ?? "";

  return (
    sourceType === "eml-placeholder" ||
    evidenceType === "eml-placeholder" ||
    mimeType === "message/rfc822" ||
    filename.endsWith(".eml") ||
    filename.endsWith(".emlx")
  );
}

export function deriveInitialEvidenceParseStatus(input: EmailEvidenceCandidate): EmailParseStatus {
  return isEmlEvidenceCandidate(input) ? "not parsed" : "unsupported";
}

export function formatParseStatusLabel(status: EmailParseStatus) {
  switch (status) {
    case "parsing":
      return "Parsing";
    case "parsed":
      return "Parsed";
    case "failed":
      return "Failed";
    case "unsupported":
      return "Unsupported";
    case "not parsed":
    default:
      return "Not parsed";
  }
}
