import type { TaskStatus } from "@/shared/supabase/database.types";

type StatusColor = "default" | "primary" | "warning" | "success" | "error";

export const TASK_STATUSES: TaskStatus[] = [
  "new",
  "in_progress",
  "in_review",
  "rework",
  "accepted",
];

export const STATUS_META: Record<TaskStatus, { label: string; color: StatusColor }> = {
  new: { label: "Новая", color: "default" },
  in_progress: { label: "В работе", color: "primary" },
  in_review: { label: "На проверке", color: "warning" },
  rework: { label: "На доработке", color: "error" },
  accepted: { label: "Принята", color: "success" },
};

// Labels only. Which actions are available is decided by the database.
export const ACTION_META: Record<
  TaskStatus,
  { label: string; color: "primary" | "success" | "error" }
> = {
  new: { label: "Создать", color: "primary" },
  in_progress: { label: "Взять в работу", color: "primary" },
  in_review: { label: "Отправить на проверку", color: "primary" },
  rework: { label: "Вернуть на доработку", color: "error" },
  accepted: { label: "Принять", color: "success" },
};

export function isTaskStatus(value: string | undefined): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}
