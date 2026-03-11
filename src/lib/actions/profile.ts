"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateResult = { ok: true } | { ok: false; error: string };

export async function updateProfileName(fullName: string): Promise<ProfileUpdateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const trimmed = fullName.trim();
  if (!trimmed) return { ok: false, error: "name_required" };

  const { error } = await supabase.auth.updateUser({
    data: { full_name: trimmed },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(newPassword: string): Promise<ProfileUpdateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  if (newPassword.length < 6)
    return { ok: false, error: "password_min_length" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
