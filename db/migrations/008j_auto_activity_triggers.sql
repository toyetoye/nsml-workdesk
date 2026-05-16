-- Step 8J.6: Auto-log operational activity from core tables

create or replace function log_staff_os_activity()
returns trigger as $$
declare
  event_project_id uuid;
  event_type text;
  event_actor text;
  event_title text;
  event_detail text;
begin
  if tg_table_name = 'tasks' then
    event_project_id := new.project_id;
    event_type := 'task_created';
    event_actor := coalesce(new.assigned_agent, 'Staff OS');
    event_title := 'Task created';
    event_detail := new.title;

  elsif tg_table_name = 'agent_outputs' then
    event_project_id := new.project_id;
    event_type := 'agent_run';
    event_actor := coalesce(new.agent_name, 'AI Staff');
    event_title := coalesce(new.agent_name, 'AI Staff') || ' completed an output';
    event_detail := coalesce(new.summary, new.task_title, 'Agent output saved.');

  elsif tg_table_name = 'evidence_items' then
    event_project_id := new.project_id;
    event_type := 'evidence_added';
    event_actor := coalesce(new.agent_name, 'Evidence System');
    event_title := 'Evidence added';
    event_detail := new.claim;

  elsif tg_table_name = 'decisions' then
    event_project_id := new.project_id;
    event_type := 'memo_generated';
    event_actor := 'Executive Writer';
    event_title := coalesce(new.memo_title, 'Executive memo generated');
    event_detail := coalesce(new.recommendation, new.decision_question);

  elsif tg_table_name = 'memory_items' then
    event_project_id := new.project_id;
    event_type := 'memory_saved';
    event_actor := 'Memory System';
    event_title := 'Memory saved';
    event_detail := new.title;

  elsif tg_table_name = 'project_documents' then
    event_project_id := new.project_id;
    event_type := 'document_uploaded';
    event_actor := 'Document Intake';
    event_title := 'Document uploaded';
    event_detail := new.file_name;

  else
    return new;
  end if;

  insert into activity_events (
    project_id,
    event_type,
    actor,
    title,
    detail,
    metadata
  )
  values (
    event_project_id,
    event_type,
    event_actor,
    event_title,
    event_detail,
    to_jsonb(new)
  );

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_activity_tasks on tasks;
create trigger trg_activity_tasks
after insert on tasks
for each row execute function log_staff_os_activity();

drop trigger if exists trg_activity_agent_outputs on agent_outputs;
create trigger trg_activity_agent_outputs
after insert on agent_outputs
for each row execute function log_staff_os_activity();

drop trigger if exists trg_activity_evidence_items on evidence_items;
create trigger trg_activity_evidence_items
after insert on evidence_items
for each row execute function log_staff_os_activity();

drop trigger if exists trg_activity_decisions on decisions;
create trigger trg_activity_decisions
after insert on decisions
for each row execute function log_staff_os_activity();

drop trigger if exists trg_activity_memory_items on memory_items;
create trigger trg_activity_memory_items
after insert on memory_items
for each row execute function log_staff_os_activity();

drop trigger if exists trg_activity_project_documents on project_documents;
create trigger trg_activity_project_documents
after insert on project_documents
for each row execute function log_staff_os_activity();
