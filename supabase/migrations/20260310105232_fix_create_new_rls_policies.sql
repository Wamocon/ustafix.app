
-- Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id IN (
    SELECT p.organization_id FROM public.projects p
    JOIN public.project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = auth.uid()
  )
);
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT USING (public.is_project_member(id));
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    NOT EXISTS (SELECT 1 FROM public.project_members WHERE user_id = auth.uid())
    OR organization_id IN (
      SELECT p.organization_id FROM public.projects p
      JOIN public.project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = auth.uid() AND pm.role IN ('admin', 'manager')
    )
  )
);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (public.is_admin_or_manager(id));
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (public.is_project_admin(id));

-- Project Members
CREATE POLICY "pm_select" ON project_members FOR SELECT USING (public.is_project_member(project_id));
CREATE POLICY "pm_insert" ON project_members FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND public.is_admin_or_manager(project_id) = true
);
CREATE POLICY "pm_update" ON project_members FOR UPDATE USING (public.is_admin_or_manager(project_id));
CREATE POLICY "pm_delete" ON project_members FOR DELETE USING (public.is_admin_or_manager(project_id));

-- Units
CREATE POLICY "units_select" ON units FOR SELECT USING (public.is_project_member(project_id));
CREATE POLICY "units_insert" ON units FOR INSERT WITH CHECK (
  public.is_project_member(project_id) AND public.is_admin_or_manager(project_id)
);

-- Defects
CREATE POLICY "defects_select" ON defects FOR SELECT USING (public.is_project_member(project_id));
CREATE POLICY "defects_insert" ON defects FOR INSERT WITH CHECK (public.is_project_member(project_id));
CREATE POLICY "defects_update" ON defects FOR UPDATE USING (public.is_project_member(project_id));
CREATE POLICY "defects_delete" ON defects FOR DELETE USING (public.is_admin_or_manager(project_id));

-- Defect Media
CREATE POLICY "media_select" ON defect_media FOR SELECT USING (
  defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);
CREATE POLICY "media_insert" ON defect_media FOR INSERT WITH CHECK (
  defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "media_delete_admin_manager" ON defect_media FOR DELETE USING (
  defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_admin_or_manager(d.project_id))
);
CREATE POLICY "media_delete_worker_own" ON defect_media FOR DELETE USING (
  created_by = auth.uid()
  AND defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);

-- Defect Comments
ALTER TABLE defect_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON defect_comments FOR SELECT USING (
  defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);
CREATE POLICY "comments_insert" ON defect_comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
  AND defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
);
CREATE POLICY "comments_delete" ON defect_comments FOR DELETE USING (
  (user_id = auth.uid())
  OR defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_admin_or_manager(d.project_id))
);
;
