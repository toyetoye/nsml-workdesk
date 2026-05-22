alter table public.draft_responses_placeholder
  alter column case_id drop not null;

alter table public.draft_responses_placeholder
  add column if not exists source_type text not null default 'case',
  add column if not exists source_ids text[] not null default '{}'::text[],
  add column if not exists source_label text not null default '',
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists triage_audit_log_id text,
  add column if not exists triage_source_type text,
  add column if not exists triage_source_ids text[] not null default '{}'::text[],
  add column if not exists intended_recipient_placeholder text not null default '',
  add column if not exists subject_placeholder text not null default '',
  add column if not exists draft_body text not null default '',
  add column if not exists draft_purpose text not null default '',
  add column if not exists tone_mode text not null default 'normal_technical_reply',
  add column if not exists evidence_basis text not null default '',
  add column if not exists assumptions text[] not null default '{}'::text[],
  add column if not exists missing_information text[] not null default '{}'::text[],
  add column if not exists liability_cautions text[] not null default '{}'::text[],
  add column if not exists recommended_attachments text[] not null default '{}'::text[],
  add column if not exists confidence numeric not null default 0,
  add column if not exists must_be_red_teamed boolean not null default true,
  add column if not exists persistence_state text not null default 'persisted';
