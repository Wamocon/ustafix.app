"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Loader2, Trash2 } from "lucide-react";
import { createDefectComment, deleteDefectComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

export interface CommentRow {
  id: string;
  defect_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface DefectCommentsProps {
  projectId: string;
  defectId: string;
  comments: CommentRow[];
  currentUserId: string | null;
  canDeleteAnyComment: boolean; // admin/manager
}

export function DefectComments({
  projectId,
  defectId,
  comments,
  currentUserId,
  canDeleteAnyComment,
}: DefectCommentsProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await createDefectComment(projectId, defectId, trimmed);
        setMessage("");
        toast.success("Kommentar gesendet");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fehler beim Senden");
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        await deleteDefectComment(projectId, commentId, defectId);
        toast.success("Kommentar gelöscht");
      } catch {
        toast.error("Fehler beim Löschen");
      }
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Fragen & Anweisungen ({comments.length})
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center rounded-2xl bg-muted/50">
            Noch keine Kommentare. Stelle eine Frage oder gib eine Anweisung.
          </p>
        ) : (
          comments.map((c) => {
            const isOwn = c.user_id === currentUserId;
            const canDelete = isOwn || canDeleteAnyComment;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {isOwn ? "Du" : "Teammitglied"} · {formatDate(c.created_at)}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {c.message}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Kommentar löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Frage oder Anweisung..."
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none ring-2 ring-transparent transition-all focus:ring-amber-500/40 focus:border-amber-500/60 placeholder:text-muted-foreground"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !message.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-white shadow-md shadow-amber-500/20 transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
          aria-label="Senden"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
