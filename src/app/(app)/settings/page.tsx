import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/actions/notifications";
import { SettingsContent } from "@/components/settings-content";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const notifPrefs = await getNotificationPreferences();

  return (
    <SettingsContent
      userEmail={user?.email ?? null}
      userName={(user?.user_metadata?.full_name as string) ?? null}
      notifPrefs={
        notifPrefs ?? {
          status_changes: true,
          new_comments: true,
          new_defects: true,
        }
      }
    />
  );
}
