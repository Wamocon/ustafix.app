
-- ============================================================
-- Phase 0: Foundation Fixes
-- ============================================================

-- 1) Document existing RPC functions (CREATE OR REPLACE is idempotent)

CREATE OR REPLACE FUNCTION get_defect_comments_with_info(p_defect_id UUID)
RETURNS TABLE(id UUID, defect_id UUID, user_id UUID, message TEXT, email TEXT, full_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT dc.id, dc.defect_id, dc.user_id, dc.message, au.email, au.raw_user_meta_data->>'full_name', dc.created_at
  FROM public.defect_comments dc
  JOIN auth.users au ON au.id = dc.user_id
  WHERE dc.defect_id = p_defect_id
  AND dc.defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  ORDER BY dc.created_at;
$$;

CREATE OR REPLACE FUNCTION get_project_members_with_info(p_project_id UUID)
RETURNS TABLE(id UUID, user_id UUID, role member_role, email TEXT, full_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT pm.id, pm.user_id, pm.role, au.email, au.raw_user_meta_data->>'full_name', pm.created_at
  FROM public.project_members pm
  JOIN auth.users au ON au.id = pm.user_id
  WHERE pm.project_id = p_project_id
  AND public.is_project_member(p_project_id)
  ORDER BY pm.created_at;
$$;

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

-- 2) Tighten storage DELETE policy: only the uploader can delete their own files
DROP POLICY IF EXISTS "Authenticated users can delete own" ON storage.objects;

CREATE POLICY "Owner can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'defect-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND owner = auth.uid()
  );
;
