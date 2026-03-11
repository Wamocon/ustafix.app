"use client";

import { User, Mail, Shield, Smartphone } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { NotificationSettings } from "@/components/notification-settings";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/hooks/use-translations";

interface SettingsContentProps {
  userEmail: string | null;
  userName: string | null;
  notifPrefs: {
    status_changes: boolean;
    new_comments: boolean;
    new_defects: boolean;
  };
}

export function SettingsContent({
  userEmail,
  userName,
  notifPrefs,
}: SettingsContentProps) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <User className="h-4 w-4 text-amber-500" />
            </div>
            {t("settings.profile")}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("common.email")}
                </p>
                <p className="font-medium">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("common.name")}
                </p>
                <p className="font-medium">
                  {userName || t("settings.notSpecified")}
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
            {t("settings.appInfo")}
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("common.version")}</span>
              <span className="font-semibold text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>{t("common.platform")}</span>
              <span className="font-semibold text-foreground">PWA</span>
            </div>
            <p className="pt-2 text-xs">
              {t("settings.appDescription")}
            </p>
          </div>
        </div>

        <LanguageSelector />

        <div className="rounded-2xl border border-border bg-card p-5">
          <NotificationSettings preferences={notifPrefs} />
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
