import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";
import { getObject } from "@/shared/objects/queries";
import { getExecutors, getTasks } from "@/shared/tasks/queries";
import { ObjectDetailsView } from "./_components/ObjectDetailsView";

export const metadata = { title: "Объект | Мини-CRM" };

type ObjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ObjectPage({ params }: ObjectPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const object = await getObject(id);

  if (!object) {
    notFound();
  }

  const canManage = profile.role === "manager";
  const [tasks, executors] = await Promise.all([
    getTasks({ objectId: id }),
    canManage ? getExecutors() : Promise.resolve([]),
  ]);

  return (
    <ObjectDetailsView object={object} tasks={tasks} executors={executors} canManage={canManage} />
  );
}
