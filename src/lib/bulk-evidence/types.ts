import type { ImportWorkspaceAssignment } from "@/lib/mock-data";

export type BulkEvidenceBatchMode =
  | "selected-eml-files"
  | "zip-of-emls"
  | "pst-preservation"
  | "manual-email-fallback";

export type BulkEvidenceBatchStatus =
  | "staged"
  | "processing"
  | "completed"
  | "completed_with_warnings"
  | "failed";

export type BulkEvidenceItemStatus = "parsed" | "evidence_only" | "skipped" | "failed" | "unsupported";

export type BulkEvidenceSourceKind = "zip" | "eml" | "pst" | "document" | "unsupported";

export type BulkEvidenceBatchSummary = {
  totalFiles: number;
  emlFilesFound: number;
  parsedSuccessfully: number;
  evidenceOnly: number;
  skipped: number;
  failed: number;
  unsupported: number;
  warnings: number;
};

export type BulkEvidenceLinkTargets = {
  caseId?: string | null;
  assuranceSignalId?: string | null;
  vesselSupportItemId?: string | null;
};

export type BulkEvidenceIntakeRequest = {
  files: File[];
  batchMode: BulkEvidenceBatchMode;
  workspaceAssignment: ImportWorkspaceAssignment;
  sourceLabel: string;
  notes?: string;
  linkedCaseId?: string | null;
  linkedAssuranceSignalId?: string | null;
  linkedVesselSupportItemId?: string | null;
};

export type BulkEvidenceBatchOutcome = {
  batchId: string;
  summary: BulkEvidenceBatchSummary;
  batchStatus: BulkEvidenceBatchStatus;
  note: string;
  warnings: string[];
  items?: Array<{
    fileName: string;
    sourceKind: BulkEvidenceSourceKind;
    status: BulkEvidenceItemStatus;
    note: string;
    sourcePathInArchive: string | null;
  }>;
};
