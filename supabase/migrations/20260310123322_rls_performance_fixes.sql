
-- Fix RLS initplan performance: wrap auth.uid() in (select ...)

-- push_subscriptions
DROP POLICY IF EXISTS "Users manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING ((select auth.uid()) = user_id);

-- notification_preferences
DROP POLICY IF EXISTS "Users manage own preferences" ON notification_preferences;
CREATE POLICY "Users manage own preferences" ON notification_preferences
  FOR ALL USING ((select auth.uid()) = user_id);

-- transitions_insert
DROP POLICY IF EXISTS "transitions_insert" ON defect_status_transitions;
CREATE POLICY "transitions_insert" ON defect_status_transitions
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL AND changed_by = (select auth.uid())
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- transition_media_insert
DROP POLICY IF EXISTS "transition_media_insert" ON transition_media;
CREATE POLICY "transition_media_insert" ON transition_media
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND transition_id IN (
      SELECT t.id FROM defect_status_transitions t WHERE t.changed_by = (select auth.uid())
    )
  );

-- phase_updates_insert
DROP POLICY IF EXISTS "phase_updates_insert" ON phase_updates;
CREATE POLICY "phase_updates_insert" ON phase_updates
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND created_by = (select auth.uid())
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- phase_update_media_insert
DROP POLICY IF EXISTS "phase_update_media_insert" ON phase_update_media;
CREATE POLICY "phase_update_media_insert" ON phase_update_media
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND phase_update_id IN (
      SELECT pu.id FROM phase_updates pu WHERE pu.created_by = (select auth.uid())
    )
  );

-- protocols_insert
DROP POLICY IF EXISTS "protocols_insert" ON acceptance_protocols;
CREATE POLICY "protocols_insert" ON acceptance_protocols
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND created_by = (select auth.uid())
    AND is_admin_or_manager(project_id)
  );

-- verdicts_insert
DROP POLICY IF EXISTS "verdicts_insert" ON protocol_defect_verdicts;
CREATE POLICY "verdicts_insert" ON protocol_defect_verdicts
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND protocol_id IN (
      SELECT ap.id FROM acceptance_protocols ap WHERE is_admin_or_manager(ap.project_id)
    )
  );

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_protocols_created_by ON acceptance_protocols(created_by);
CREATE INDEX IF NOT EXISTS idx_phase_updates_created_by ON phase_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_verdicts_defect ON protocol_defect_verdicts(defect_id);
;
