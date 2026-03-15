
-- ============================================================
-- 1. Schema additions
-- ============================================================
ALTER TABLE defect_media ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS defect_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_defect_comments_defect ON defect_comments(defect_id);

-- ============================================================
-- 2. Helper functions (with secure search_path)
-- ============================================================
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS member_role AS $$
  SELECT role FROM public.project_members
  WHERE project_id = p_project_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_admin_or_manager(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.get_project_role(p_project_id) IN ('admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_project_admin(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.get_project_role(p_project_id) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Look up user by email (for team invites - replaces listUsers)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Get project members with names (for UI display)
CREATE OR REPLACE FUNCTION get_project_members_with_info(p_project_id UUID)
RETURNS TABLE(id UUID, user_id UUID, role member_role, email text, full_name text, created_at timestamptz) AS $$
  SELECT pm.id, pm.user_id, pm.role, au.email, au.raw_user_meta_data->>'full_name', pm.created_at
  FROM public.project_members pm
  JOIN auth.users au ON au.id = pm.user_id
  WHERE pm.project_id = p_project_id
  AND public.is_project_member(p_project_id)
  ORDER BY pm.created_at;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Get defect comments with user names (for UI display)
CREATE OR REPLACE FUNCTION get_defect_comments_with_info(p_defect_id UUID)
RETURNS TABLE(id UUID, defect_id UUID, user_id UUID, message text, email text, full_name text, created_at timestamptz) AS $$
  SELECT dc.id, dc.defect_id, dc.user_id, dc.message, au.email, au.raw_user_meta_data->>'full_name', dc.created_at
  FROM public.defect_comments dc
  JOIN auth.users au ON au.id = dc.user_id
  WHERE dc.defect_id = p_defect_id
  AND dc.defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  ORDER BY dc.created_at;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';
;
