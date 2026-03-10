"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured || !VAPID_PUBLIC || !VAPID_PRIVATE) return false;

  const subject = process.env.VAPID_SUBJECT ?? "mailto:info@ustafix.app";
  webpush.setVapidDetails(subject, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
  return true;
}

type NotifType = "status_changes" | "new_comments" | "new_defects";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function notifyProjectMembers(params: {
  projectId: string;
  excludeUserId?: string;
  type: NotifType;
  payload: PushPayload;
}) {
  if (!ensureVapid()) return;

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", params.projectId);

  if (!members || members.length === 0) return;

  const userIds = members
    .map((m) => m.user_id)
    .filter((uid) => uid !== params.excludeUserId);

  if (userIds.length === 0) return;

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, status_changes, new_comments, new_defects")
    .in("user_id", userIds);

  const prefsMap = new Map(prefs?.map((p) => [p.user_id, p]) ?? []);

  const eligibleUserIds = userIds.filter((uid) => {
    const pref = prefsMap.get(uid);
    if (!pref) return true; // default: all enabled
    return pref[params.type] !== false;
  });

  if (eligibleUserIds.length === 0) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth_key")
    .in("user_id", eligibleUserIds);

  if (!subscriptions || subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: params.payload.title,
    body: params.payload.body,
    data: { url: params.payload.url },
    tag: params.payload.tag,
  });

  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          pushPayload,
          { TTL: 60 * 60 }
        );
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds);
  }
}
