"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/supabase/server";
import { NOT_FOUND_OR_FORBIDDEN, toActionError, type ActionResult } from "@/shared/actionResult";

export type ObjectFormValues = {
  name: string;
  address: string;
};

export async function createObject(values: ObjectFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("objects")
    .insert({ name: values.name.trim(), address: values.address.trim() });

  if (error) {
    return toActionError(error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateObject(
  objectId: string,
  values: ObjectFormValues
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objects")
    .update({ name: values.name.trim(), address: values.address.trim() })
    .eq("id", objectId)
    .select("id")
    .maybeSingle();

  if (error) {
    return toActionError(error);
  }
  if (!data) {
    return NOT_FOUND_OR_FORBIDDEN;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteObject(objectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_object", { p_object_id: objectId });

  if (error) {
    return toActionError(error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
