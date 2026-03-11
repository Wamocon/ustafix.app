"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import { createUnit } from "@/lib/actions/projects";
import { toast } from "sonner";

interface AddUnitFormProps {
  projectId: string;
  onAdded?: () => void;
}

export function AddUnitForm({ projectId, onAdded }: AddUnitFormProps) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await createUnit(projectId, trimmed);
        toast.success(t("unit.created"));
        setName("");
        router.refresh();
        onAdded?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("unit.createError"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("unit.placeholder")}
        className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-white disabled:opacity-50 cursor-pointer"
        aria-label={t("unit.addUnit")}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </button>
    </form>
  );
}
