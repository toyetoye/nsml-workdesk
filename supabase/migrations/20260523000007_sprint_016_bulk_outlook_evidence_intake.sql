create table if not exists public.bulk_evidence_batches (
  batch_id text primary key,
  batch_mode text not null,
  workspace_assignment text not null,
  source_label text not null,
  status text not null,
  total_files integer not null default 0,
  eml_files_found integer not null default 0,
  parsed_successfully integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  unsupported integer not null default 0,
  warnings integer not null default 0,
  notes text not null default '',
  linked_case_id text,
  linked_assurance_signal_id text,
  linked_support_item_id text,
  original_archive_evidence_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bulk_evidence_batches_status_idx
  on public.bulk_evidence_batches using btree (status);

create index if not exists bulk_evidence_batches_workspace_assignment_idx
  on public.bulk_evidence_batches using btree (workspace_assignment);

create index if not exists bulk_evidence_batches_updated_at_idx
  on public.bulk_evidence_batches using btree (updated_at desc);

alter table public.bulk_evidence_batches enable row level security;

create table if not exists public.bulk_evidence_batch_items (
  batch_item_id text primary key,
  batch_id text not null references public.bulk_evidence_batches (batch_id) on delete cascade,
  source_kind text not null,
  file_name text not null,
  source_path_in_archive text,
  file_size_bytes bigint,
  status text not null,
  note text not null default '',
  evidence_id text,
  thread_id text,
  message_id text,
  parse_status text,
  parse_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bulk_evidence_batch_items_batch_id_idx
  on public.bulk_evidence_batch_items using btree (batch_id);

create index if not exists bulk_evidence_batch_items_status_idx
  on public.bulk_evidence_batch_items using btree (status);

create index if not exists bulk_evidence_batch_items_created_at_idx
  on public.bulk_evidence_batch_items using btree (created_at desc);

alter table public.bulk_evidence_batch_items enable row level security;
