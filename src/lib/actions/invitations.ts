"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email/send-invite";
import type { InviteRole } from "./projects";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export interface InviteResult {
  error?: string;
  inviteLink?: string;
  directlyAdded?: boolean;
  emailSent?: boolean;
}

export async function inviteProjectMember(
  projectId: string,
  email: string,
  role: InviteRole
): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  const { data: myMembership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  const myRole = myMembership?.role;
  if (myRole !== "admin" && myRole !== "manager") {
    return { error: "Nur Admin oder Manager dürfen Nutzer einladen." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  if (normalizedEmail === user.email?.toLowerCase()) {
    return { error: "Sie können sich nicht selbst einladen." };
  }

  // Try direct add first (user already registered)
  const { data: foundUserId } = await supabase.rpc("get_user_id_by_email", {
    p_email: normalizedEmail,
  });

  if (foundUserId) {
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", foundUserId)
      .single();

    if (existingMember) {
      return { error: "Diese Person ist bereits im Projekt." };
    }

    const { error: insertError } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: foundUserId, role });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Diese Person ist bereits im Projekt." };
      }
      return { error: insertError.message || "Fehler beim Hinzufügen." };
    }

    revalidatePath(`/project/${projectId}`);
    return { directlyAdded: true };
  }

  // User not registered — create an invitation
  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from("project_invitations")
    .select("id, status, expires_at")
    .eq("project_id", projectId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    const isExpired = new Date(existingInvite.expires_at) < new Date();
    if (!isExpired) {
      return {
        error:
          "Für diese E-Mail-Adresse gibt es bereits eine offene Einladung. Verwenden Sie 'Erneut senden' oder widerrufen Sie die bestehende Einladung.",
      };
    }
    // Expired — mark it and create a fresh one
    await supabase
      .from("project_invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", existingInvite.id);
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: inviteError } = await supabase
    .from("project_invitations")
    .insert({
      project_id: projectId,
      email: normalizedEmail,
      role,
      token,
      invited_by: user.id,
      status: "pending",
      expires_at: expiresAt,
    });

  if (inviteError) {
    if (inviteError.code === "23505") {
      return {
        error:
          "Für diese E-Mail-Adresse gibt es bereits eine offene Einladung.",
      };
    }
    console.error("invite creation error:", inviteError);
    return { error: "Fehler beim Erstellen der Einladung." };
  }

  const inviteLink = `${getAppUrl()}/invite/${token}`;

  // Get project name and inviter name for the email
  const { data: projectData } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const inviterName =
    user.user_metadata?.full_name ?? user.email ?? "Ein Teammitglied";

  const emailSent = await sendInviteEmail({
    to: normalizedEmail,
    inviterName,
    projectName: projectData?.name ?? "Bauprojekt",
    role,
    inviteLink,
  });

  revalidatePath(`/project/${projectId}`);
  return { inviteLink, emailSent };
}

export async function revokeInvitation(
  invitationId: string,
  projectId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  const { error } = await supabase
    .from("project_invitations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("project_id", projectId)
    .eq("status", "pending");

  if (error) return { error: "Fehler beim Widerrufen der Einladung." };

  revalidatePath(`/project/${projectId}`);
  return {};
}

export async function resendInvitation(
  invitationId: string,
  projectId: string
): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  const { data: invitation } = await supabase
    .from("project_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("project_id", projectId)
    .single();

  if (!invitation) return { error: "Einladung nicht gefunden." };

  if (invitation.status !== "pending") {
    return { error: "Nur offene Einladungen können erneut gesendet werden." };
  }

  // Refresh the token and expiry
  const newToken = generateToken();
  const newExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: updateError } = await supabase
    .from("project_invitations")
    .update({
      token: newToken,
      expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (updateError) return { error: "Fehler beim Erneuern der Einladung." };

  const inviteLink = `${getAppUrl()}/invite/${newToken}`;

  revalidatePath(`/project/${projectId}`);
  return { inviteLink };
}

export async function getProjectInvitations(projectId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_invitations")
    .select("id, email, role, status, expires_at, created_at, invited_by")
    .eq("project_id", projectId)
    .in("status", ["pending"])
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function acceptInvitationByToken(
  token: string
): Promise<{ error?: string; projectId?: string; alreadyMember?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melden Sie sich zuerst an." };

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });

  if (error) {
    console.error("accept_invitation rpc error:", error);
    return { error: "Fehler beim Annehmen der Einladung." };
  }

  const result = data as {
    error?: string;
    success?: boolean;
    project_id?: string;
    already_member?: boolean;
  };

  if (result.error) return { error: result.error };
  return {
    projectId: result.project_id,
    alreadyMember: result.already_member,
  };
}

export async function claimPendingInvitations(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("claim_pending_invitations");
  if (error) {
    console.error("claim_pending_invitations error:", error);
    return 0;
  }

  return (data as { claimed: number })?.claimed ?? 0;
}

export async function getInvitationInfo(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_invitation_info", {
    p_token: token,
  });

  if (error) {
    console.error("get_invitation_info error:", error);
    return { error: "Fehler beim Laden der Einladung." };
  }

  return data as {
    valid?: boolean;
    email?: string;
    role?: string;
    project_name?: string;
    inviter_name?: string;
    expires_at?: string;
    error?: string;
    status?: string;
  };
}
