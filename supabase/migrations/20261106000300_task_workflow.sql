-- Status workflow: the transition table from the spec and the only way to change a status.

-- The spec's table as data. "assignee" means the executor the task is assigned to.
create table private.task_transitions (
  from_status public.task_status not null,
  to_status public.task_status not null,
  actor text not null check (actor in ('manager', 'assignee')),
  comment_required boolean not null default false,
  primary key (from_status, to_status)
);

insert into private.task_transitions (from_status, to_status, actor, comment_required) values
  ('new', 'in_progress', 'assignee', false),
  ('in_progress', 'in_review', 'assignee', false),
  ('in_review', 'accepted', 'manager', false),
  ('in_review', 'rework', 'manager', true),
  ('rework', 'in_progress', 'assignee', false);

revoke all on private.task_transitions from public, authenticated;

-- Single place that answers "what may this user do with a task in this status".
create function private.transitions_for(
  p_status public.task_status,
  p_assignee_id uuid
)
returns table (to_status public.task_status, comment_required boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select tr.to_status, tr.comment_required
  from private.task_transitions tr
  join public.profiles me on me.id = auth.uid()
  where tr.from_status = p_status
    and (
      (tr.actor = 'manager' and me.role = 'manager')
      or (tr.actor = 'assignee' and me.role = 'executor' and me.id = p_assignee_id)
    );
$$;

revoke all on function private.transitions_for(public.task_status, uuid) from public;

-- Data checks that a foreign key cannot express.
create function private.validate_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();

    -- An accepted task is final: its data can no longer be edited.
    if old.status = 'accepted'
      and (new.title, new.description, new.object_id, new.assignee_id)
        is distinct from (old.title, old.description, old.object_id, old.assignee_id)
    then
      raise exception 'task_locked';
    end if;
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = new.assignee_id and p.role = 'executor'
  ) then
    raise exception 'assignee_must_be_executor';
  end if;

  if not exists (
    select 1 from public.objects o where o.id = new.object_id and o.deleted_at is null
  ) then
    raise exception 'object_not_found';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_task() from public;

create trigger tasks_validate
  before insert or update on public.tasks
  for each row execute function private.validate_task();

-- Creating a task is the first history record ("— -> new").
create function private.log_task_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, changed_at)
  values (new.id, null, 'new', new.author_id, new.created_at);

  return new;
end;
$$;

revoke all on function private.log_task_creation() from public;

create trigger tasks_log_creation
  after insert on public.tasks
  for each row execute function private.log_task_creation();

-- Which actions to show in the UI: buttons come from the same rules the database enforces.
create function public.get_available_transitions(p_task_id uuid)
returns table (to_status public.task_status, comment_required boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select tr.to_status, tr.comment_required
  from public.tasks t
  cross join lateral private.transitions_for(t.status, t.assignee_id) tr
  where t.id = p_task_id
    and t.deleted_at is null;
$$;

-- The only way to change a status. SECURITY DEFINER is what lets it write columns and a
-- table the caller has no rights to, so every check below is mandatory.
create function public.change_task_status(
  p_task_id uuid,
  p_new_status public.task_status,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks%rowtype;
  v_comment text := nullif(btrim(p_comment), '');
  v_comment_required boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- FOR UPDATE holds the row until commit: of two simultaneous clicks, the second one
  -- waits, then sees the new status and fails the transition check.
  select * into v_task
  from public.tasks t
  where t.id = p_task_id and t.deleted_at is null
  for update;

  -- Someone else's task looks exactly like a missing one, so its existence does not leak.
  if not found or not (
    v_task.assignee_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  ) then
    raise exception 'task_not_found';
  end if;

  select tr.comment_required into v_comment_required
  from private.transitions_for(v_task.status, v_task.assignee_id) tr
  where tr.to_status = p_new_status;

  if not found then
    raise exception 'transition_forbidden';
  end if;

  if v_comment_required and v_comment is null then
    raise exception 'comment_required';
  end if;

  update public.tasks set status = p_new_status where id = p_task_id;

  insert into public.task_status_history (task_id, from_status, to_status, changed_by, comment)
  values (p_task_id, v_task.status, p_new_status, auth.uid(), v_comment);
end;
$$;

-- Soft delete: the task disappears from every list, while the row and its history remain.
create function public.delete_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_manager() then
    raise exception 'forbidden';
  end if;

  update public.tasks set deleted_at = now()
  where id = p_task_id and deleted_at is null;

  if not found then
    raise exception 'task_not_found';
  end if;
end;
$$;

create function public.delete_object(p_object_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_manager() then
    raise exception 'forbidden';
  end if;

  -- Protects from losing active work by accident.
  if exists (
    select 1 from public.tasks t where t.object_id = p_object_id and t.deleted_at is null
  ) then
    raise exception 'object_has_tasks';
  end if;

  update public.objects set deleted_at = now()
  where id = p_object_id and deleted_at is null;

  if not found then
    raise exception 'object_not_found';
  end if;
end;
$$;

-- New functions are executable by PUBLIC by default: close that, allow signed-in users only.
revoke all on function public.get_available_transitions(uuid) from public, anon, service_role;
revoke all on function public.change_task_status(uuid, public.task_status, text)
  from public, anon, service_role;
revoke all on function public.delete_task(uuid) from public, anon, service_role;
revoke all on function public.delete_object(uuid) from public, anon, service_role;

grant execute on function public.get_available_transitions(uuid) to authenticated;
grant execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.delete_object(uuid) to authenticated;
