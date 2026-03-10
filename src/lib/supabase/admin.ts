import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role.
 * Use ONLY for operations that require bypassing RLS (e.g. looking up user by email for invites).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
