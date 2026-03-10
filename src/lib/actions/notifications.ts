"use server";

import { createClient } from "@/lib/supabase/server";

export async function savePushSubscription(params: {
  endpoint: string;
  p256dh: string;
  authKey: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth_key: params.authKey,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) throw new Error("Fehler beim Speichern der Push-Subscription");
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
}

export async function getNotificationPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    data ?? {
      status_changes: true,
      new_comments: true,
      new_defects: true,
    }
  );
}

export async function updateNotificationPreferences(params: {
  statusChanges?: boolean;
  newComments?: boolean;
  newDefects?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht authentifiziert");

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.statusChanges !== undefined)
    updates.status_changes = params.statusChanges;
  if (params.newComments !== undefined)
    updates.new_comments = params.newComments;
  if (params.newDefects !== undefined) updates.new_defects = params.newDefects;

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        ...updates,
      },
      { onConflict: "user_id" }
    );

  if (error)
    throw new Error("Fehler beim Aktualisieren der Benachrichtigungen");
}
