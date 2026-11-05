"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/supabase/server";
import type { ActionResult } from "@/shared/actionResult";

type SignInInput = {
  email: string;
  password: string;
};

export async function signIn({ email, password }: SignInInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    return { ok: false, message: "Неверный email или пароль" };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
