-- Staff OS database foundation

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  decision_question text not null,
  status text default 'idea',
  confidence text default 'early',
  created_at timestamptz default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  system_prompt text,
  status text default 'core',
  created_at timestamptz default now()
);

create table if not exists project_agents (
  project_id uuid references projects(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,
  primary key (project_id, agent_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  title text not null,
  description text,
  status text default 'to_investigate',
  priority text default 'medium',
  confidence text default 'early',
  created_at timestamptz default now()
);

create table if not exists agent_outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  summary text,
  output_json jsonb,
  confidence text,
  created_at timestamptz default now()
);

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  claim text not null,
  source_url text,
  source_type text,
  reliability text default 'medium',
  notes text,
  used_in_memo boolean default false,
  created_at timestamptz default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  decision_question text not null,
  recommendation text,
  rationale text,
  risks text,
  next_actions text,
  created_at timestamptz default now()
);
