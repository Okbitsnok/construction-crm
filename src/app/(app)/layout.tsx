import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/shared/auth/getCurrentProfile";
import { NoAccess } from "./_components/NoAccess";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const profile = await getCurrentProfile();

  // A signed-in account without a profile has no role, so it gets no access at all.
  if (!profile) {
    return <NoAccess />;
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
