
-- Fix auth_rls_initplan: wrap auth.uid() in (select ...) to avoid per-row re-evaluation
-- This is a Supabase 2026 best practice for RLS performance

-- Organizations
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id IN (
    SELECT p.organization_id FROM public.projects p
    JOIN public.project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Projects INSERT
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
  (select auth.uid()) IS NOT NULL
  AND (
    NOT EXISTS (SELECT 1 FROM public.project_members WHERE user_id = (select auth.uid()))
    OR organization_id IN (
      SELECT p.organization_id FROM public.projects p
      JOIN public.project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = (select auth.uid()) AND pm.role IN ('admin', 'manager')
    )
  )
);

-- Project Members INSERT
DROP POLICY IF EXISTS "pm_insert" ON project_members;
CREATE POLICY "pm_insert" ON project_members FOR INSERT WITH CHECK (
  (select auth.uid()) IS NOT NULL AND public.is_admin_or_manager(project_id) = true
);

-- Defect Media INSERT
DROP POLICY IF EXISTS "media_insert" ON defect_media;
CREATE POLICY "media_insert" ON defect_media FOR INSERT WITH CHECK (
  defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  AND (created_by IS NULL OR created_by = (select auth.uid()))
);

-- Defect Media DELETE (worker own) 
DROP POLICY IF EXISTS "media_delete_worker_own" ON defect_media;
CREATE POLICY "media_delete_worker_own" ON defect_media FOR DELETE USING (
  created_by = (select auth.uid())
  AND defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);

-- Defect Comments INSERT
DROP POLICY IF EXISTS "comments_insert" ON defect_comments;
CREATE POLICY "comments_insert" ON defect_comments FOR INSERT WITH CHECK (
  (select auth.uid()) IS NOT NULL AND user_id = (select auth.uid())
  AND defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);

-- Defect Comments DELETE
DROP POLICY IF EXISTS "comments_delete" ON defect_comments;
CREATE POLICY "comments_delete" ON defect_comments FOR DELETE USING (
  (user_id = (select auth.uid()))
  OR defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_admin_or_manager(d.project_id))
);

-- Missing index for defect_media.created_by
CREATE INDEX IF NOT EXISTS idx_defect_media_created_by ON defect_media(created_by);
;
