-- public_profiles remains security_invoker. This narrowly scoped function is
-- the only public boundary allowed to derive consented territory from the
-- private residence SSOT.

-- security-authority: public-rpc public.profile_public_territory_projection
CREATE OR REPLACE FUNCTION public.profile_public_territory_projection(
  p_profile_id UUID
)
RETURNS TABLE (
  public_location_visibility TEXT,
  city TEXT,
  neighborhood TEXT,
  state TEXT,
  location_id UUID
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
ROWS 1
AS $$
  WITH profile_scope AS (
    SELECT p.user_id, p.public_location_visibility
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.is_active = true
      AND COALESCE(p.is_public, true) = true
      AND COALESCE(p.is_suspended, false) = false
  )
  SELECT
    p.public_location_visibility,
    CASE
      WHEN p.public_location_visibility IN ('city_only', 'district') THEN city.name
      ELSE NULL
    END AS city,
    CASE
      WHEN p.public_location_visibility = 'district' THEN locality.name
      ELSE NULL
    END AS neighborhood,
    CASE
      WHEN p.public_location_visibility IN ('city_only', 'district')
        THEN COALESCE(city.metadata->>'state_code', locality.metadata->>'state_code')
      ELSE NULL
    END AS state,
    CASE
      WHEN p.public_location_visibility = 'district' THEN locality.id
      WHEN p.public_location_visibility = 'city_only' THEN city.id
      ELSE NULL
    END AS location_id
  FROM profile_scope p
  LEFT JOIN LATERAL (
    SELECT ur.location_id
    FROM public.user_residences ur
    WHERE ur.user_id = p.user_id
    ORDER BY ur.is_primary DESC, ur.created_at DESC
    LIMIT 1
  ) residence ON true
  LEFT JOIN public.locations locality ON locality.id = residence.location_id
  LEFT JOIN public.locations city
    ON (
      (locality.type IN ('district', 'neighborhood') AND city.id = locality.parent_id)
      OR (locality.type = 'city' AND city.id = locality.id)
    );
$$;

REVOKE ALL ON FUNCTION public.profile_public_territory_projection(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_public_territory_projection(UUID)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.profile_public_territory_projection(UUID) IS
  'Public, PII-free residence projection. Returns only the city or district level explicitly consented by an active, public, non-suspended profile.';

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
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
  territory.city,
  territory.neighborhood,
  territory.city AS public_city,
  territory.neighborhood AS public_neighborhood,
  territory.state,
  territory.location_id,
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
LEFT JOIN LATERAL public.profile_public_territory_projection(p.id) territory ON true
WHERE p.is_active = true
  AND COALESCE(p.is_public, true) = true
  AND COALESCE(p.is_suspended, false) = false;

COMMENT ON VIEW public.public_profiles IS
  'Canonical PII-free public profile projection. Territory is derived by the narrow consent-aware profile_public_territory_projection boundary.';
