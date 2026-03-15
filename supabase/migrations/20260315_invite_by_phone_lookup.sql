-- Add RPC lookup by phone for direct project invitation

CREATE OR REPLACE FUNCTION get_user_id_by_phone(p_phone TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT id
  FROM auth.users
  WHERE regexp_replace(COALESCE(phone, ''), '[^0-9+]', '', 'g') = regexp_replace(COALESCE(p_phone, ''), '[^0-9+]', '', 'g')
  LIMIT 1;
$$;
