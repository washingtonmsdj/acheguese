-- Tighten the public profile projection and the private reader introduced by
-- 20260718100000. Suspended identities are not public, private reads must be
-- bounded, and ordinary profile members do not receive the full private row.

DROP POLICY IF EXISTS "Public can view active public profiles" ON public.profiles;

CREATE POLICY "Public can view active public profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND COALESCE(is_public, true) = true
    AND COALESCE(is_suspended, false) = false
  );

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
WITH primary_residence AS (
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    ur.location_id
  FROM public.user_residences ur
  ORDER BY ur.user_id, ur.is_primary DESC, ur.created_at DESC
),
territory AS (
  SELECT
    pr.user_id,
    locality.id AS district_id,
    locality.name AS district_name,
    city.id AS city_id,
    city.name AS city_name,
    COALESCE(city.metadata->>'state_code', locality.metadata->>'state_code') AS state_code
  FROM primary_residence pr
  LEFT JOIN public.locations locality ON locality.id = pr.location_id
  LEFT JOIN public.locations city
    ON (
      (locality.type IN ('district', 'neighborhood') AND city.id = locality.parent_id)
      OR (locality.type = 'city' AND city.id = locality.id)
    )
)
SELECT
  p.id,
  p.user_id,
  p.profile_type,
  p.display_name,
  p.username,
  p.slug,
  p.bio,
  p.avatar_url,
  p.public_location_visibility,
  CASE
    WHEN p.public_location_visibility = 'hidden' THEN NULL
    ELSE t.city_name
  END AS city,
  CASE
    WHEN p.public_location_visibility = 'district' THEN t.district_name
    ELSE NULL
  END AS neighborhood,
  t.city_name AS public_city,
  CASE
    WHEN p.public_location_visibility = 'district' THEN t.district_name
    ELSE NULL
  END AS public_neighborhood,
  t.state_code AS state,
  p.location_id,
  p.reputation,
  p.pontos,
  p.is_active,
  p.created_at,
  p.updated_at,
  COALESCE(NULLIF(p.display_name, ''), NULLIF(p.name, ''), p.username, 'Perfil') AS name,
  p.handle,
  p.verified,
  p.verified_at,
  p.website
FROM public.profiles p
LEFT JOIN territory t ON t.user_id = p.user_id
WHERE p.is_active = true
  AND COALESCE(p.is_public, true) = true
  AND COALESCE(p.is_suspended, false) = false;

CREATE OR REPLACE FUNCTION public.profile_rpc_get_accessible_profiles(
  p_actor_user_id UUID,
  p_profile_ids UUID[] DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_profile_type TEXT DEFAULT NULL
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF p_actor_user_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_actor_user_id)
  THEN
    RAISE EXCEPTION 'Authenticated actor is required' USING ERRCODE = '42501';
  END IF;

  IF p_profile_ids IS NULL AND p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'A bounded profile scope is required' USING ERRCODE = '22023';
  END IF;

  IF p_profile_ids IS NOT NULL AND cardinality(p_profile_ids) > 100 THEN
    RAISE EXCEPTION 'At most 100 profile ids are allowed' USING ERRCODE = '22023';
  END IF;

  IF p_profile_type IS NOT NULL
    AND p_profile_type NOT IN ('personal', 'business', 'professional', 'driver', 'community')
  THEN
    RAISE EXCEPTION 'Invalid profile type' USING ERRCODE = '22023';
  END IF;

  v_is_admin := private.is_admin(p_actor_user_id);

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE (p_profile_ids IS NULL OR p.id = ANY(p_profile_ids))
    AND (p_target_user_id IS NULL OR p.user_id = p_target_user_id)
    AND (p_profile_type IS NULL OR p.profile_type = p_profile_type)
    AND (
      v_is_admin
      OR p.user_id = p_actor_user_id
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p.id
          AND pm.user_id = p_actor_user_id
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin')
      )
    )
  ORDER BY p.is_active DESC, p.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_get_accessible_profiles(UUID, UUID[], UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_get_accessible_profiles(UUID, UUID[], UUID, TEXT)
  TO service_role;

COMMENT ON FUNCTION public.profile_rpc_get_accessible_profiles(UUID, UUID[], UUID, TEXT) IS
  'Service-role-only bounded profile reader. The verified actor must own, administer, or manage each returned profile.';
