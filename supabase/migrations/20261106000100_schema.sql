-- Domain model: people, construction sites ("objects"), tasks and their status history.

create type public.user_role as enum ('manager', 'executor');

create type public.task_status as enum ('new', 'in_progress', 'in_review', 'accepted', 'rework');

-- A row here is what grants access to the system: an auth user without a profile sees nothing.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 200),
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  object_id uuid not null references public.objects (id),
  assignee_id uuid not null references public.profiles (id),
  status public.task_status not null default 'new',
  author_id uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index tasks_object_id_idx on public.tasks (object_id) where deleted_at is null;
create index tasks_assignee_id_idx on public.tasks (assignee_id) where deleted_at is null;
create index tasks_status_idx on public.tasks (status) where deleted_at is null;

create table public.task_status_history (
  id bigint generated always as identity primary key,
  -- "restrict": a task row can never disappear together with its history.
  task_id uuid not null references public.tasks (id) on delete restrict,
  -- null means the task was just created ("— -> new").
  from_status public.task_status,
  to_status public.task_status not null,
  changed_by uuid not null references public.profiles (id),
  comment text check (char_length(comment) <= 2000),
  changed_at timestamptz not null default now(),
  constraint rework_requires_comment
    check (to_status <> 'rework' or char_length(btrim(coalesce(comment, ''))) > 0)
);

create index task_status_history_task_id_idx on public.task_status_history (task_id, changed_at);
