import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineBadge } from "@/components/offline-badge";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-dvh flex-col pb-22">
      <OfflineBadge />
      <main className="flex-1 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
}
