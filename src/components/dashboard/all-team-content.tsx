"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  Shield,
  Briefcase,
  Hammer,
} from "lucide-react";
import type { AggregateMember } from "@/lib/actions/aggregate";
import { useTranslation } from "@/hooks/use-translations";

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: typeof Shield; style: string }
> = {
  admin: {
    label: "Admin",
    icon: Shield,
    style: "bg-red-50 text-red-600 border-red-200",
  },
  manager: {
    label: "Bauleiter",
    icon: Briefcase,
    style: "bg-blue-50 text-blue-600 border-blue-200",
  },
  worker: {
    label: "Handwerker",
    icon: Hammer,
    style: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
};

interface Props {
  members: AggregateMember[];
}

export function AllTeamContent({ members }: Props) {
  const t = useTranslation();
  const [search, setSearch] = useState("");

  const byProject = new Map<
    string,
    { name: string; members: AggregateMember[] }
  >();
  for (const m of members) {
    const existing = byProject.get(m.project_id);
    if (existing) {
      existing.members.push(m);
    } else {
      byProject.set(m.project_id, { name: m.project_name, members: [m] });
    }
  }

  const uniqueUsers = new Set(members.map((m) => m.user_id));
  const q = search.toLowerCase();

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
            {t("dashboard.teamMembers")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {uniqueUsers.size} Personen in {byProject.size} Projekten
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Grouped by project */}
      <div className="space-y-4">
        {Array.from(byProject.entries()).map(([projectId, group], gi) => {
          const filteredMembers = group.members.filter((m) => {
            if (!q) return true;
            return (
              (m.full_name && m.full_name.toLowerCase().includes(q)) ||
              (m.email && m.email.toLowerCase().includes(q)) ||
              group.name.toLowerCase().includes(q)
            );
          });

          if (filteredMembers.length === 0) return null;

          return (
            <motion.div
              key={projectId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05, duration: 0.3 }}
              className="section-card"
            >
              <Link
                href={`/project/${projectId}`}
                className="flex items-center gap-2 mb-3 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="font-bold text-sm group-hover:text-amber-600 transition-colors">
                  {group.name}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {filteredMembers.length} Mitglieder
                </span>
              </Link>

              <div className="space-y-2">
                {filteredMembers.map((m) => {
                  const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.worker;
                  const RoleIcon = rc.icon;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase text-muted-foreground">
                        {(
                          m.full_name?.[0] ||
                          m.email?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {m.full_name || "Unbekannt"}
                        </p>
                        {m.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {m.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rc.style}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {rc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {members.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Keine Teammitglieder gefunden
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
