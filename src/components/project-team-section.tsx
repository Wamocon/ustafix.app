"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  Mail,
  Phone,
  Trash2,
  Link as LinkIcon,
  Clock,
  Check,
  Copy,
  RotateCw,
  X,
  Send,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translations";
import {
  inviteProjectMember,
  revokeInvitation,
  resendInvitation,
  getProjectInvitations,
  type InviteResult,
} from "@/lib/actions/invitations";
import { removeProjectMember } from "@/lib/actions/projects";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ROLE_KEYS: Record<string, string> = {
  admin: "team.admin",
  manager: "team.manager",
  worker: "team.worker",
};

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface ProjectTeamSectionProps {
  projectId: string;
  members: MemberRow[];
  currentUserId: string;
}

const DELETE_CONFIRM_MESSAGE = "Bist du sicher, dass du das löschen willst?";

export function ProjectTeamSection({
  projectId,
  members,
  currentUserId,
}: ProjectTeamSectionProps) {
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<"manager" | "worker">("worker");
  const [isPending, startTransition] = useTransition();
  const t = useTranslation();
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInvitations = useCallback(() => {
    getProjectInvitations(projectId).then(setInvitations);
  }, [projectId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations, members]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contact.trim();
    if (!trimmed) {
      toast.error(
        contactType === "email"
          ? "Bitte E-Mail-Adresse angeben."
          : "Bitte Handynummer angeben."
      );
      return;
    }

    startTransition(async () => {
      const result: InviteResult = await inviteProjectMember(
        projectId,
        trimmed,
        role,
        contactType
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.directlyAdded) {
        toast.success("Nutzer direkt zum Projekt hinzugefügt.");
        setContact("");
        setInviteLink(null);
        return;
      }

      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        if (result.emailSent) {
          toast.success(t("team.inviteSent"));
        } else {
          toast.success(t("team.inviteCreated"));
        }
        setContact("");
        loadInvitations();
      }
    });
  }

  function handleCopyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      toast.success(t("team.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShareWhatsApp() {
    if (!inviteLink) return;
    const text = encodeURIComponent(
      `${t("team.youWereInvited")}\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function handleRemove(userId: string) {
    if (userId === currentUserId) {
      toast.error(t("team.cannotRemoveSelf"));
      return;
    }
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;

    startTransition(async () => {
      try {
        await removeProjectMember(projectId, userId);
        toast.success(t("team.memberRemoved"));
      } catch {
        toast.error(t("team.removeError"));
      }
    });
  }

  function handleRevoke(invitationId: string) {
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;

    startTransition(async () => {
      const result = await revokeInvitation(invitationId, projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("team.inviteRevoked"));
        loadInvitations();
      }
    });
  }

  function handleResend(invitationId: string) {
    startTransition(async () => {
      const result = await resendInvitation(invitationId, projectId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        toast.success(t("team.inviteResent"));
        loadInvitations();
      }
    });
  }

  return (
    <div className="section-card space-y-4">
      <h2 className="font-bold flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
          <Users className="h-4 w-4 text-amber-600" />
        </div>
        {t("team.title")}
      </h2>

      {/* Invite form */}
      <form onSubmit={handleAdd} className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nutzer per E-Mail oder Handynummer einladen. Per Handynummer werden
          registrierte Nutzer direkt hinzugefügt.
        </p>
        <div className="inline-flex rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setContactType("email")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              contactType === "email"
                ? "gradient-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            E-Mail
          </button>
          <button
            type="button"
            onClick={() => setContactType("phone")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              contactType === "phone"
                ? "gradient-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Handynummer
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            {contactType === "email" ? (
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <input
              type={contactType === "email" ? "email" : "tel"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={
                contactType === "email"
                  ? "E-Mail-Adresse"
                  : "+49 171 1234567"
              }
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
              disabled={isPending}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "manager" | "worker")}
            className="flex h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none ring-2 ring-transparent focus:ring-amber-500/40"
            disabled={isPending}
          >
            <option value="manager">{t("team.manager")}</option>
            <option value="worker">{t("team.worker")}</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {t("team.invite")}
          </button>
        </div>
      </form>

      {/* Invite link share card */}
      <AnimatePresence>
        {inviteLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                  <LinkIcon className="h-4 w-4" />
                  {t("team.inviteLink")}
                </div>
                <button
                  type="button"
                  onClick={() => setInviteLink(null)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border px-3 py-2">
                <code className="flex-1 text-xs text-muted-foreground truncate select-all">
                  {inviteLink}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-1 h-9 items-center justify-center gap-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-status-done" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? t("common.copied") : t("common.copy")}
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex flex-1 h-9 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active members */}
      <ul className="space-y-2">
        {members.map((m) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
          >
            <span className="font-medium text-muted-foreground">
              {m.user_id === currentUserId
                ? t("team.you")
                : m.full_name || m.email || t("team.member")}{" "}
              · {ROLE_KEYS[m.role] ? t(ROLE_KEYS[m.role]) : m.role}
            </span>
            {m.user_id !== currentUserId && (
              <button
                type="button"
                onClick={() => handleRemove(m.user_id)}
                disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
                aria-label={t("team.removeMember")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.li>
        ))}
      </ul>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {t("team.pendingInvitations")} ({invitations.length})
          </h3>
          <ul className="space-y-2">
            {invitations.map((inv) => {
              const isExpired = new Date(inv.expires_at) < new Date();
              return (
                <motion.li
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm border ${
                    isExpired
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-amber-500/10 bg-amber-500/5"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-medium truncate">{inv.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_KEYS[inv.role] ? t(ROLE_KEYS[inv.role]) : inv.role}
                      {isExpired && ` · ${t("team.expired")}`}
                      {!isExpired && (
                        <>
                          {" "}
                          · {t("team.validUntil")}{" "}
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleResend(inv.id)}
                      disabled={isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer disabled:opacity-50"
                      title={t("team.resend")}
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
                      title={t("team.revoke")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
