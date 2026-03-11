-- Ustafix.app Database Setup (Neuinstallation)
-- Für bestehende Datenbanken: Migration supabase/migrations/20250309_roles_admin_manager_worker.sql ausführen.

-- Enums
CREATE TYPE project_status AS ENUM ('aktiv', 'abgeschlossen');
CREATE TYPE member_role AS ENUM ('admin', 'manager', 'worker');
CREATE TYPE defect_status AS ENUM ('offen', 'in_arbeit', 'erledigt');
CREATE TYPE defect_priority AS ENUM ('niedrig', 'mittel', 'hoch');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE media_phase AS ENUM ('erfassung', 'fortschritt', 'abnahme');

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  status project_status NOT NULL DEFAULT 'aktiv',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defects
CREATE TABLE defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description_original TEXT,
  description_de TEXT,
  description_tr TEXT,
  description_ru TEXT,
  status defect_status NOT NULL DEFAULT 'offen',
  priority defect_priority NOT NULL DEFAULT 'mittel',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_defects_project ON defects(project_id);
CREATE INDEX idx_defects_status ON defects(project_id, status);

-- Defect Media
CREATE TABLE defect_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  phase media_phase NOT NULL DEFAULT 'erfassung',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_defect ON defect_media(defect_id);
CREATE INDEX idx_media_phase ON defect_media(defect_id, phase);

-- Defect Comments (Fragen & Anweisungen)
CREATE TABLE defect_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_defect_comments_defect ON defect_comments(defect_id);

-- Status Transition Log
CREATE TABLE defect_status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  from_status defect_status NOT NULL,
  to_status defect_status NOT NULL,
  note TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transitions_defect ON defect_status_transitions(defect_id);
CREATE INDEX idx_transitions_created ON defect_status_transitions(defect_id, created_at);

-- Transition Media (proof photos/videos for status changes)
CREATE TABLE transition_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_id UUID NOT NULL REFERENCES defect_status_transitions(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  phase media_phase NOT NULL DEFAULT 'fortschritt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transition_media ON transition_media(transition_id);

-- Phase Updates (progress documentation between status transitions)
CREATE TABLE phase_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase media_phase NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phase_updates_defect ON phase_updates(defect_id, created_at);

-- Phase Update Media
CREATE TABLE phase_update_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_update_id UUID NOT NULL REFERENCES phase_updates(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phase_update_media ON phase_update_media(phase_update_id);

-- Push Notifications
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status_changes BOOLEAN NOT NULL DEFAULT true,
  new_comments BOOLEAN NOT NULL DEFAULT true,
  new_defects BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_media ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a member of a project
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user role in a project
CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS member_role AS $$
  SELECT role FROM project_members
  WHERE project_id = p_project_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_manager(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_project_role(p_project_id) IN ('admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_project_admin(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_project_role(p_project_id) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: members can see their orgs
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT p.organization_id FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Projects
CREATE POLICY "Members can view projects" ON projects
  FOR SELECT USING (is_project_member(id));

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      NOT EXISTS (SELECT 1 FROM project_members WHERE user_id = auth.uid())
      OR organization_id IN (
        SELECT p.organization_id FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = auth.uid() AND pm.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (is_admin_or_manager(id));

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (is_project_admin(id));

-- Project Members
CREATE POLICY "Members can view project members" ON project_members
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_manager(project_id) = true);

CREATE POLICY "project_members_update_role" ON project_members
  FOR UPDATE USING (is_admin_or_manager(project_id));

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (is_admin_or_manager(project_id));

-- Units: nur admin/manager dürfen anlegen
CREATE POLICY "Members can view units" ON units
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "units_insert" ON units
  FOR INSERT WITH CHECK (is_project_member(project_id) AND is_admin_or_manager(project_id));

-- Defects: alle Mitglieder Insert/Update; Delete nur admin/manager
CREATE POLICY "Members can view defects" ON defects
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "defects_insert" ON defects
  FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "defects_update" ON defects
  FOR UPDATE USING (is_project_member(project_id));

CREATE POLICY "defects_delete" ON defects
  FOR DELETE USING (is_admin_or_manager(project_id));

-- Defect Media: Insert alle (created_by = auth.uid()); Delete admin/manager alle, worker nur eigenes
CREATE POLICY "Members can view media" ON defect_media
  FOR SELECT USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

CREATE POLICY "defect_media_insert" ON defect_media
  FOR INSERT WITH CHECK (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "media_delete" ON defect_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN defects d ON d.id = defect_media.defect_id AND d.project_id = pm.project_id
      WHERE pm.user_id = (SELECT auth.uid())
      AND (
        pm.role IN ('admin', 'manager')
        OR (pm.role = 'worker' AND defect_media.created_by = (SELECT auth.uid()))
      )
    )
  );

-- Defect Comments
ALTER TABLE defect_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "defect_comments_select" ON defect_comments
  FOR SELECT USING (defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id)));
CREATE POLICY "defect_comments_insert" ON defect_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );
CREATE POLICY "defect_comments_delete" ON defect_comments
  FOR DELETE USING (
    (user_id = auth.uid())
    OR defect_id IN (SELECT d.id FROM defects d WHERE is_admin_or_manager(d.project_id))
  );

-- Status Transitions
CREATE POLICY "transitions_select" ON defect_status_transitions
  FOR SELECT USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );
CREATE POLICY "transitions_insert" ON defect_status_transitions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND changed_by = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- Transition Media
CREATE POLICY "transition_media_select" ON transition_media
  FOR SELECT USING (
    transition_id IN (
      SELECT t.id FROM defect_status_transitions t
      JOIN defects d ON d.id = t.defect_id
      WHERE is_project_member(d.project_id)
    )
  );
CREATE POLICY "transition_media_insert" ON transition_media
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND transition_id IN (
      SELECT t.id FROM defect_status_transitions t WHERE t.changed_by = auth.uid()
    )
  );

-- Acceptance Protocols
CREATE TYPE acceptance_verdict AS ENUM ('akzeptiert', 'beanstandet', 'zurueckgestellt');

CREATE TABLE acceptance_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  participants TEXT NOT NULL,
  general_notes TEXT,
  consent_clause TEXT NOT NULL DEFAULT 'Beide Parteien stimmen der elektronischen Form dieses Protokolls zu.',
  signature_contractor TEXT,
  signature_client TEXT,
  integrity_hash TEXT,
  pdf_storage_path TEXT,
  supersedes_id UUID REFERENCES acceptance_protocols(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_supersede CHECK (supersedes_id IS NULL OR supersedes_id != id)
);
CREATE INDEX idx_protocols_project ON acceptance_protocols(project_id);
CREATE INDEX idx_protocols_unit ON acceptance_protocols(unit_id);

CREATE TABLE protocol_defect_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES acceptance_protocols(id) ON DELETE CASCADE,
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  verdict acceptance_verdict NOT NULL,
  correction_deadline TIMESTAMPTZ,
  note TEXT,
  UNIQUE(protocol_id, defect_id)
);
CREATE INDEX idx_verdicts_protocol ON protocol_defect_verdicts(protocol_id);

-- Project Invitations
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_project ON project_invitations(project_id);
CREATE INDEX idx_invitations_email ON project_invitations(lower(email));
CREATE INDEX idx_invitations_token ON project_invitations(token);
CREATE INDEX idx_invitations_status ON project_invitations(project_id, status);
CREATE UNIQUE INDEX idx_unique_pending_invite ON project_invitations(project_id, lower(email)) WHERE status = 'pending';

ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON project_invitations
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "invitations_insert" ON project_invitations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND invited_by = (SELECT auth.uid())
    AND is_admin_or_manager(project_id)
  );

CREATE POLICY "invitations_update" ON project_invitations
  FOR UPDATE USING (
    is_admin_or_manager(project_id)
    OR (SELECT auth.uid()) IS NOT NULL
  );

CREATE POLICY "invitations_delete" ON project_invitations
  FOR DELETE USING (is_project_admin(project_id));

-- ============================================================
-- RPC Functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_defect_comments_with_info(p_defect_id UUID)
RETURNS TABLE(id UUID, defect_id UUID, user_id UUID, message TEXT, email TEXT, full_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT dc.id, dc.defect_id, dc.user_id, dc.message, au.email, au.raw_user_meta_data->>'full_name', dc.created_at
  FROM public.defect_comments dc
  JOIN auth.users au ON au.id = dc.user_id
  WHERE dc.defect_id = p_defect_id
  AND dc.defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  ORDER BY dc.created_at;
$$;

CREATE OR REPLACE FUNCTION get_project_members_with_info(p_project_id UUID)
RETURNS TABLE(id UUID, user_id UUID, role member_role, email TEXT, full_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT pm.id, pm.user_id, pm.role, au.email, au.raw_user_meta_data->>'full_name', pm.created_at
  FROM public.project_members pm
  JOIN auth.users au ON au.id = pm.user_id
  WHERE pm.project_id = p_project_id
  AND public.is_project_member(p_project_id)
  ORDER BY pm.created_at;
$$;

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

-- RPC: Accept invitation by token
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

  SELECT * INTO v_invitation
  FROM public.project_invitations WHERE token = p_token FOR UPDATE;

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

  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RETURN jsonb_build_object('error', 'Diese Einladung wurde an eine andere E-Mail-Adresse gesendet (' ||
      left(v_invitation.email, 3) || '***). Bitte melden Sie sich mit der richtigen Adresse an.');
  END IF;

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

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, v_user_id, v_invitation.role);

  UPDATE public.project_invitations
  SET status = 'accepted', accepted_by = v_user_id, updated_at = now()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'project_id', v_invitation.project_id, 'role', v_invitation.role::text);
END;
$$;

-- RPC: Auto-accept all pending invitations for a user's email
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

  UPDATE public.project_invitations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();

  FOR v_invitation IN
    SELECT * FROM public.project_invitations
    WHERE lower(email) = lower(v_user_email) AND status = 'pending'
    FOR UPDATE
  LOOP
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

-- RPC: Get invitation info by token (for invite landing page)
CREATE OR REPLACE FUNCTION get_invitation_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_invitation RECORD;
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

-- RPC: Dashboard stats (single-query, role-aware)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'user_id', v_user_id,
    'projects', (
      SELECT COALESCE(jsonb_agg(proj ORDER BY proj->>'name'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', p.id, 'name', p.name, 'address', p.address, 'status', p.status::text,
          'my_role', pm.role::text, 'created_at', p.created_at,
          'defect_counts', (
            SELECT jsonb_build_object('offen', count(*) FILTER (WHERE d.status='offen'),
              'in_arbeit', count(*) FILTER (WHERE d.status='in_arbeit'),
              'erledigt', count(*) FILTER (WHERE d.status='erledigt'), 'total', count(*))
            FROM public.defects d WHERE d.project_id = p.id),
          'priority_counts', (
            SELECT jsonb_build_object('hoch', count(*) FILTER (WHERE d.priority='hoch' AND d.status!='erledigt'),
              'mittel', count(*) FILTER (WHERE d.priority='mittel' AND d.status!='erledigt'),
              'niedrig', count(*) FILTER (WHERE d.priority='niedrig' AND d.status!='erledigt'))
            FROM public.defects d WHERE d.project_id = p.id),
          'member_count', (SELECT count(*) FROM public.project_members pm2 WHERE pm2.project_id = p.id),
          'member_roles', (
            SELECT jsonb_build_object('admin', count(*) FILTER (WHERE pm2.role='admin'),
              'manager', count(*) FILTER (WHERE pm2.role='manager'),
              'worker', count(*) FILTER (WHERE pm2.role='worker'))
            FROM public.project_members pm2 WHERE pm2.project_id = p.id),
          'pending_invitations', (
            SELECT count(*) FROM public.project_invitations pi
            WHERE pi.project_id = p.id AND pi.status = 'pending' AND pi.expires_at > now()),
          'protocol_count', (SELECT count(*) FROM public.acceptance_protocols ap WHERE ap.project_id = p.id),
          'my_defects_open', (
            SELECT count(*) FROM public.defects d
            WHERE d.project_id = p.id AND d.created_by = v_user_id AND d.status != 'erledigt'),
          'recent_transitions', (
            SELECT COALESCE(jsonb_agg(t ORDER BY t->>'created_at' DESC), '[]'::jsonb)
            FROM (
              SELECT jsonb_build_object('id', dst.id, 'defect_id', dst.defect_id,
                'defect_title', d.title, 'from_status', dst.from_status::text,
                'to_status', dst.to_status::text,
                'changed_by_name', COALESCE(u.raw_user_meta_data->>'full_name', u.email),
                'created_at', dst.created_at) AS t
              FROM public.defect_status_transitions dst
              JOIN public.defects d ON d.id = dst.defect_id
              JOIN auth.users u ON u.id = dst.changed_by
              WHERE d.project_id = p.id
              ORDER BY dst.created_at DESC LIMIT 5
            ) sub)
        ) AS proj
        FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id AND pm.user_id = v_user_id
      ) sub2
    ),
    'highest_role', (
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.user_id = v_user_id AND pm.role = 'admin') THEN 'admin'
        WHEN EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.user_id = v_user_id AND pm.role = 'manager') THEN 'manager'
        ELSE 'worker' END),
    'total_defects_by_me', (SELECT count(*) FROM public.defects d WHERE d.created_by = v_user_id),
    'user_name', (SELECT COALESCE(u.raw_user_meta_data->>'full_name', u.email) FROM auth.users u WHERE u.id = v_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- Storage Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'defect-media',
  'defect-media',
  true,
  15728640, -- 15MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'defect-media' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'defect-media');

CREATE POLICY "Owner can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'defect-media'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- ============================================================
-- Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE defects;
ALTER PUBLICATION supabase_realtime ADD TABLE defect_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE defect_status_transitions;
