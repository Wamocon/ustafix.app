"use client";

import Link from "next/link";
import { FileText, ReceiptText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translations";

interface LegalLinksProps {
  className?: string;
  variant?: "inline" | "cards";
}

const items = [
  { href: "/impressum", labelKey: "legal.imprint", icon: FileText },
  { href: "/datenschutz", labelKey: "legal.privacy", icon: Shield },
  { href: "/agb", labelKey: "legal.terms", icon: ReceiptText },
] as const;

export function LegalLinks({ className, variant = "inline" }: LegalLinksProps) {
  const t = useTranslation();

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
              <item.icon className="h-4 w-4" />
            </span>
            <span>{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-5 gap-y-2", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </div>
  );
}