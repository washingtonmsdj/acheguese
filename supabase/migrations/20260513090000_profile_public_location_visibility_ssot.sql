-- Canonical public location visibility for personal profiles
-- SSOT:
--   user_residences -> addresses -> locations
-- Public profile must not expose full residential address.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_location_visibility TEXT NOT NULL DEFAULT 'city_only';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_public_location_visibility_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_public_location_visibility_check
      CHECK (public_location_visibility IN ('hidden', 'city_only', 'district'));
  END IF;
END $$;

DROP VIEW IF EXISTS public_profiles CASCADE;

CREATE VIEW public_profiles AS
WITH primary_residence AS (
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    ur.location_id
  FROM user_residences ur
  ORDER BY ur.user_id, ur.is_primary DESC, ur.created_at DESC
),
territory AS (
  SELECT
    pr.user_id,
    district.id AS district_id,
    district.name AS district_name,
    city.id AS city_id,
    city.name AS city_name,
    COALESCE(city.metadata->>'state_code', district.metadata->>'state_code') AS state_code
  FROM primary_residence pr
  LEFT JOIN locations district ON district.id = pr.location_id
  LEFT JOIN locations city
    ON (
      (district.type = 'district' AND city.id = district.parent_id)
      OR (district.type = 'city' AND city.id = district.id)
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
  p.updated_at
FROM profiles p
LEFT JOIN territory t ON t.user_id = p.user_id
WHERE p.is_active = true;

COMMENT ON VIEW public_profiles IS
'Public profile view with location visibility policy derived from user residence SSOT.';
