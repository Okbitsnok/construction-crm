import { createClient } from "@/shared/supabase/server";
import type { TaskStatus } from "@/shared/supabase/database.types";

const TASK_LIST_COLUMNS = `
  id, title, status, created_at,
  object:objects!tasks_object_id_fkey(id, name),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name)
`;

type TaskFilter = {
  status?: TaskStatus;
  objectId?: string;
};

// No role checks here on purpose: RLS returns exactly the rows this user may see.
export async function getTasks({ status, objectId }: TaskFilter = {}) {
  const supabase = await createClient();
  let query = supabase.from("tasks").select(TASK_LIST_COLUMNS);

  if (status) {
    query = query.eq("status", status);
  }
  if (objectId) {
    query = query.eq("object_id", objectId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type TaskListItem = Awaited<ReturnType<typeof getTasks>>[number];

export async function getTaskDetails(taskId: string) {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select(
      `
      id, title, description, status, created_at, assignee_id,
      object:objects!tasks_object_id_fkey(id, name, address),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name),
      author:profiles!tasks_author_id_fkey(id, full_name)
    `
    )
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return null;
  }

  const [history, transitions] = await Promise.all([
    supabase
      .from("task_status_history")
      .select(
        `
        id, from_status, to_status, comment, changed_at,
        actor:profiles!task_status_history_changed_by_fkey(id, full_name)
      `
      )
      .eq("task_id", taskId)
      .order("changed_at", { ascending: false })
      .order("id", { ascending: false }),
    supabase.rpc("get_available_transitions", { p_task_id: taskId }),
  ]);

  if (history.error) {
    throw new Error(history.error.message);
  }
  if (transitions.error) {
    throw new Error(transitions.error.message);
  }

  return { task, history: history.data, transitions: transitions.data };
}

type TaskDetails = NonNullable<Awaited<ReturnType<typeof getTaskDetails>>>;

export type TaskData = TaskDetails["task"];
export type TaskHistoryItem = TaskDetails["history"][number];
export type TaskTransition = TaskDetails["transitions"][number];

export async function getExecutors() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "executor")
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type Executor = Awaited<ReturnType<typeof getExecutors>>[number];
