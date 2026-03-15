ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_media ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS member_role AS $$
  SELECT role FROM project_members
  WHERE project_id = p_project_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

CREATE POLICY "Members can view projects" ON projects
  FOR SELECT USING (is_project_member(id));

CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (get_project_role(id) = 'admin');

CREATE POLICY "Members can view project members" ON project_members
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Admins can manage members" ON project_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      get_project_role(project_id) = 'admin'
      OR NOT EXISTS (SELECT 1 FROM project_members WHERE project_id = project_members.project_id)
    )
  );

CREATE POLICY "Admins can remove members" ON project_members
  FOR DELETE USING (get_project_role(project_id) = 'admin');

CREATE POLICY "Members can view units" ON units
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Members can create units" ON units
  FOR INSERT WITH CHECK (is_project_member(project_id));

CREATE POLICY "Members can view defects" ON defects
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "Members can create defects" ON defects
  FOR INSERT WITH CHECK (
    is_project_member(project_id) AND
    get_project_role(project_id) IN ('admin', 'melder')
  );

CREATE POLICY "Members can update defects" ON defects
  FOR UPDATE USING (
    is_project_member(project_id) AND
    get_project_role(project_id) IN ('admin', 'melder')
  );

CREATE POLICY "Admins can delete defects" ON defects
  FOR DELETE USING (get_project_role(project_id) = 'admin');

CREATE POLICY "Members can view media" ON defect_media
  FOR SELECT USING (
    defect_id IN (
      SELECT id FROM defects WHERE is_project_member(project_id)
    )
  );

CREATE POLICY "Members can upload media" ON defect_media
  FOR INSERT WITH CHECK (
    defect_id IN (
      SELECT id FROM defects
      WHERE is_project_member(project_id)
        AND get_project_role(project_id) IN ('admin', 'melder')
    )
  );

CREATE POLICY "Admins can delete media" ON defect_media
  FOR DELETE USING (
    defect_id IN (
      SELECT id FROM defects
      WHERE get_project_role(project_id) = 'admin'
    )
  );;
