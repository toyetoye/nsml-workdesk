create table if not exists public.writing_style_profiles (
  profile_id text primary key,
  profile_name text not null,
  is_active boolean not null default true,
  default_greeting text not null default 'Hello,',
  default_closing text not null default 'Kind regards,',
  preferred_tone text not null default 'measured',
  preferred_brevity text not null default 'concise',
  use_kindly boolean not null default false,
  use_please_note boolean not null default true,
  technical_directness text not null default 'high',
  caution_level text not null default 'high',
  stakeholder_tone_notes jsonb not null default '{}'::jsonb,
  preferred_phrases text[] not null default '{}',
  phrases_to_avoid text[] not null default '{}',
  liability_sensitive_wording_rules text[] not null default '{}',
  draft_mode_guidance jsonb not null default '{}'::jsonb,
  persistence_state text not null default 'persisted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists writing_style_profiles_is_active_idx
  on public.writing_style_profiles using btree (is_active);

create index if not exists writing_style_profiles_updated_at_idx
  on public.writing_style_profiles using btree (updated_at desc);

alter table public.writing_style_profiles enable row level security;

insert into public.writing_style_profiles (
  profile_id,
  profile_name,
  is_active,
  default_greeting,
  default_closing,
  preferred_tone,
  preferred_brevity,
  use_kindly,
  use_please_note,
  technical_directness,
  caution_level,
  stakeholder_tone_notes,
  preferred_phrases,
  phrases_to_avoid,
  liability_sensitive_wording_rules,
  draft_mode_guidance
) values (
  'default',
  'NSML Writing Style',
  true,
  'Hello,',
  'Kind regards,',
  'measured',
  'concise',
  false,
  true,
  'high',
  'high',
  '{
    "vessel_captain_chief_engineer": "Be direct, operational, and plain. Keep instructions and questions short and unambiguous.",
    "owner_charterer": "Be measured, careful, and diplomatic. Separate confirmed facts from assumptions and avoid unnecessary certainty.",
    "class_surveyor": "Be precise, factual, and technically grounded. Use cautious wording and clearly identify what is confirmed versus still under review.",
    "vendor_procurement": "Be firm but polite. State what is required, what is missing, and any deadline or technical constraint clearly.",
    "management": "Be concise, structured, and decision-focused. Summarize the risk, the status, and the next action without over-explaining."
  }'::jsonb,
  array['For clarity', 'Based on the information currently available', 'Please confirm', 'We note that'],
  array['We guarantee', 'No issue', 'That is final', 'We accept liability', 'Class / owner / charterer confirmed'],
  array[
    'Do not admit fault or liability unless the source material explicitly supports it.',
    'Do not accept delay, deviation, unsafe approval, or responsibility without evidence.',
    'Separate confirmed facts from assumptions and next steps.',
    'Do not imply class, owner, or charterer approval unless the evidence says so.'
  ],
  '{
    "holding_statement": "Acknowledge receipt, state review is ongoing, and avoid firm conclusions.",
    "normal_technical_reply": "Answer directly with evidence-backed technical detail, a calm tone, and a clear next action.",
    "firm_but_polite": "Set boundaries clearly while keeping the tone courteous, professional, and restrained.",
    "management_summary": "Summarize the situation, the risk, and the decision point in a concise management-friendly format.",
    "vessel_instruction": "Be direct, operational, and unambiguous. Keep it practical for immediate shipboard action.",
    "vendor_clarification": "Ask precise clarification questions and list the missing information that is blocking the response.",
    "owner_charterer_sensitive": "Use extra caution, avoid liability admissions, and clearly separate facts from assumptions."
  }'::jsonb
) on conflict (profile_id) do nothing;
