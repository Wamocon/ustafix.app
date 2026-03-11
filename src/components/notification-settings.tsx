"use client";

import { useState, useTransition, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  savePushSubscription,
  removePushSubscription,
  updateNotificationPreferences,
} from "@/lib/actions/notifications";

/** Converts base64url VAPID key to Uint8Array for PushManager.subscribe() */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const s = base64String.replace(/\s/g, "");
  const padding = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationSettingsProps {
  preferences: {
    status_changes: boolean;
    new_comments: boolean;
    new_defects: boolean;
  };
}

export function NotificationSettings({
  preferences,
}: NotificationSettingsProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [statusChanges, setStatusChanges] = useState(
    preferences.status_changes
  );
  const [newComments, setNewComments] = useState(preferences.new_comments);
  const [newDefects, setNewDefects] = useState(preferences.new_defects);
  const [isPending, startTransition] = useTransition();
  const [isSupported, setIsSupported] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator;
    setIsSupported(supported);

    if (supported && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  async function handleTogglePush() {
    if (!isSupported) {
      toast.error(t("notifications.pushNotSupported"));
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error(t("notifications.vapidMissing"));
      return;
    }

    if (pushEnabled) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await removePushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        toast.success(t("notifications.pushDisabled"));
      } catch {
        toast.error(t("notifications.disableError"));
      }
      return;
    }

    // If permission was previously denied, show helpful guidance
    if (Notification.permission === "denied") {
      toast.error(t("notifications.deniedHelp"));
      return;
    }

    setPushSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(
          permission === "denied"
            ? t("notifications.deniedHelp")
            : t("notifications.denied")
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        toast.error(t("notifications.pushNotSupported"));
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!key || !auth) {
        throw new Error("Subscription keys missing");
      }

      await savePushSubscription({
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
        authKey: btoa(String.fromCharCode(...new Uint8Array(auth))),
      });

      setPushEnabled(true);
      toast.success(t("notifications.pushEnabled"));
    } catch (err) {
      console.error("Push subscription error:", err);
      toast.error(t("notifications.enableError"));
    } finally {
      setPushSubscribing(false);
    }
  }

  function handlePrefChange(
    field: "statusChanges" | "newComments" | "newDefects",
    value: boolean
  ) {
    if (field === "statusChanges") setStatusChanges(value);
    if (field === "newComments") setNewComments(value);
    if (field === "newDefects") setNewDefects(value);

    startTransition(async () => {
      try {
        await updateNotificationPreferences({ [field]: value });
      } catch {
        toast.error(t("notifications.saveError"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Bell className="h-4 w-4" />
        {t("notifications.title")}
      </h3>

      <button
        onClick={handleTogglePush}
        disabled={pushSubscribing}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-wait",
          pushEnabled
            ? "border-green-500/30 bg-green-500/5"
            : "border-border bg-card"
        )}
      >
        <div className="flex items-center gap-3">
          {pushEnabled ? (
            <Bell className="h-5 w-5 text-green-500" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="text-left">
            <p className="text-sm font-semibold">{t("notifications.pushNotifications")}</p>
            <p className="text-xs text-muted-foreground">
              {pushEnabled ? t("notifications.enabled") : t("notifications.disabled")}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "h-6 w-11 rounded-full transition-colors flex items-center px-0.5",
            pushEnabled ? "bg-green-500" : "bg-muted"
          )}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full bg-white shadow transition-transform",
              pushEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </div>
      </button>

      <div className="space-y-2">
        <ToggleRow
          label={t("notifications.statusChanges")}
          description={t("notifications.statusChangesDesc")}
          checked={statusChanges}
          disabled={isPending}
          onChange={(v) => handlePrefChange("statusChanges", v)}
        />
        <ToggleRow
          label={t("notifications.newComments")}
          description={t("notifications.newCommentsDesc")}
          checked={newComments}
          disabled={isPending}
          onChange={(v) => handlePrefChange("newComments", v)}
        />
        <ToggleRow
          label={t("notifications.newDefects")}
          description={t("notifications.newDefectsDesc")}
          checked={newDefects}
          disabled={isPending}
          onChange={(v) => handlePrefChange("newDefects", v)}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 transition-all cursor-pointer disabled:opacity-50"
    >
      <div className="text-left">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          "h-5 w-9 rounded-full transition-colors flex items-center px-0.5 shrink-0",
          checked ? "bg-amber-500" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </div>
    </button>
  );
}
