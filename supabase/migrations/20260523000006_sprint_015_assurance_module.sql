create table if not exists public.assurance_signals (
  assurance_signal_id text primary key,
  date_time timestamptz not null,
  signal_title text not null,
  signal_type text not null,
  source_type text not null,
  source_name_optional text,
  audience text not null,
  related_vessel_optional text,
  related_department text not null,
  summary text not null,
  exact_comment_optional text,
  evidence_level text not null,
  confidence text not null,
  operational_risk text not null,
  reputational_risk text not null,
  governance_risk text not null,
  required_action text not null,
  action_owner text not null,
  due_date date,
  status text not null,
  evidence_links text[] not null default '{}',
  notes text not null default '',
  linked_case_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assurance_signals_date_time_idx
  on public.assurance_signals using btree (date_time desc);

create index if not exists assurance_signals_status_idx
  on public.assurance_signals using btree (status);

create index if not exists assurance_signals_linked_case_id_idx
  on public.assurance_signals using btree (linked_case_id);

alter table public.assurance_signals enable row level security;

create table if not exists public.vessel_support_items (
  support_item_id text primary key,
  vessel text not null,
  issue_title text not null,
  issue_description text not null,
  date_raised date not null,
  raised_by text not null,
  category text not null,
  priority text not null,
  risk_level text not null,
  superintendent_owner text not null,
  vessel_owner text not null,
  office_support_required text not null,
  current_status text not null,
  blocker_type text not null,
  last_action_taken text not null,
  last_contact_date date,
  next_action text not null,
  due_date date,
  close_out_evidence text not null,
  status text not null,
  evidence_links text[] not null default '{}',
  linked_case_id text,
  source_signal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vessel_support_items_vessel_idx
  on public.vessel_support_items using btree (vessel);

create index if not exists vessel_support_items_status_idx
  on public.vessel_support_items using btree (status);

create index if not exists vessel_support_items_linked_case_id_idx
  on public.vessel_support_items using btree (linked_case_id);

create index if not exists vessel_support_items_source_signal_id_idx
  on public.vessel_support_items using btree (source_signal_id);

alter table public.vessel_support_items enable row level security;

create table if not exists public.vessel_engagement_logs (
  engagement_log_id text primary key,
  vessel text not null,
  date_time timestamptz not null,
  engagement_type text not null,
  attendees text[] not null default '{}',
  topics_discussed text[] not null default '{}',
  actions_agreed text[] not null default '{}',
  owner text not null,
  due_date date,
  follow_up_required boolean not null default false,
  evidence_link text not null default '',
  linked_case_id text,
  linked_signal_id text,
  linked_support_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vessel_engagement_logs_date_time_idx
  on public.vessel_engagement_logs using btree (date_time desc);

create index if not exists vessel_engagement_logs_vessel_idx
  on public.vessel_engagement_logs using btree (vessel);

create index if not exists vessel_engagement_logs_linked_case_id_idx
  on public.vessel_engagement_logs using btree (linked_case_id);

alter table public.vessel_engagement_logs enable row level security;
