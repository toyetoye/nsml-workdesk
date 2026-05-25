export type IMSReferenceDocumentStatus = "indexed" | "skipped" | "failed";

export type IMSReferenceChunkStatus = "indexed" | "skipped" | "failed";

export type IMSIndexRunStatus = "running" | "completed" | "completed_with_warnings" | "failed";

export type IMSReferenceDocumentRow = {
  id: string;
  title: string;
  source_path: string;
  source_type: string;
  version_label: string;
  effective_date_optional: string | null;
  status: IMSReferenceDocumentStatus;
  indexed_at: string;
  checksum_optional: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type IMSReferenceChunkRow = {
  id: string;
  document_id: string;
  source_path: string;
  heading_optional: string | null;
  chunk_index: number;
  text: string;
  token_estimate: number;
  keywords_optional: string[];
  status: IMSReferenceChunkStatus;
  created_at: string;
  updated_at: string;
};

export type IMSIndexRunRow = {
  id: string;
  source_label: string;
  status: IMSIndexRunStatus;
  total_files: number;
  indexed_files: number;
  skipped_files: number;
  failed_files: number;
  warnings: string[];
  started_at: string;
  completed_at: string | null;
};

export type IMSReferenceUsage = {
  document_title: string;
  source_path: string;
  chunk_id: string;
  snippet: string;
  relevance_note: string;
};

export type IMSReferenceSearchHit = IMSReferenceUsage & {
  document_id: string;
  heading_optional: string | null;
  chunk_index: number;
  token_estimate: number;
  score: number;
};

export type IMSReferenceSearchContext = {
  sourceType: string;
  sourceLabel: string;
  sourceSnapshot: Record<string, unknown>;
  extraTerms?: string[];
};

export type IMSReferenceSearchResult = {
  configured: boolean;
  note: string;
  query: string;
  references: IMSReferenceSearchHit[];
};

export type IMSReferenceDocumentInput = Partial<IMSReferenceDocumentRow> & {
  id?: string;
  status?: IMSReferenceDocumentStatus;
};

export type IMSReferenceChunkInput = Partial<IMSReferenceChunkRow> & {
  id?: string;
  status?: IMSReferenceChunkStatus;
  keywords_optional?: string[];
};

export type IMSIndexRunInput = Partial<IMSIndexRunRow> & {
  id?: string;
  status?: IMSIndexRunStatus;
  warnings?: string[];
};
