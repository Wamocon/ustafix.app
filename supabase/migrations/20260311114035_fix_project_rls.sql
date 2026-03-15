-- Fix RLS policies for project creation
-- Issue: Admin cannot create new projects - new row violates row-level security policy

-- Helper: check if project has no members yet (for creator self-add)
CREATE OR REPLACE FUNCTION public.project_has_no_members(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p_project_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public;

-- 1. Simplify projects_insert: allow any authenticated user to create a project
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix project_members_insert: allow adding yourself as first member (project creator)
--    OR allow admin/manager to add other members
DROP POLICY IF EXISTS "project_members_insert" ON public.project_members;
CREATE POLICY "project_members_insert" ON public.project_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (user_id = auth.uid() AND public.project_has_no_members(project_id))
      OR
      public.is_admin_or_manager(project_id) = true
    )
  );;
