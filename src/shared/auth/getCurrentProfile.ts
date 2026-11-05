import { cache } from "react";
import { createClient } from "@/shared/supabase/server";
import type { UserRole } from "@/shared/supabase/database.types";

export type CurrentProfile = {
  id: string;
  fullName: string;
  role: UserRole;
};

// cache() keeps it to one database call per page render, however many components ask.
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return { id: profile.id, fullName: profile.full_name, role: profile.role };
});
