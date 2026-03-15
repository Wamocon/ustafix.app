
CREATE INDEX IF NOT EXISTS idx_defects_created_by ON defects(created_by);
CREATE INDEX IF NOT EXISTS idx_defects_unit_id ON defects(unit_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_defect_comments_user_id ON defect_comments(user_id);
;
