create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  slug text primary key,
  name text not null,
  kind text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  batch_id text primary key,
  source_type text not null,
  source_label text not null,
  received_at timestamptz not null,
  workspace_key text references public.workspaces(slug) on update cascade on delete set null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_items (
  intake_id text primary key,
  batch_id text references public.import_batches(batch_id) on update cascade on delete set null,
  subject_title text not null,
  source_type text not null,
  workspace_assignment text not null,
  status text not null,
  sender_source text not null,
  received_at timestamptz not null,
  body_content text not null,
  tags text[] not null default '{}'::text[],
  route_note text,
  created_from_label text,
  linked_case_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  case_id text primary key,
  title text not null,
  summary text not null,
  workspace_key text not null references public.workspaces(slug) on update cascade on delete restrict,
  workspace_label text not null,
  vessel_project text not null,
  owner text not null,
  status text not null,
  priority text not null,
  category text not null,
  opened_at timestamptz not null,
  age_label text not null,
  due_label text not null,
  waiting_on text not null,
  next_action text not null,
  risk_note text not null,
  decision_required text not null,
  tags text[] not null default '{}'::text[],
  source_intake_ref text,
  workspace_href text not null,
  linked_thread_ids text[] not null default '{}'::text[],
  linked_evidence_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.intake_items
  add constraint intake_items_linked_case_id_fkey
  foreign key (linked_case_id)
  references public.cases(case_id)
  on update cascade
  on delete set null;

create table if not exists public.evidence_items (
  evidence_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  title text not null,
  type text not null,
  source text not null,
  date text not null,
  description text not null,
  status text not null,
  storage_bucket text,
  storage_path text,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.correspondence_threads (
  thread_id text primary key,
  workspace_key text not null references public.workspaces(slug) on update cascade on delete restrict,
  case_id text references public.cases(case_id) on update cascade on delete set null,
  subject text not null,
  sender text not null,
  recipients text[] not null default '{}'::text[],
  cc text[] not null default '{}'::text[],
  date_time timestamptz not null,
  status text not null,
  vessel_project text not null,
  source_intake_item_id text references public.intake_items(intake_id) on update cascade on delete set null,
  linked_case_id text references public.cases(case_id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.correspondence_messages (
  message_id text primary key,
  thread_id text not null references public.correspondence_threads(thread_id) on update cascade on delete cascade,
  sender text not null,
  body text not null,
  timestamp timestamptz not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_evidence_links (
  link_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  evidence_id text not null references public.evidence_items(evidence_id) on update cascade on delete cascade,
  link_role text not null default 'primary',
  created_at timestamptz not null default now(),
  unique (case_id, evidence_id)
);

create table if not exists public.case_correspondence_links (
  link_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  thread_id text not null references public.correspondence_threads(thread_id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique (case_id, thread_id)
);

create table if not exists public.timeline_events (
  event_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  event_type text not null,
  title text not null,
  note text not null,
  happened_at timestamptz not null,
  tone text not null,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  decision_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  title text not null,
  status text not null,
  note text not null,
  decision_required text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.draft_responses_placeholder (
  draft_id text primary key,
  case_id text not null references public.cases(case_id) on update cascade on delete cascade,
  title text not null,
  status text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  audit_id text primary key,
  actor text,
  action text not null,
  object_type text not null,
  object_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_workspaces'
  ) then
    create trigger set_updated_at_workspaces
    before update on public.workspaces
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_import_batches'
  ) then
    create trigger set_updated_at_import_batches
    before update on public.import_batches
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_intake_items'
  ) then
    create trigger set_updated_at_intake_items
    before update on public.intake_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_cases'
  ) then
    create trigger set_updated_at_cases
    before update on public.cases
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_evidence_items'
  ) then
    create trigger set_updated_at_evidence_items
    before update on public.evidence_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_correspondence_threads'
  ) then
    create trigger set_updated_at_correspondence_threads
    before update on public.correspondence_threads
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_correspondence_messages'
  ) then
    create trigger set_updated_at_correspondence_messages
    before update on public.correspondence_messages
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_timeline_events'
  ) then
    create trigger set_updated_at_timeline_events
    before update on public.timeline_events
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_decisions'
  ) then
    create trigger set_updated_at_decisions
    before update on public.decisions
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_draft_responses_placeholder'
  ) then
    create trigger set_updated_at_draft_responses_placeholder
    before update on public.draft_responses_placeholder
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.import_batches enable row level security;
alter table public.intake_items enable row level security;
alter table public.cases enable row level security;
alter table public.evidence_items enable row level security;
alter table public.correspondence_threads enable row level security;
alter table public.correspondence_messages enable row level security;
alter table public.case_evidence_links enable row level security;
alter table public.case_correspondence_links enable row level security;
alter table public.timeline_events enable row level security;
alter table public.decisions enable row level security;
alter table public.draft_responses_placeholder enable row level security;
alter table public.audit_logs enable row level security;

create index if not exists import_batches_workspace_key_idx on public.import_batches (workspace_key);
create index if not exists intake_items_workspace_assignment_idx on public.intake_items (workspace_assignment);
create index if not exists intake_items_created_at_idx on public.intake_items (created_at desc);
create index if not exists cases_workspace_key_idx on public.cases (workspace_key);
create index if not exists cases_status_idx on public.cases (status);
create index if not exists evidence_items_case_id_idx on public.evidence_items (case_id);
create index if not exists correspondence_threads_case_id_idx on public.correspondence_threads (case_id);
create index if not exists correspondence_threads_workspace_key_idx on public.correspondence_threads (workspace_key);
create index if not exists correspondence_messages_thread_id_idx on public.correspondence_messages (thread_id, sort_order);
create index if not exists case_evidence_links_case_id_idx on public.case_evidence_links (case_id);
create index if not exists case_correspondence_links_case_id_idx on public.case_correspondence_links (case_id);
create index if not exists timeline_events_case_id_idx on public.timeline_events (case_id, happened_at);

insert into public.workspaces (slug, name, kind, description, sort_order)
values
  ('lng-portharcourt-ii', 'LNG PORTHARCOURT II', 'vessel', 'Vessel workspace for LNG PORTHARCOURT II.', 1),
  ('lpg-alfred-temile', 'LPG ALFRED TEMILE', 'vessel', 'Separate vessel workspace for LPG ALFRED TEMILE.', 2),
  ('lpg-alfred-temile-10', 'LPG ALFRED TEMILE 10', 'vessel', 'Dedicated AT10 vessel workspace.', 3),
  ('projects', 'Projects', 'project', 'Non-vessel initiative workspace.', 4),
  ('other', 'Other / General Issues', 'general', 'General workspace for unclassified matters.', 5)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();
