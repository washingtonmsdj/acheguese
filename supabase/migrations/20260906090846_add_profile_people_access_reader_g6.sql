-- G6 People & Access read model.
-- Owners/managers may see the active team roster with safe identity fields.
-- auth.users remains inaccessible to browser SQL.

CREATE OR REPLACE FUNCTION public.list_profile_access_members(
  p_profile_id uuid
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz,
  is_active boolean,
  updated_at timestamptz,
  email text,
  display_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
SET statement_timeout = '3s'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT COALESCE(
    private.user_can_manage_profile(auth.uid(), p_profile_id),
    false
  ) THEN
    RAISE EXCEPTION 'profile_people_access_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    pm.id,
    pm.profile_id,
    pm.user_id,
    pm.role,
    pm.joined_at,
    pm.is_active,
    pm.updated_at,
    au.email::text,
    COALESCE(identity_profile.display_name, identity_profile.name, au.email)::text
  FROM public.profile_members pm
  JOIN auth.users au
    ON au.id = pm.user_id
  LEFT JOIN LATERAL (
    SELECT p.display_name, p.name
    FROM public.profiles p
    WHERE p.user_id = pm.user_id
      AND p.is_active
    ORDER BY
      CASE WHEN p.profile_type = 'personal' THEN 0 ELSE 1 END,
      p.created_at ASC,
      p.id ASC
    LIMIT 1
  ) identity_profile ON true
  WHERE pm.profile_id = p_profile_id
    AND pm.is_active
  ORDER BY
    CASE pm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    pm.joined_at ASC,
    pm.id ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_profile_access_members(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_profile_access_members(uuid)
TO authenticated;

COMMENT ON FUNCTION public.list_profile_access_members(uuid) IS
  'Bounded People & Access reader. Only profile owner/manager can list active team identities; auth.users remains inaccessible to browser SQL.';
