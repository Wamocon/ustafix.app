"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDefect } from "@/lib/actions/defects";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface DefectActionsProps {
  defectId: string;
  projectId: string;
}

export function DefectActions({ defectId, projectId }: DefectActionsProps) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }

    startTransition(async () => {
      try {
        await deleteDefect(defectId, projectId);
        toast.success("Mangel gelöscht");
        router.push(`/project/${projectId}`);
      } catch {
        toast.error("Fehler beim Löschen");
      }
    });
  }

  return (
    <div className="border-t border-border pt-6">
      <motion.button
        onClick={handleDelete}
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all cursor-pointer ${
          confirm
            ? "bg-destructive text-white shadow-lg shadow-destructive/25"
            : "border border-destructive/20 text-destructive hover:bg-destructive/5 active:bg-destructive/10"
        } disabled:opacity-50`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : confirm ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            Wirklich löschen?
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Mangel löschen
          </>
        )}
      </motion.button>
    </div>
  );
}
