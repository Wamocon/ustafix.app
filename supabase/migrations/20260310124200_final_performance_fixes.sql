
-- Fix 3 unindexed foreign keys flagged by Supabase advisor
CREATE INDEX IF NOT EXISTS idx_protocols_supersedes ON acceptance_protocols (supersedes_id) WHERE supersedes_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transitions_changed_by ON defect_status_transitions (changed_by);
CREATE INDEX IF NOT EXISTS idx_phase_updates_project ON phase_updates (project_id);

-- Merge two permissive DELETE policies on defect_media into one
DROP POLICY IF EXISTS "media_delete_admin_manager" ON defect_media;
DROP POLICY IF EXISTS "media_delete_worker_own" ON defect_media;

CREATE POLICY "media_delete" ON defect_media FOR DELETE USING (
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
;
