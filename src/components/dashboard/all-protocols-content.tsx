"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileCheck,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import type { AggregateProtocol } from "@/lib/actions/aggregate";
import { useTranslation } from "@/hooks/use-translations";

interface Props {
  protocols: AggregateProtocol[];
}

export function AllProtocolsContent({ protocols }: Props) {
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-lg lg:max-w-4xl px-4 lg:px-8 pt-6 pb-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card card-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            {t("dashboard.protocols")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {protocols.length} Protokolle insgesamt
          </p>
        </div>
      </motion.div>

      {/* List */}
      <div className="space-y-2">
        {protocols.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
          >
            <Link
              href={`/project/${p.project_id}`}
              className="group block rounded-2xl border border-border bg-card p-4 card-elevated card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 border border-stone-200">
                    <FileCheck className="h-5 w-5 text-stone-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.project_name}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 mt-1" />
              </div>

              <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(p.inspection_date).toLocaleDateString("de-DE")}
                </span>
                {p.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {p.participants}
                </span>
                {p.verdict_count > 0 && (
                  <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200 font-semibold text-[10px]">
                    {p.verdict_count} Bewertungen
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}

        {protocols.length === 0 && (
          <div className="py-12 text-center">
            <FileCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Keine Protokolle vorhanden
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
