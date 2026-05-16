-- Step 8I.1: Project document upload foundation

create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  storage_bucket text default 'project-documents',
  extracted_text text,
  uploaded_at timestamptz default now()
);

create index if not exists idx_project_documents_project_id
on project_documents(project_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 52428800)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

-- Dev policies. We will lock this down after auth is added.
drop policy if exists "Allow project document uploads" on storage.objects;
drop policy if exists "Allow project document reads" on storage.objects;
drop policy if exists "Allow project document deletes" on storage.objects;

create policy "Allow project document uploads"
on storage.objects for insert
with check (bucket_id = 'project-documents');

create policy "Allow project document reads"
on storage.objects for select
using (bucket_id = 'project-documents');

create policy "Allow project document deletes"
on storage.objects for delete
using (bucket_id = 'project-documents');
