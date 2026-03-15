
-- ============================================================
-- 1. Drop ALL existing RLS policies (old broken ones)
-- ============================================================
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Members can view projects" ON projects;

DROP POLICY IF EXISTS "pm_delete" ON project_members;
DROP POLICY IF EXISTS "pm_insert" ON project_members;
DROP POLICY IF EXISTS "pm_select" ON project_members;
DROP POLICY IF EXISTS "pm_update" ON project_members;
DROP POLICY IF EXISTS "Admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Admins can remove members" ON project_members;
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update_role" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;

DROP POLICY IF EXISTS "orgs_insert" ON organizations;
DROP POLICY IF EXISTS "orgs_select" ON organizations;
DROP POLICY IF EXISTS "orgs_update" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

DROP POLICY IF EXISTS "Members can create units" ON units;
DROP POLICY IF EXISTS "Members can view units" ON units;

DROP POLICY IF EXISTS "Members can create defects" ON defects;
DROP POLICY IF EXISTS "Members can update defects" ON defects;
DROP POLICY IF EXISTS "Members can view defects" ON defects;
DROP POLICY IF EXISTS "Admins can delete defects" ON defects;

DROP POLICY IF EXISTS "Members can upload media" ON defect_media;
DROP POLICY IF EXISTS "Members can view media" ON defect_media;
DROP POLICY IF EXISTS "Admins can delete media" ON defect_media;

-- ============================================================
-- 2. Drop functions that depend on member_role type
-- ============================================================
DROP FUNCTION IF EXISTS get_project_role(UUID);
DROP FUNCTION IF EXISTS is_admin_or_manager(UUID);
DROP FUNCTION IF EXISTS is_project_admin(UUID);
DROP FUNCTION IF EXISTS is_project_member(UUID);
DROP FUNCTION IF EXISTS get_project_organization_id(UUID);
DROP FUNCTION IF EXISTS is_manager_or_admin_in_org(UUID);

-- ============================================================
-- 3. Migrate member_role enum: (admin,melder,viewer) -> (admin,manager,worker)
-- ============================================================
CREATE TYPE member_role_new AS ENUM ('admin', 'manager', 'worker');

ALTER TABLE project_members ADD COLUMN role_new member_role_new;

UPDATE project_members SET role_new = CASE role::text
  WHEN 'admin' THEN 'admin'::member_role_new
  WHEN 'melder' THEN 'manager'::member_role_new
  WHEN 'viewer' THEN 'worker'::member_role_new
  ELSE 'worker'::member_role_new
END;

ALTER TABLE project_members DROP COLUMN role;
ALTER TABLE project_members RENAME COLUMN role_new TO role;
ALTER TABLE project_members ALTER COLUMN role SET NOT NULL;
ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'worker';

DROP TYPE member_role;
ALTER TYPE member_role_new RENAME TO member_role;
;
