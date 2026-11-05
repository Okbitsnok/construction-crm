import { createClient } from "@/shared/supabase/server";

// tasks(status) goes through RLS as well, so an executor's counters include only his tasks.
export async function getObjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objects")
    .select("id, name, address, tasks(status)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type ObjectListItem = Awaited<ReturnType<typeof getObjects>>[number];

export async function getObject(objectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("objects")
    .select("id, name, address")
    .eq("id", objectId)
    .maybeSingle();

  return data;
}

export type ObjectData = NonNullable<Awaited<ReturnType<typeof getObject>>>;
