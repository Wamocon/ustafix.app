import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
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
    <div className="relative flex min-h-dvh">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col pb-22 lg:pb-0 min-w-0">
        <OfflineBadge />
        <main className="flex-1 animate-fade-in">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
