import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";
import { isTaskStatus } from "@/shared/tasks/constants";
import { getTasks } from "@/shared/tasks/queries";
import { TasksView } from "./_components/TasksView";

export const metadata = { title: "Задачи | Мини-CRM" };

type TasksPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { status } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const activeStatus = isTaskStatus(status) ? status : undefined;
  const tasks = await getTasks({ status: activeStatus });

  return (
    <TasksView tasks={tasks} activeStatus={activeStatus} isManager={profile.role === "manager"} />
  );
}
