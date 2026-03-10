-- Ustafix.app Database Setup (Neuinstallation)
-- Für bestehende Datenbanken: Migration supabase/migrations/20250309_roles_admin_manager_worker.sql ausführen.

-- Enums
CREATE TYPE project_status AS ENUM ('aktiv', 'abgeschlossen');
CREATE TYPE member_role AS ENUM ('admin', 'manager', 'worker');
CREATE TYPE defect_status AS ENUM ('offen', 'in_arbeit', 'erledigt');
CREATE TYPE defect_priority AS ENUM ('niedrig', 'mittel', 'hoch');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');

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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_defect ON defect_media(defect_id);

-- Defect Comments (Fragen & Anweisungen)
CREATE TABLE defect_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_defect_comments_defect ON defect_comments(defect_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_media ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "defect_media_delete_admin_manager" ON defect_media
  FOR DELETE USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_admin_or_manager(d.project_id))
  );

CREATE POLICY "defect_media_delete_worker_own" ON defect_media
  FOR DELETE USING (
    created_by = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
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

-- ============================================================
-- Storage Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'defect-media',
  'defect-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'defect-media' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'defect-media');

CREATE POLICY "Authenticated users can delete own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'defect-media' AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE defects;
ALTER PUBLICATION supabase_realtime ADD TABLE defect_comments;
