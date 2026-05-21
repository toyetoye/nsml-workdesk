alter table public.evidence_items
  alter column case_id drop not null;

alter table public.evidence_items
  add column if not exists storage_state text not null default 'metadata-only',
  add column if not exists source_type text not null default 'document-placeholder',
  add column if not exists workspace_assignment text not null default 'Import/Staging',
  add column if not exists linked_intake_item_ref text,
  add column if not exists linked_case_ref text,
  add column if not exists original_filename text,
  add column if not exists file_size_bytes bigint,
  add column if not exists uploaded_at timestamptz;

create index if not exists evidence_items_storage_state_idx on public.evidence_items (storage_state);
create index if not exists evidence_items_workspace_assignment_idx on public.evidence_items (workspace_assignment);

insert into storage.buckets (id, name, public)
values ('nsml-evidence-files', 'nsml-evidence-files', false)
on conflict (id) do update set
  name = excluded.name,
  public = false;
