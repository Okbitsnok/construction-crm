import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";
import { getObjects } from "@/shared/objects/queries";
import { ObjectsView } from "./_components/ObjectsView";

export const metadata = { title: "Объекты | Мини-CRM" };

export default async function ObjectsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const objects = await getObjects();

  return <ObjectsView objects={objects} canManage={profile.role === "manager"} />;
}
