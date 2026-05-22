alter table public.evidence_items
  add column if not exists parse_status text not null default 'not parsed',
  add column if not exists parse_error text,
  add column if not exists parsed_thread_id text,
  add column if not exists parsed_message_id text,
  add column if not exists parsed_at timestamptz;

alter table public.correspondence_threads
  add column if not exists source_evidence_id text references public.evidence_items(evidence_id) on update cascade on delete set null,
  add column if not exists parse_status text not null default 'not parsed',
  add column if not exists parse_error text,
  add column if not exists original_filename text,
  add column if not exists message_id_header text,
  add column if not exists in_reply_to text,
  add column if not exists "references" text[] not null default '{}'::text[],
  add column if not exists bcc text[] not null default '{}'::text[],
  add column if not exists body_text text,
  add column if not exists body_html_text text,
  add column if not exists attachment_metadata jsonb not null default '[]'::jsonb,
  add column if not exists parsed_at timestamptz;

alter table public.correspondence_messages
  add column if not exists recipients text[] not null default '{}'::text[],
  add column if not exists cc_recipients text[] not null default '{}'::text[],
  add column if not exists bcc_recipients text[] not null default '{}'::text[],
  add column if not exists subject text not null default '',
  add column if not exists message_id_header text,
  add column if not exists in_reply_to text,
  add column if not exists "references" text[] not null default '{}'::text[],
  add column if not exists body_text text not null default '',
  add column if not exists body_html_text text,
  add column if not exists attachment_metadata jsonb not null default '[]'::jsonb,
  add column if not exists source_evidence_id text references public.evidence_items(evidence_id) on update cascade on delete set null,
  add column if not exists parsed_at timestamptz;

create index if not exists evidence_items_parse_status_idx on public.evidence_items (parse_status);
create index if not exists evidence_items_parsed_thread_id_idx on public.evidence_items (parsed_thread_id);
create index if not exists correspondence_threads_source_evidence_id_idx on public.correspondence_threads (source_evidence_id);
create index if not exists correspondence_threads_parse_status_idx on public.correspondence_threads (parse_status);
create index if not exists correspondence_messages_source_evidence_id_idx on public.correspondence_messages (source_evidence_id);
