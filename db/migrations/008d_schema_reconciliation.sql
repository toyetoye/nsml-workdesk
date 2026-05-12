-- Step 8D: Schema/code reconciliation
-- Safe additive migration. Does not delete existing data.

create extension if not exists "pgcrypto";

-- TASKS: align with current app actions/components
alter table tasks add column if not exists assigned_agent text;
alter table tasks add column if not exists evidence_count integer default 0;
alter table tasks add column if not exists updated_at timestamptz default now();

-- AGENT OUTPUTS: support both old and newer code paths
alter table agent_outputs add column if not exists agent_name text;
alter table agent_outputs add column if not exists output text;
alter table agent_outputs add column if not exists output_type text default 'analysis';
alter table agent_outputs add column if not exists task_title text;
alter table agent_outputs add column if not exists updated_at timestamptz default now();

-- EVIDENCE ITEMS: support simple source field used by UI/actions
alter table evidence_items add column if not exists source text;
alter table evidence_items add column if not exists confidence text default 'medium';
alter table evidence_items add column if not exists agent_name text;
alter table evidence_items add column if not exists updated_at timestamptz default now();

-- DECISIONS / MEMOS
alter table decisions add column if not exists memo_title text;
alter table decisions add column if not exists memo_body text;
alter table decisions add column if not exists decision_status text default 'draft';
alter table decisions add column if not exists updated_at timestamptz default now();

-- MEMORY SYSTEM
create table if not exists memory_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  memory_type text default 'project',
  title text not null,
  content text not null,
  source_type text,
  source_id uuid,
  importance text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_agent_outputs_project_id on agent_outputs(project_id);
create index if not exists idx_evidence_items_project_id on evidence_items(project_id);
create index if not exists idx_decisions_project_id on decisions(project_id);
create index if not exists idx_memory_items_project_id on memory_items(project_id);
