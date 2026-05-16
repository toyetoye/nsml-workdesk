-- Step 8J: Activity feed foundation

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  event_type text not null,
  actor text,
  title text not null,
  detail text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_activity_events_project_id
on activity_events(project_id);

create index if not exists idx_activity_events_created_at
on activity_events(created_at desc);
