"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { User, Mail, Smartphone, Lock } from "lucide-react";
import { Scale } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { NotificationSettings } from "@/components/notification-settings";
import { LanguageSelector } from "@/components/language-selector";
import { LegalLinks } from "@/components/legal/legal-links";
import { useTranslation } from "@/hooks/use-translations";
import { updateProfileName, updatePassword } from "@/lib/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userName ?? "");
  const [newPass, setNewPass] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSaveName() {
    startTransition(async () => {
      const res = await updateProfileName(displayName);
      if (res.ok) {
        toast.success(t("settings.profileSaved"));
        router.refresh();
      } else {
        toast.error(
          res.error === "name_required"
            ? t("settings.nameRequired")
            : t("settings.profileError")
        );
      }
    });
  }

  function handleChangePassword() {
    startTransition(async () => {
      const res = await updatePassword(newPass);
      if (res.ok) {
        toast.success(t("settings.passwordChanged"));
        setNewPass("");
        setShowPasswordForm(false);
      } else {
        toast.error(
          res.error === "password_min_length"
            ? t("auth.passwordMinLength")
            : t("settings.passwordError")
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg lg:max-w-2xl px-4 lg:px-8 pt-6 pb-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </header>

      <div className="space-y-4">
        <div className="section-card space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            {t("settings.profile")}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("common.email")}
                </p>
                <p className="font-medium truncate">{userEmail}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("common.name")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isPending || displayName.trim() === ""}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-amber-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("settings.saveProfile")}
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{t("settings.changePassword")}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("settings.newPassword")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder={t("settings.passwordPlaceholder")}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={isPending || newPass.length < 6}
                      className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-amber-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("settings.saveProfile")}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPass("");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section-card space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <Smartphone className="h-4 w-4 text-amber-600" />
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

        <div className="section-card">
          <NotificationSettings preferences={notifPrefs} />
        </div>

        <div className="section-card space-y-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <Scale className="h-4 w-4 text-amber-600" />
            </div>
            {t("legal.sectionTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("legal.sectionDescription")}
          </p>
          <LegalLinks variant="cards" />
          <p className="text-xs text-muted-foreground">
            <Link href="/impressum" className="font-medium text-amber-700 hover:underline">
              {t("legal.imprint")}
            </Link>{" "}
            ·{" "}
            <Link href="/datenschutz" className="font-medium text-amber-700 hover:underline">
              {t("legal.privacy")}
            </Link>{" "}
            ·{" "}
            <Link href="/agb" className="font-medium text-amber-700 hover:underline">
              {t("legal.terms")}
            </Link>
          </p>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
