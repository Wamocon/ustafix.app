"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDefect } from "@/lib/actions/defects";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface DefectActionsProps {
  defectId: string;
  projectId: string;
  /** Nur Admin und Manager sehen den Löschen-Button (Worker nicht). */
  canDelete: boolean;
}

export function DefectActions({
  defectId,
  projectId,
  canDelete,
}: DefectActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const t = useTranslation();

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        await deleteDefect(defectId, projectId);
        toast.success(t("defect.deleteSuccess"));
        setShowDeleteConfirm(false);
        router.push(`/project/${projectId}`);
      } catch {
        toast.error(t("defect.deleteError"));
        setShowDeleteConfirm(false);
      }
    });
  }

  if (!canDelete) return null;

  return (
    <div className="border-t border-border pt-6">
      <motion.button
        onClick={handleDelete}
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all cursor-pointer border border-destructive/20 text-destructive hover:bg-destructive/5 active:bg-destructive/10 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            {t("defect.deleteDefect")}
          </>
        )}
      </motion.button>
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Mangel löschen"
        description="Bist du sicher, dass du diesen Mangel und alle zugehörigen Dateien unwiderruflich löschen möchtest?"
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        isPending={isPending}
      />
    </div>
  );
}
