-- Who can read and write what. Two layers work together:
--   1. GRANT decides which operations and columns a role may touch at all.
--   2. RLS policies decide which rows.
-- RLS alone is not enough: it cannot protect individual columns.

-- Helpers live outside `public`, so they are not callable through the API.
create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- SECURITY DEFINER lets the helper read profiles without triggering profiles' own RLS
-- (otherwise the policy would call itself forever). The empty search_path stops anyone
-- from substituting a table or function with their own object of the same name.
create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

-- An executor only needs the names of people connected to his own tasks.
create function private.is_colleague_on_my_tasks(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.assignee_id = auth.uid()
      and t.deleted_at is null
      and t.author_id = p_profile_id
  ) or exists (
    select 1
    from public.task_status_history h
    join public.tasks t on t.id = h.task_id
    where t.assignee_id = auth.uid()
      and t.deleted_at is null
      and h.changed_by = p_profile_id
  );
$$;

revoke all on function private.is_manager() from public;
revoke all on function private.is_colleague_on_my_tasks(uuid) from public;
grant execute on function private.is_manager() to authenticated;
grant execute on function private.is_colleague_on_my_tasks(uuid) to authenticated;

-- Start from zero. The app uses neither anon nor service_role for data access.
revoke all on public.profiles, public.objects, public.tasks, public.task_status_history
  from public, anon, authenticated, service_role;

grant select (id, full_name, role) on public.profiles to authenticated;

grant select on public.objects to authenticated;
grant insert (name, address) on public.objects to authenticated;
grant update (name, address) on public.objects to authenticated;

-- status, author_id, created_at and deleted_at are deliberately missing:
-- the API cannot write them even when the row itself is allowed.
grant select on public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant update (title, description, object_id, assignee_id) on public.tasks to authenticated;

-- Read-only: rows are written only by database functions.
grant select on public.task_status_history to authenticated;

-- No DELETE grant on any table: deletion goes through delete_task / delete_object.

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_manager())
    or private.is_colleague_on_my_tasks(id)
  );

create policy tasks_select on public.tasks
  for select to authenticated
  using (
    deleted_at is null
    and ((select private.is_manager()) or assignee_id = (select auth.uid()))
  );

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check ((select private.is_manager()));

create policy tasks_update on public.tasks
  for update to authenticated
  using ((select private.is_manager()) and deleted_at is null)
  with check ((select private.is_manager()));

-- The subquery on tasks goes through tasks' own RLS, so an executor sees a site
-- only if at least one of HIS tasks is there.
create policy objects_select on public.objects
  for select to authenticated
  using (
    deleted_at is null
    and (
      (select private.is_manager())
      or exists (select 1 from public.tasks t where t.object_id = objects.id)
    )
  );

create policy objects_insert on public.objects
  for insert to authenticated
  with check ((select private.is_manager()));

create policy objects_update on public.objects
  for update to authenticated
  using ((select private.is_manager()) and deleted_at is null)
  with check ((select private.is_manager()));

-- History is visible exactly when its task is visible.
create policy history_select on public.task_status_history
  for select to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id));

-- Protection that holds even for privileged roles: history can only ever grow.
create function private.forbid_history_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'history_is_immutable';
end;
$$;

revoke all on function private.forbid_history_change() from public;

create trigger task_status_history_immutable
  before update or delete on public.task_status_history
  for each row execute function private.forbid_history_change();

create trigger task_status_history_no_truncate
  before truncate on public.task_status_history
  for each statement execute function private.forbid_history_change();
