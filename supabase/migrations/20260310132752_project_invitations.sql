
-- Invitation status enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- Project Invitations table
CREATE TABLE project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'worker',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_pending_invite UNIQUE NULLS NOT DISTINCT (project_id, email, status)
);

-- Indexes
CREATE INDEX idx_invitations_project ON project_invitations(project_id);
CREATE INDEX idx_invitations_email ON project_invitations(lower(email));
CREATE INDEX idx_invitations_token ON project_invitations(token);
CREATE INDEX idx_invitations_status ON project_invitations(project_id, status);

-- RLS
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Project members can view invitations for their projects
CREATE POLICY "invitations_select" ON project_invitations
  FOR SELECT USING (is_project_member(project_id));

-- Admin/Manager can create invitations
CREATE POLICY "invitations_insert" ON project_invitations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND invited_by = (SELECT auth.uid())
    AND is_admin_or_manager(project_id)
  );

-- Admin/Manager can revoke; the system (via RPC) handles accept
CREATE POLICY "invitations_update" ON project_invitations
  FOR UPDATE USING (
    is_admin_or_manager(project_id)
    OR (SELECT auth.uid()) IS NOT NULL
  );

-- Only admin can hard-delete
CREATE POLICY "invitations_delete" ON project_invitations
  FOR DELETE USING (is_project_admin(project_id));

-- RPC: Accept invitation by token (called by the invitee)
-- SECURITY DEFINER so it can read the invitation and insert project_members
CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_user_email TEXT;
  v_existing_member BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Nicht authentifiziert');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Find and lock the invitation
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('error', 'Einladung nicht gefunden');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Diese Einladung ist nicht mehr gültig (Status: ' || v_invitation.status || ')');
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE public.project_invitations SET status = 'expired', updated_at = now() WHERE id = v_invitation.id;
    RETURN jsonb_build_object('error', 'Diese Einladung ist abgelaufen');
  END IF;

  -- Verify email matches (case-insensitive)
  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RETURN jsonb_build_object('error', 'Diese Einladung wurde an eine andere E-Mail-Adresse gesendet (' || 
      left(v_invitation.email, 3) || '***). Bitte melden Sie sich mit der richtigen Adresse an.');
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM public.project_members 
    WHERE project_id = v_invitation.project_id AND user_id = v_user_id
  ) INTO v_existing_member;

  IF v_existing_member THEN
    UPDATE public.project_invitations 
    SET status = 'accepted', accepted_by = v_user_id, updated_at = now() 
    WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', true, 'project_id', v_invitation.project_id, 'already_member', true);
  END IF;

  -- Add to project
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, v_user_id, v_invitation.role);

  -- Mark invitation as accepted
  UPDATE public.project_invitations 
  SET status = 'accepted', accepted_by = v_user_id, updated_at = now() 
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'project_id', v_invitation.project_id, 'role', v_invitation.role::text);
END;
$$;

-- RPC: Auto-accept all pending invitations for a user's email (called after login/register)
CREATE OR REPLACE FUNCTION claim_pending_invitations()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invitation RECORD;
  v_claimed INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('claimed', 0);
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Expire old invitations first
  UPDATE public.project_invitations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();

  -- Process each pending invitation for this email
  FOR v_invitation IN
    SELECT * FROM public.project_invitations
    WHERE lower(email) = lower(v_user_email) AND status = 'pending'
    FOR UPDATE
  LOOP
    -- Skip if already a member
    IF NOT EXISTS(
      SELECT 1 FROM public.project_members 
      WHERE project_id = v_invitation.project_id AND user_id = v_user_id
    ) THEN
      INSERT INTO public.project_members (project_id, user_id, role)
      VALUES (v_invitation.project_id, v_user_id, v_invitation.role)
      ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;

    UPDATE public.project_invitations 
    SET status = 'accepted', accepted_by = v_user_id, updated_at = now()
    WHERE id = v_invitation.id;

    v_claimed := v_claimed + 1;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed);
END;
$$;

-- RPC: Get invitation info by token (public, for the invite landing page)
CREATE OR REPLACE FUNCTION get_invitation_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_invitation RECORD;
  v_project_name TEXT;
  v_inviter_name TEXT;
BEGIN
  SELECT i.*, p.name AS project_name, u.raw_user_meta_data->>'full_name' AS inviter_name
  INTO v_invitation
  FROM public.project_invitations i
  JOIN public.projects p ON p.id = i.project_id
  JOIN auth.users u ON u.id = i.invited_by
  WHERE i.token = p_token;

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('error', 'Einladung nicht gefunden');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Diese Einladung ist nicht mehr gültig', 'status', v_invitation.status);
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Diese Einladung ist abgelaufen');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'email', v_invitation.email,
    'role', v_invitation.role::text,
    'project_name', v_invitation.project_name,
    'inviter_name', COALESCE(v_invitation.inviter_name, 'Ein Teammitglied'),
    'expires_at', v_invitation.expires_at
  );
END;
$$;
;
