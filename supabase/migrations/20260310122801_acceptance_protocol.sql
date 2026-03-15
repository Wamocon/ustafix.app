
-- Acceptance Protocol System
CREATE TYPE acceptance_verdict AS ENUM ('akzeptiert', 'beanstandet', 'zurueckgestellt');

-- Acceptance protocols (per unit or project-wide)
CREATE TABLE acceptance_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  participants TEXT NOT NULL,
  general_notes TEXT,
  consent_clause TEXT NOT NULL DEFAULT 'Beide Parteien stimmen der elektronischen Form dieses Protokolls zu.',
  signature_contractor TEXT,
  signature_client TEXT,
  integrity_hash TEXT,
  pdf_storage_path TEXT,
  supersedes_id UUID REFERENCES acceptance_protocols(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_protocols_project ON acceptance_protocols(project_id);
CREATE INDEX idx_protocols_unit ON acceptance_protocols(unit_id);

-- Per-defect verdict within a protocol
CREATE TABLE protocol_defect_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES acceptance_protocols(id) ON DELETE CASCADE,
  defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  verdict acceptance_verdict NOT NULL,
  correction_deadline TIMESTAMPTZ,
  note TEXT,
  UNIQUE(protocol_id, defect_id)
);
CREATE INDEX idx_verdicts_protocol ON protocol_defect_verdicts(protocol_id);

-- RLS
ALTER TABLE acceptance_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_defect_verdicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "protocols_select" ON acceptance_protocols
  FOR SELECT USING (is_project_member(project_id));

CREATE POLICY "protocols_insert" ON acceptance_protocols
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_admin_or_manager(project_id)
  );

CREATE POLICY "verdicts_select" ON protocol_defect_verdicts
  FOR SELECT USING (
    protocol_id IN (
      SELECT ap.id FROM acceptance_protocols ap WHERE is_project_member(ap.project_id)
    )
  );

CREATE POLICY "verdicts_insert" ON protocol_defect_verdicts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND protocol_id IN (
      SELECT ap.id FROM acceptance_protocols ap WHERE is_admin_or_manager(ap.project_id)
    )
  );

-- Private storage bucket for signed protocols
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'protocols',
  'protocols',
  false,
  52428800,
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for protocols bucket
CREATE POLICY "Project members can view protocols" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'protocols' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin/Manager can upload protocols" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'protocols' AND auth.uid() IS NOT NULL
  );
;
