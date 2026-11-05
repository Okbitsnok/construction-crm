export type ActionResult = { ok: true } | { ok: false; message: string };

const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Сессия истекла, войдите снова",
  forbidden: "Недостаточно прав",
  task_not_found: "Задача не найдена",
  object_not_found: "Объект не найден",
  transition_forbidden: "Это действие сейчас недоступно: возможно, статус задачи уже изменился",
  comment_required: "Укажите комментарий",
  task_locked: "Принятую задачу нельзя редактировать",
  assignee_must_be_executor: "Исполнителем можно назначить только сотрудника с ролью исполнителя",
  object_has_tasks: "Сначала удалите задачи этого объекта",
};

const POSTGRES_CODE_MESSAGES: Record<string, string> = {
  "42501": "Недостаточно прав",
  "23514": "Проверьте заполнение полей",
};

type DatabaseError = {
  message: string;
  code?: string;
};

export function toActionError({ message, code }: DatabaseError): ActionResult {
  const text =
    DATABASE_ERROR_MESSAGES[message] ??
    (code ? POSTGRES_CODE_MESSAGES[code] : undefined) ??
    "Не удалось выполнить действие. Попробуйте ещё раз";

  return { ok: false, message: text };
}

// RLS does not raise an error for rows it hides: an update simply affects nothing.
export const NOT_FOUND_OR_FORBIDDEN: ActionResult = {
  ok: false,
  message: "Запись не найдена или недостаточно прав",
};
