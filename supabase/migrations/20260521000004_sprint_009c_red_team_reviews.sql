create table if not exists public.draft_red_team_reviews (
  review_id text primary key,
  draft_id text not null unique references public.draft_responses_placeholder (draft_id) on delete cascade,
  source_type text not null,
  source_label text not null,
  source_ids_reviewed text[] not null default '{}',
  source_snapshot jsonb not null default '{}'::jsonb,
  verdict text not null,
  readiness_status text not null,
  summary text not null,
  unsupported_claims text[] not null default '{}',
  liability_risks text[] not null default '{}',
  technical_risks text[] not null default '{}',
  tone_risks text[] not null default '{}',
  missing_information text[] not null default '{}',
  evidence_gaps text[] not null default '{}',
  confidentiality_concerns text[] not null default '{}',
  recommended_revisions text[] not null default '{}',
  required_user_checks text[] not null default '{}',
  safe_to_copy boolean not null default false,
  confidence numeric(4, 3) not null default 0,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists draft_red_team_reviews_draft_id_idx
  on public.draft_red_team_reviews using btree (draft_id);

create index if not exists draft_red_team_reviews_verdict_idx
  on public.draft_red_team_reviews using btree (verdict);

create index if not exists draft_red_team_reviews_readiness_status_idx
  on public.draft_red_team_reviews using btree (readiness_status);

alter table public.draft_responses_placeholder
  add column if not exists review_id text,
  add column if not exists source_ids_reviewed text[] not null default '{}',
  add column if not exists verdict text,
  add column if not exists readiness_status text,
  add column if not exists review_summary text,
  add column if not exists unsupported_claims text[] not null default '{}',
  add column if not exists liability_risks text[] not null default '{}',
  add column if not exists technical_risks text[] not null default '{}',
  add column if not exists tone_risks text[] not null default '{}',
  add column if not exists review_missing_information text[] not null default '{}',
  add column if not exists evidence_gaps text[] not null default '{}',
  add column if not exists confidentiality_concerns text[] not null default '{}',
  add column if not exists recommended_revisions text[] not null default '{}',
  add column if not exists required_user_checks text[] not null default '{}',
  add column if not exists safe_to_copy boolean not null default false,
  add column if not exists red_team_confidence numeric(4, 3),
  add column if not exists reviewed_at timestamptz,
  add column if not exists red_team_updated_at timestamptz;

create index if not exists draft_responses_placeholder_review_id_idx
  on public.draft_responses_placeholder using btree (review_id);

create index if not exists draft_responses_placeholder_verdict_idx
  on public.draft_responses_placeholder using btree (verdict);

create index if not exists draft_responses_placeholder_readiness_status_idx
  on public.draft_responses_placeholder using btree (readiness_status);
