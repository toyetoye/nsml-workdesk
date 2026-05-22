import type {
  CorrespondenceMessageRow,
  CorrespondenceThreadRow,
  EvidenceRow,
} from "@/lib/persistence/types";

export type ParsedAttachmentMetadata = {
  name: string;
  contentType: string;
  sizeBytes: number | null;
  contentId: string | null;
  disposition: string | null;
};

export type ParsedEmailMetadata = {
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  sentAtIso: string;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  bodyText: string;
  bodyHtmlText: string | null;
  attachments: ParsedAttachmentMetadata[];
};

export type EmailIngestionOutcome = {
  evidenceRow: EvidenceRow;
  threadRow: CorrespondenceThreadRow | null;
  messageRow: CorrespondenceMessageRow | null;
  parseStatus: string;
  parseError: string | null;
  supported: boolean;
  storageAvailable: boolean;
  note: string;
};
