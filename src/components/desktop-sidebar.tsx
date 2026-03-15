"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translations";
import { UstafixLogo } from "@/components/ustafix-logo";

const navItems = [
  { href: "/dashboard", labelKey: "common.projects", icon: LayoutDashboard },
  { href: "/settings", labelKey: "common.settings", icon: Settings },
];

export function DesktopSidebar() {
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
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card h-dvh sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="h-10 w-10 shrink-0">
          <UstafixLogo />
        </div>
        <span className="text-lg font-extrabold tracking-tight gradient-text">
          Ustafix
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                isActive
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full gradient-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
