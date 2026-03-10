"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createUnit } from "@/lib/actions/projects";
import { toast } from "sonner";

interface AddUnitFormProps {
  projectId: string;
  onAdded?: () => void;
}

export function AddUnitForm({ projectId, onAdded }: AddUnitFormProps) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await createUnit(projectId, trimmed);
        toast.success("Einheit angelegt.");
        setName("");
        onAdded?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fehler beim Anlegen.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Neue Einheit (z. B. EG links)"
        className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-white disabled:opacity-50 cursor-pointer"
        aria-label="Einheit hinzufügen"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </button>
    </form>
  );
}
