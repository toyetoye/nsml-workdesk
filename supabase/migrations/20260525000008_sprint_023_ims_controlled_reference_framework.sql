create table if not exists public.ims_reference_documents (
  id text primary key,
  title text not null,
  source_path text not null,
  source_type text not null,
  version_label text not null,
  effective_date_optional date,
  status text not null,
  indexed_at timestamptz not null default now(),
  checksum_optional text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ims_reference_documents_status_idx
  on public.ims_reference_documents using btree (status);

create index if not exists ims_reference_documents_indexed_at_idx
  on public.ims_reference_documents using btree (indexed_at desc);

create index if not exists ims_reference_documents_source_path_idx
  on public.ims_reference_documents using btree (source_path);

alter table public.ims_reference_documents enable row level security;

create table if not exists public.ims_reference_chunks (
  id text primary key,
  document_id text not null references public.ims_reference_documents (id) on delete cascade,
  source_path text not null,
  heading_optional text,
  chunk_index integer not null default 0,
  text text not null,
  token_estimate integer not null default 0,
  keywords_optional text[] not null default '{}',
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ims_reference_chunks_document_id_idx
  on public.ims_reference_chunks using btree (document_id);

create index if not exists ims_reference_chunks_status_idx
  on public.ims_reference_chunks using btree (status);

create index if not exists ims_reference_chunks_source_path_idx
  on public.ims_reference_chunks using btree (source_path);

create index if not exists ims_reference_chunks_chunk_index_idx
  on public.ims_reference_chunks using btree (chunk_index);

alter table public.ims_reference_chunks enable row level security;

create table if not exists public.ims_index_runs (
  id text primary key,
  source_label text not null,
  status text not null,
  total_files integer not null default 0,
  indexed_files integer not null default 0,
  skipped_files integer not null default 0,
  failed_files integer not null default 0,
  warnings text[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ims_index_runs_status_idx
  on public.ims_index_runs using btree (status);

create index if not exists ims_index_runs_started_at_idx
  on public.ims_index_runs using btree (started_at desc);

alter table public.ims_index_runs enable row level security;
