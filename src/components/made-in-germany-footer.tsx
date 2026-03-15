"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function normalizePath(pathname: string): string {
  return pathname.toLowerCase();
}

export function MadeInGermanyFooter() {
  const pathname = usePathname();
  const path = normalizePath(pathname ?? "/");

  const authLikePath =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/invite/");

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-1/2 z-40 -translate-x-1/2",
        authLikePath ? "bottom-4" : "bottom-24"
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card/85 px-3 py-2 shadow-md backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-foreground/30 bg-background">
          <div className="h-3.5 w-5 overflow-hidden rounded-[2px] border border-muted-foreground/20">
            <div className="h-1.5 bg-black" />
            <div className="h-1.5 bg-red-600" />
            <div className="h-1.5 bg-amber-400" />
          </div>
        </div>
        <span className="text-xs font-semibold tracking-wide text-muted-foreground">
          Entwickelt in Deutschland
        </span>
      </div>
    </div>
  );
}
