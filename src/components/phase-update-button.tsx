"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import type { MemberRole } from "@/lib/db/schema";
import { PhaseUpdateModal } from "./phase-update-modal";

interface PhaseUpdateButtonProps {
  defectId: string;
  projectId: string;
  userRole: MemberRole;
  currentStatus: string;
  userId?: string;
}

export function PhaseUpdateButton({
  defectId,
  projectId,
  userRole,
  currentStatus,
  userId,
}: PhaseUpdateButtonProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-all hover:border-amber-500/40 hover:text-foreground cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        {t("phaseAdd.title")}
      </button>

      <PhaseUpdateModal
        open={open}
        onClose={() => setOpen(false)}
        defectId={defectId}
        projectId={projectId}
        userRole={userRole}
        currentStatus={currentStatus}
        userId={userId}
      />
    </>
  );
}
