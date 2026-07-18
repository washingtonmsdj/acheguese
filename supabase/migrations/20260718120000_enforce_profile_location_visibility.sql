-- Raw territorial identifiers can reveal a neighborhood even when the profile
-- chose hidden or city-only visibility. Browser roles read only the consented
-- territorial projection from public_profiles; owners use the private broker.

REVOKE SELECT (location_id, main_territory_location_id)
  ON TABLE public.profiles
  FROM anon, authenticated;

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
  CASE
    WHEN p.public_location_visibility = 'district' THEN t.district_id
    WHEN p.public_location_visibility = 'city_only' THEN t.city_id
    ELSE NULL
  END AS location_id,
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

COMMENT ON VIEW public.public_profiles IS
  'Canonical PII-free public profile projection. Territory identifiers are reduced to the level explicitly selected by public_location_visibility.';
