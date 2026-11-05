// Attacks the deployed database the way an outsider would: with the public key and real logins,
// bypassing the UI. Every check must end with "blocked". Run after the seed: npm run security-check
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.TEST_USERS_PASSWORD;

if (!url || !key || !password) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_*, TEST_USERS_PASSWORD in .env.local");
}

const EMAILS = {
  manager: "manager@mini-crm.test",
  ivanov: "ivanov@mini-crm.test",
  petrov: "petrov@mini-crm.test",
};

type Client = SupabaseClient;

function newClient(): Client {
  return createClient(url as string, key as string, { auth: { persistSession: false } });
}

async function signedIn(email: string): Promise<{ client: Client; userId: string }> {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: password as string,
  });

  if (error || !data.user) {
    throw new Error(`Cannot sign in as ${email}: ${error?.message}`);
  }
  return { client, userId: data.user.id };
}

const results: { name: string; passed: boolean; detail: string }[] = [];

function record(name: string, passed: boolean, detail = "") {
  results.push({ name, passed, detail });
}

function expectError(name: string, error: { message: string } | null, expected?: string) {
  if (!error) {
    record(name, false, "the request succeeded");
    return;
  }
  const matches = !expected || error.message.includes(expected);
  record(name, matches, matches ? error.message : `unexpected error: ${error.message}`);
}

async function main() {
  const anon = newClient();
  const { client: manager, userId: managerId } = await signedIn(EMAILS.manager);
  const { client: ivanov, userId: ivanovId } = await signedIn(EMAILS.ivanov);
  const { client: petrov, userId: petrovId } = await signedIn(EMAILS.petrov);

  // Registration
  const signUp = await newClient().auth.signUp({
    email: `intruder-${Date.now()}@mini-crm.test`,
    password: "Intruder-password-1",
  });
  expectError("Открытая регистрация отключена", signUp.error);

  // Guest
  for (const table of ["tasks", "objects", "profiles", "task_status_history"]) {
    const { error } = await anon.from(table).select("id").limit(1);
    expectError(`Гость не читает ${table}`, error);
  }

  // Test fixtures: one task for Ivanov, one for Petrov
  const { data: object, error: objectError } = await manager
    .from("objects")
    .insert({ name: "Тест защиты", address: "Служебная запись" })
    .select("id")
    .single();

  if (objectError || !object) {
    throw new Error(`Manager cannot create an object: ${objectError?.message}`);
  }

  const createTask = async (assigneeId: string) => {
    const { data, error } = await manager
      .from("tasks")
      .insert({ title: "Тест защиты", object_id: object.id, assignee_id: assigneeId })
      .select("id, author_id, status")
      .single();

    if (error || !data) {
      throw new Error(`Manager cannot create a task: ${error?.message}`);
    }
    return data;
  };

  const ivanovTask = await createTask(ivanovId);
  const petrovTask = await createTask(petrovId);
  record(
    "База сама ставит автора и статус «Новая»",
    ivanovTask.author_id === managerId && ivanovTask.status === "new"
  );

  // Reading someone else's data
  const foreignRead = await ivanov.from("tasks").select("id").eq("id", petrovTask.id);
  record("Исполнитель не читает чужую задачу", foreignRead.data?.length === 0);

  const allTasks = await ivanov.from("tasks").select("assignee_id");
  record(
    "Исполнитель получает только свои задачи",
    Boolean(allTasks.data?.every((task) => task.assignee_id === ivanovId))
  );

  const foreignHistory = await ivanov
    .from("task_status_history")
    .select("id")
    .eq("task_id", petrovTask.id);
  record("Исполнитель не читает чужую историю", foreignHistory.data?.length === 0);

  const foreignTaskList = await ivanov.from("tasks").select("id").eq("object_id", object.id);
  record(
    "На общем объекте исполнитель видит только свою задачу",
    foreignTaskList.data?.length === 1 && foreignTaskList.data[0].id === ivanovTask.id
  );

  // Changing someone else's data
  const foreignEdit = await ivanov
    .from("tasks")
    .update({ title: "Взлом" })
    .eq("id", petrovTask.id)
    .select("id");
  record("Исполнитель не меняет чужую задачу", foreignEdit.data?.length === 0);

  const ownEdit = await ivanov
    .from("tasks")
    .update({ title: "Взлом" })
    .eq("id", ivanovTask.id)
    .select("id");
  record("Исполнитель не меняет поля своей задачи", ownEdit.data?.length === 0);

  const steal = await ivanov
    .from("tasks")
    .update({ assignee_id: ivanovId })
    .eq("id", petrovTask.id)
    .select("id");
  record("Исполнитель не забирает чужую задачу", steal.data?.length === 0);

  const execCreate = await ivanov
    .from("tasks")
    .insert({ title: "Взлом", object_id: object.id, assignee_id: ivanovId });
  expectError("Исполнитель не создаёт задачи", execCreate.error);

  const execDelete = await ivanov.rpc("delete_task", { p_task_id: ivanovTask.id });
  expectError("Исполнитель не удаляет задачи", execDelete.error, "forbidden");

  const execObject = await ivanov.from("objects").insert({ name: "Взлом", address: "Взлом" });
  expectError("Исполнитель не создаёт объекты", execObject.error);

  // Privilege escalation
  const escalate = await ivanov.from("profiles").update({ role: "manager" }).eq("id", ivanovId);
  expectError("Исполнитель не делает себя постановщиком", escalate.error);

  // Status bypass
  const directStatus = await ivanov
    .from("tasks")
    .update({ status: "accepted" })
    .eq("id", ivanovTask.id);
  expectError("Нельзя сменить статус прямым запросом (исполнитель)", directStatus.error);

  const managerDirect = await manager
    .from("tasks")
    .update({ status: "accepted" })
    .eq("id", ivanovTask.id);
  expectError("Нельзя сменить статус прямым запросом (постановщик)", managerDirect.error);

  const forgedStatus = await manager
    .from("tasks")
    .insert({ title: "Взлом", object_id: object.id, assignee_id: ivanovId, status: "accepted" });
  expectError("Нельзя создать задачу сразу в статусе «Принята»", forgedStatus.error);

  const forgedAuthor = await manager
    .from("tasks")
    .insert({ title: "Взлом", object_id: object.id, assignee_id: ivanovId, author_id: ivanovId });
  expectError("Нельзя подделать автора задачи", forgedAuthor.error);

  // Transitions
  const change = (client: Client, taskId: string, status: string, comment?: string) =>
    client.rpc("change_task_status", {
      p_task_id: taskId,
      p_new_status: status,
      p_comment: comment,
    });

  expectError(
    "Чужой исполнитель не двигает задачу",
    (await change(petrov, ivanovTask.id, "in_progress")).error,
    "task_not_found"
  );
  expectError(
    "Постановщик не берёт задачу в работу",
    (await change(manager, ivanovTask.id, "in_progress")).error,
    "transition_forbidden"
  );
  expectError(
    "Нельзя перепрыгнуть «Новая → На проверке»",
    (await change(ivanov, ivanovTask.id, "in_review")).error,
    "transition_forbidden"
  );
  expectError(
    "Исполнитель не принимает задачу",
    (await change(ivanov, ivanovTask.id, "accepted")).error,
    "transition_forbidden"
  );

  const legalSteps: [Client, string, string?][] = [
    [ivanov, "in_progress"],
    [ivanov, "in_review"],
  ];
  for (const [client, status] of legalSteps) {
    const { error } = await change(client, ivanovTask.id, status);
    record(`Разрешённый переход проходит: ${status}`, !error, error?.message);
  }

  expectError(
    "Исполнитель не принимает свою задачу на проверке",
    (await change(ivanov, ivanovTask.id, "accepted")).error,
    "transition_forbidden"
  );
  expectError(
    "Доработка без комментария запрещена",
    (await change(manager, ivanovTask.id, "rework")).error,
    "comment_required"
  );
  expectError(
    "Комментарий из пробелов не считается",
    (await change(manager, ivanovTask.id, "rework", "   ")).error,
    "comment_required"
  );

  const rework = await change(manager, ivanovTask.id, "rework", "Исправить");
  record("Возврат на доработку с комментарием проходит", !rework.error, rework.error?.message);

  // History
  const historyInsert = await ivanov.from("task_status_history").insert({
    task_id: ivanovTask.id,
    to_status: "accepted",
    changed_by: managerId,
  });
  expectError("Нельзя добавить запись в историю", historyInsert.error);

  const historyUpdate = await manager
    .from("task_status_history")
    .update({ comment: "Подделка" })
    .eq("task_id", ivanovTask.id);
  expectError("Нельзя изменить историю (даже постановщику)", historyUpdate.error);

  const historyDelete = await manager
    .from("task_status_history")
    .delete()
    .eq("task_id", ivanovTask.id);
  expectError("Нельзя удалить историю (даже постановщику)", historyDelete.error);

  const historyRows = await ivanov
    .from("task_status_history")
    .select("from_status, to_status, changed_by, comment")
    .eq("task_id", ivanovTask.id)
    .order("id");
  const lastRow = historyRows.data?.at(-1);
  record(
    "История записана полностью и верно",
    historyRows.data?.length === 4 &&
      lastRow?.to_status === "rework" &&
      lastRow?.changed_by === managerId &&
      lastRow?.comment === "Исправить"
  );

  // Delete must not touch history
  const hardDelete = await manager.from("tasks").delete().eq("id", ivanovTask.id);
  expectError("Прямое удаление задачи закрыто", hardDelete.error);

  // Cleanup: soft delete the fixtures, they disappear from every list
  for (const task of [ivanovTask, petrovTask]) {
    const { error } = await manager.rpc("delete_task", { p_task_id: task.id });
    record("Постановщик удаляет задачу", !error, error?.message);
  }
  const removeObject = await manager.rpc("delete_object", { p_object_id: object.id });
  record("Постановщик удаляет пустой объект", !removeObject.error, removeObject.error?.message);

  const failed = results.filter(({ passed }) => !passed);

  for (const { name, passed, detail } of results) {
    console.log(`${passed ? "OK  " : "FAIL"} ${name}${!passed && detail ? ` (${detail})` : ""}`);
  }
  console.log(`\nПройдено: ${results.length - failed.length} из ${results.length}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
