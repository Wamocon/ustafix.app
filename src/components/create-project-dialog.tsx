"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { createProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  variant?: "fab" | "inline";
}

export function CreateProjectDialog({ variant = "fab" }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProject(formData);
        toast.success("Projekt erstellt!");
        setOpen(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Fehler beim Erstellen";
        toast.error(msg);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "inline"
            ? "inline-flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.97] cursor-pointer"
            : "flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-md shadow-amber-500/20 transition-all hover:shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
        }
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        {variant === "inline" && "Projekt erstellen"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl border border-border"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Neues Projekt</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form action={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="proj-name"
                    className="text-sm font-semibold"
                  >
                    Projektname
                  </label>
                  <input
                    id="proj-name"
                    name="name"
                    required
                    placeholder="z.B. Neubau Musterstraße 5"
                    className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="proj-address"
                    className="text-sm font-semibold"
                  >
                    Adresse
                  </label>
                  <input
                    id="proj-address"
                    name="address"
                    placeholder="Musterstraße 5, 80331 München"
                    className="flex h-13 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer text-base"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Projekt erstellen
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
