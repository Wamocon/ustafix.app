-- Show defect comments with newest first (Fragen & Anweisungen)
CREATE OR REPLACE FUNCTION public.get_defect_comments_with_info(p_defect_id UUID)
RETURNS TABLE(id UUID, defect_id UUID, user_id UUID, message TEXT, email TEXT, full_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
  SELECT dc.id, dc.defect_id, dc.user_id, dc.message, au.email, au.raw_user_meta_data->>'full_name', dc.created_at
  FROM public.defect_comments dc
  JOIN auth.users au ON au.id = dc.user_id
  WHERE dc.defect_id = p_defect_id
  AND dc.defect_id IN (SELECT d.id FROM public.defects d WHERE public.is_project_member(d.project_id))
  ORDER BY dc.created_at DESC;
$$;
