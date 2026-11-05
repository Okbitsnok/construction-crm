"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/supabase/server";
import { NOT_FOUND_OR_FORBIDDEN, toActionError, type ActionResult } from "@/shared/actionResult";
import type { TaskStatus } from "@/shared/supabase/database.types";

export type TaskFormValues = {
  title: string;
  description: string;
  assigneeId: string;
};

export async function createTask(objectId: string, values: TaskFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title: values.title.trim(),
    description: values.description.trim(),
    assignee_id: values.assigneeId,
    object_id: objectId,
  });

  if (error) {
    return toActionError(error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTask(taskId: string, values: TaskFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: values.title.trim(),
      description: values.description.trim(),
      assignee_id: values.assigneeId,
    })
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    return toActionError(error);
  }
  if (!data) {
    return NOT_FOUND_OR_FORBIDDEN;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_task", { p_task_id: taskId });

  if (error) {
    return toActionError(error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  comment?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_task_status", {
    p_task_id: taskId,
    p_new_status: newStatus,
    p_comment: comment,
  });

  if (error) {
    return toActionError(error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
