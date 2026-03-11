"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslation();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-semibold transition-all hover:bg-red-100 active:scale-[0.98] cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      {t("common.logout")}
    </button>
  );
}
