import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  redirect(profile?.role === "executor" ? "/tasks" : "/objects");
}
