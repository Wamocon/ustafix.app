"use client";

import Link from "next/link";
import { MapPin, ChevronRight, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectCardProps {
  project: Record<string, unknown>;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/project/${project.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 card-hover card-elevated cursor-pointer"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
          <Building2 className="h-6 w-6 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">
            {String(project.name ?? "")}
          </h3>
          {project.address ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500/60" />
              {String(project.address)}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                project.status === "aktiv"
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-stone-100 text-muted-foreground border-stone-200"
              }`}
            >
              {project.status === "aktiv" ? "Aktiv" : "Abgeschlossen"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {project.role === "admin"
                ? "Admin"
                : project.role === "manager"
                  ? "Manager"
                  : "Mitarbeiter"}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
