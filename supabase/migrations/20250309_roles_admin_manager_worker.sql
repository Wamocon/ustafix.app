-- Ustafix.app: Rollenkonzept admin, manager, worker
-- Migration: member_role (admin, melder, viewer) -> (admin, manager, worker)
-- + defect_media.created_by, defect_comments, RLS-Anpassungen

-- ============================================================
-- 1. Neues Enum und Migration project_members.role
-- ============================================================
CREATE TYPE member_role_new AS ENUM ('admin', 'manager', 'worker');

-- Temporär role als Text nutzen für Migration
ALTER TABLE project_members
  ADD COLUMN role_new member_role_new;

UPDATE project_members SET role_new =
  CASE role::text
    WHEN 'admin'   THEN 'admin'::member_role_new
    WHEN 'melder'  THEN 'manager'::member_role_new
    WHEN 'viewer'  THEN 'worker'::member_role_new
    ELSE 'worker'::member_role_new
  END;

ALTER TABLE project_members DROP COLUMN role;
ALTER TABLE project_members RENAME COLUMN role_new TO role;
ALTER TABLE project_members ALTER COLUMN role SET NOT NULL;
ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'worker';

DROP TYPE member_role;
ALTER TYPE member_role_new RENAME TO member_role;

-- ============================================================
-- 2. defect_media: created_by (user_id) hinzufügen
-- ============================================================
ALTER TABLE defect_media
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Bestehende Zeilen: created_by NULL (historisch)
COMMENT ON COLUMN defect_media.created_by IS 'User who uploaded this media; used for worker delete policy.';

-- ============================================================
-- 3. Tabelle defect_comments
-- ============================================================
CREATE TABLE defect_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_defect_comments_defect ON defect_comments(defect_id);

-- ============================================================
-- 4. Hilfsfunktionen (Rollen)
-- ============================================================
CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS member_role AS $$
  SELECT role FROM project_members
  WHERE project_id = p_project_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ist User admin oder manager im Projekt?
CREATE OR REPLACE FUNCTION is_admin_or_manager(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_project_role(p_project_id) IN ('admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ist User admin?
CREATE OR REPLACE FUNCTION is_project_admin(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_project_role(p_project_id) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organisation des Projekts
CREATE OR REPLACE FUNCTION get_project_organization_id(p_project_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM projects WHERE id = p_project_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Hat User in derselben Organisation die Rolle admin oder manager (für Projekt-Insert)?
CREATE OR REPLACE FUNCTION is_manager_or_admin_in_org(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.user_id = auth.uid()
      AND p.organization_id = get_project_organization_id(p_project_id)
      AND pm.role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. RLS: Alte Policies droppen (pro Tabelle)
-- ============================================================
-- projects
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
-- Delete-Policy war nicht explizit; wir legen neu an

-- project_members (für spätere Anpassung)
DROP POLICY IF EXISTS "Admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Admins can remove members" ON project_members;

-- units
DROP POLICY IF EXISTS "Members can create units" ON units;

-- defects
DROP POLICY IF EXISTS "Members can create defects" ON defects;
DROP POLICY IF EXISTS "Members can update defects" ON defects;
DROP POLICY IF EXISTS "Admins can delete defects" ON defects;

-- defect_media
DROP POLICY IF EXISTS "Members can upload media" ON defect_media;
DROP POLICY IF EXISTS "Admins can delete media" ON defect_media;

-- ============================================================
-- 6. RLS: projects
-- ============================================================
-- Insert: Erstersteller (noch keine Mitgliedschaft) ODER admin/manager in derselben Orga
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

-- ============================================================
-- 7. RLS: project_members (Lesen unverändert; Insert/Delete anpassen)
-- ============================================================
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_admin_or_manager(project_id) = true
  );

CREATE POLICY "project_members_update_role" ON project_members
  FOR UPDATE USING (is_admin_or_manager(project_id));

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (is_admin_or_manager(project_id));

-- ============================================================
-- 8. RLS: units (nur admin/manager dürfen anlegen)
-- ============================================================
CREATE POLICY "units_insert" ON units
  FOR INSERT WITH CHECK (
    is_project_member(project_id) AND is_admin_or_manager(project_id)
  );

-- ============================================================
-- 9. RLS: defects
-- Insert/Update: admin, manager, worker (alle Projektmitglieder)
-- Delete: nur admin, manager
-- ============================================================
CREATE POLICY "defects_insert" ON defects
  FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "defects_update" ON defects
  FOR UPDATE USING (is_project_member(project_id));

CREATE POLICY "defects_delete" ON defects
  FOR DELETE USING (is_admin_or_manager(project_id));

-- ============================================================
-- 10. RLS: defect_media
-- Insert: alle Projektmitglieder; created_by muss auth.uid() sein
-- Delete: admin/manager alle; worker nur eigenes (created_by = auth.uid())
-- ============================================================
CREATE POLICY "defect_media_insert" ON defect_media
  FOR INSERT WITH CHECK (
    defect_id IN (SELECT id FROM defects WHERE is_project_member(project_id))
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "defect_media_delete_admin_manager" ON defect_media
  FOR DELETE USING (
    defect_id IN (
      SELECT d.id FROM defects d
      WHERE is_admin_or_manager(d.project_id)
    )
  );

CREATE POLICY "defect_media_delete_worker_own" ON defect_media
  FOR DELETE USING (
    created_by = auth.uid()
    AND defect_id IN (
      SELECT id FROM defects WHERE is_project_member(project_id)
    )
  );

-- ============================================================
-- 11. RLS: defect_comments
-- ============================================================
ALTER TABLE defect_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "defect_comments_select" ON defect_comments
  FOR SELECT USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

CREATE POLICY "defect_comments_insert" ON defect_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- Delete: nur Ersteller oder admin/manager des zugehörigen Projekts
CREATE POLICY "defect_comments_delete" ON defect_comments
  FOR DELETE USING (
    (user_id = auth.uid())
    OR defect_id IN (
      SELECT d.id FROM defects d WHERE is_admin_or_manager(d.project_id)
    )
  );

-- ============================================================
-- 12. Realtime für defect_comments (optional)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE defect_comments;
