"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 text-destructive font-semibold transition-all hover:bg-destructive/5 active:scale-[0.98] cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      Abmelden
    </button>
  );
}
