"use client";

import { useState, useTransition } from "react";
import { Users, UserPlus, Loader2, Mail, Trash2 } from "lucide-react";
import { addProjectMember, removeProjectMember, type InviteRole } from "@/lib/actions/projects";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  worker: "Mitarbeiter",
};

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface ProjectTeamSectionProps {
  projectId: string;
  members: MemberRow[];
  currentUserId: string;
}

export function ProjectTeamSection({
  projectId,
  members,
  currentUserId,
}: ProjectTeamSectionProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("worker");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Bitte E-Mail-Adresse angeben.");
      return;
    }

    startTransition(async () => {
      const result = await addProjectMember(projectId, trimmed, role);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Nutzer zum Projekt hinzugefügt.");
        setEmail("");
      }
    });
  }

  function handleRemove(userId: string) {
    if (userId === currentUserId) {
      toast.error("Sie können sich nicht selbst entfernen.");
      return;
    }
    startTransition(async () => {
      try {
        await removeProjectMember(projectId, userId);
        toast.success("Mitglied entfernt.");
      } catch {
        toast.error("Fehler beim Entfernen.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-bold flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
          <Users className="h-4 w-4 text-amber-500" />
        </div>
        Projekt-Team
      </h2>

      <form onSubmit={handleAdd} className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nutzer per E-Mail hinzufügen (muss bereits registriert sein).
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
              disabled={isPending}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            className="flex h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
            disabled={isPending}
          >
            <option value="manager">Manager</option>
            <option value="worker">Mitarbeiter</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Hinzufügen
          </button>
        </div>
      </form>

      <ul className="space-y-2">
        {members.map((m) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm"
          >
            <span className="font-medium text-muted-foreground">
              {m.user_id === currentUserId ? "Sie" : "Mitglied"} · {ROLE_LABELS[m.role] ?? m.role}
            </span>
            {m.user_id !== currentUserId && (
              <button
                type="button"
                onClick={() => handleRemove(m.user_id)}
                disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
                aria-label="Mitglied entfernen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
