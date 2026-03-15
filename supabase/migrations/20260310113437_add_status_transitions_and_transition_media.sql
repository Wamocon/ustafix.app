
-- ============================================================
-- Status Transition Log: records every status change with proof
-- ============================================================
CREATE TABLE defect_status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  from_status defect_status NOT NULL,
  to_status defect_status NOT NULL,
  note TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transitions_defect ON defect_status_transitions(defect_id);
CREATE INDEX idx_transitions_created ON defect_status_transitions(defect_id, created_at);

-- ============================================================
-- Transition Media: photos/videos attached to a status transition
-- ============================================================
CREATE TABLE transition_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_id UUID NOT NULL REFERENCES defect_status_transitions(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transition_media ON transition_media(transition_id);

-- ============================================================
-- RLS for defect_status_transitions
-- ============================================================
ALTER TABLE defect_status_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transitions_select" ON defect_status_transitions
  FOR SELECT USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

CREATE POLICY "transitions_insert" ON defect_status_transitions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND changed_by = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- ============================================================
-- RLS for transition_media
-- ============================================================
ALTER TABLE transition_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transition_media_select" ON transition_media
  FOR SELECT USING (
    transition_id IN (
      SELECT t.id FROM defect_status_transitions t
      JOIN defects d ON d.id = t.defect_id
      WHERE is_project_member(d.project_id)
    )
  );

CREATE POLICY "transition_media_insert" ON transition_media
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND transition_id IN (
      SELECT t.id FROM defect_status_transitions t
      WHERE t.changed_by = auth.uid()
    )
  );

-- ============================================================
-- Enable Realtime for transitions
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE defect_status_transitions;

-- ============================================================
-- Update storage bucket: reduce file size limit to 15MB
-- ============================================================
UPDATE storage.buckets
SET file_size_limit = 15728640
WHERE id = 'defect-media';
;
