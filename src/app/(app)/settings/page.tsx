import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, Smartphone } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { NotificationSettings } from "@/components/notification-settings";
import { getNotificationPreferences } from "@/lib/actions/notifications";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const notifPrefs = await getNotificationPreferences();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalten Sie Ihr Profil und App-Einstellungen.
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <User className="h-4 w-4 text-amber-500" />
            </div>
            Profil
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  E-Mail
                </p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </p>
                <p className="font-medium">
                  {user?.user_metadata?.full_name || "Nicht angegeben"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Smartphone className="h-4 w-4 text-amber-500" />
            </div>
            App-Info
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Plattform</span>
              <span className="font-semibold text-foreground">PWA</span>
            </div>
            <p className="pt-2 text-xs">
              Ustafix.app — Baustellenmängel einfach erfassen und verwalten.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <NotificationSettings
            preferences={
              notifPrefs ?? {
                status_changes: true,
                new_comments: true,
                new_defects: true,
              }
            }
          />
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
