
-- Phase System: Add phase tracking to media
CREATE TYPE media_phase AS ENUM ('erfassung', 'fortschritt', 'abnahme');

-- Add phase column to defect_media
ALTER TABLE defect_media ADD COLUMN phase media_phase NOT NULL DEFAULT 'erfassung';
CREATE INDEX idx_media_phase ON defect_media(defect_id, phase);

-- Add phase column to transition_media
ALTER TABLE transition_media ADD COLUMN phase media_phase NOT NULL DEFAULT 'fortschritt';

-- Phase updates table (for progress updates between status transitions)
CREATE TABLE phase_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase media_phase NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phase_updates_defect ON phase_updates(defect_id, created_at);

-- Phase update media (photos/videos attached to phase updates)
CREATE TABLE phase_update_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_update_id UUID NOT NULL REFERENCES phase_updates(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phase_update_media ON phase_update_media(phase_update_id);

-- RLS for phase_updates
ALTER TABLE phase_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phase_updates_select" ON phase_updates
  FOR SELECT USING (
    defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

CREATE POLICY "phase_updates_insert" ON phase_updates
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND defect_id IN (SELECT d.id FROM defects d WHERE is_project_member(d.project_id))
  );

-- RLS for phase_update_media
ALTER TABLE phase_update_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phase_update_media_select" ON phase_update_media
  FOR SELECT USING (
    phase_update_id IN (
      SELECT pu.id FROM phase_updates pu
      JOIN defects d ON d.id = pu.defect_id
      WHERE is_project_member(d.project_id)
    )
  );

CREATE POLICY "phase_update_media_insert" ON phase_update_media
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND phase_update_id IN (
      SELECT pu.id FROM phase_updates pu WHERE pu.created_by = auth.uid()
    )
  );

-- Enable Realtime for phase_updates
ALTER PUBLICATION supabase_realtime ADD TABLE phase_updates;
;
