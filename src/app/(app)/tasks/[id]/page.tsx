import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";
import { getExecutors, getTaskDetails } from "@/shared/tasks/queries";
import { TaskDetailsView } from "./_components/TaskDetailsView";

export const metadata = { title: "Задача | Мини-CRM" };

type TaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const details = await getTaskDetails(id);

  if (!details) {
    notFound();
  }

  const canManage = profile.role === "manager";
  const executors = canManage ? await getExecutors() : [];

  return (
    <TaskDetailsView
      task={details.task}
      history={details.history}
      transitions={details.transitions}
      executors={executors}
      canManage={canManage}
    />
  );
}
