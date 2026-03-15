-- Add 'problem' to defect_status enum
ALTER TYPE defect_status ADD VALUE IF NOT EXISTS 'problem';

-- Update get_dashboard_stats to include problem count
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'user_id', v_user_id,
    'projects', (
      SELECT COALESCE(jsonb_agg(proj ORDER BY proj->>'name'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'address', p.address,
          'status', p.status::text,
          'my_role', pm.role::text,
          'created_at', p.created_at,
          'defect_counts', (
            SELECT jsonb_build_object(
              'offen', count(*) FILTER (WHERE d.status = 'offen'),
              'in_arbeit', count(*) FILTER (WHERE d.status = 'in_arbeit'),
              'erledigt', count(*) FILTER (WHERE d.status = 'erledigt'),
              'problem', count(*) FILTER (WHERE d.status = 'problem'),
              'total', count(*)
            )
            FROM public.defects d WHERE d.project_id = p.id
          ),
          'priority_counts', (
            SELECT jsonb_build_object(
              'hoch', count(*) FILTER (WHERE d.priority = 'hoch' AND d.status NOT IN ('erledigt')),
              'mittel', count(*) FILTER (WHERE d.priority = 'mittel' AND d.status NOT IN ('erledigt')),
              'niedrig', count(*) FILTER (WHERE d.priority = 'niedrig' AND d.status NOT IN ('erledigt'))
            )
            FROM public.defects d WHERE d.project_id = p.id
          ),
          'member_count', (
            SELECT count(*) FROM public.project_members pm2 WHERE pm2.project_id = p.id
          ),
          'member_roles', (
            SELECT jsonb_build_object(
              'admin', count(*) FILTER (WHERE pm2.role = 'admin'),
              'manager', count(*) FILTER (WHERE pm2.role = 'manager'),
              'worker', count(*) FILTER (WHERE pm2.role = 'worker')
            )
            FROM public.project_members pm2 WHERE pm2.project_id = p.id
          ),
          'pending_invitations', (
            SELECT count(*) FROM public.project_invitations pi
            WHERE pi.project_id = p.id AND pi.status = 'pending' AND pi.expires_at > now()
          ),
          'protocol_count', (
            SELECT count(*) FROM public.acceptance_protocols ap WHERE ap.project_id = p.id
          ),
          'my_defects_open', (
            SELECT count(*) FROM public.defects d 
            WHERE d.project_id = p.id AND d.created_by = v_user_id AND d.status NOT IN ('erledigt')
          ),
          'recent_transitions', (
            SELECT COALESCE(jsonb_agg(t ORDER BY t->>'created_at' DESC), '[]'::jsonb)
            FROM (
              SELECT jsonb_build_object(
                'id', dst.id,
                'defect_id', dst.defect_id,
                'defect_title', d.title,
                'from_status', dst.from_status::text,
                'to_status', dst.to_status::text,
                'changed_by_name', COALESCE(u.raw_user_meta_data->>'full_name', u.email),
                'created_at', dst.created_at
              ) AS t
              FROM public.defect_status_transitions dst
              JOIN public.defects d ON d.id = dst.defect_id
              JOIN auth.users u ON u.id = dst.changed_by
              WHERE d.project_id = p.id
              ORDER BY dst.created_at DESC
              LIMIT 5
            ) sub
          )
        ) AS proj
        FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id AND pm.user_id = v_user_id
      ) sub2
    ),
    'highest_role', (
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.user_id = v_user_id AND pm.role = 'admin') THEN 'admin'
        WHEN EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.user_id = v_user_id AND pm.role = 'manager') THEN 'manager'
        ELSE 'worker'
      END
    ),
    'total_defects_by_me', (
      SELECT count(*) FROM public.defects d WHERE d.created_by = v_user_id
    ),
    'user_name', (
      SELECT COALESCE(u.raw_user_meta_data->>'full_name', u.email)
      FROM auth.users u WHERE u.id = v_user_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;;
