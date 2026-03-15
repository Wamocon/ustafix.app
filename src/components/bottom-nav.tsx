"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translations";

const navItems = [
  { href: "/dashboard", labelKey: "common.projects", icon: LayoutDashboard },
  { href: "/settings", labelKey: "common.settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslation();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom lg:hidden">
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="flex h-16 items-center justify-around rounded-2xl glass shadow-md">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-5 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  isActive
                    ? "text-amber-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 h-1 w-8 rounded-full gradient-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
