-- Accept canonical municipal neighborhoods in territorial features.
-- The public API still uses the word "bairro"; internally, the canonical
-- municipal type is neighborhood and IBGE fallback remains district.

CREATE OR REPLACE FUNCTION create_community_alert(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_user_id              uuid := auth.uid();
  v_profile_id           uuid;
  v_location_id          uuid;
  v_location             record;
  v_latitude             double precision;
  v_longitude            double precision;
  v_neighborhood_display text;
  v_city                 text;
  v_alert_id             uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY created_at ASC LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  v_location_id := (payload->>'location_id')::uuid;

  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'location_id_required');
  END IF;

  SELECT
    l.id,
    l.name,
    l.type,
    l.status,
    l.metadata,
    parent.name AS parent_name,
    parent.type AS parent_type,
    grandparent.name AS grandparent_name
  INTO v_location
  FROM locations l
  LEFT JOIN locations parent ON parent.id = l.parent_id
  LEFT JOIN locations grandparent ON grandparent.id = parent.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type NOT IN ('neighborhood', 'district') THEN
    RETURN jsonb_build_object('error', 'location_must_be_locality');
  END IF;

  IF v_location.metadata ? 'centroid' THEN
    v_latitude := (v_location.metadata->'centroid'->>'lat')::double precision;
    v_longitude := (v_location.metadata->'centroid'->>'lng')::double precision;
  ELSIF v_location.metadata ? 'center_latitude' AND v_location.metadata ? 'center_longitude' THEN
    v_latitude := (v_location.metadata->>'center_latitude')::double precision;
    v_longitude := (v_location.metadata->>'center_longitude')::double precision;
  END IF;

  v_neighborhood_display := v_location.name;
  v_city := CASE
    WHEN v_location.parent_type = 'city' THEN v_location.parent_name
    ELSE v_location.grandparent_name
  END;

  INSERT INTO community_alerts (
    location_id,
    latitude,
    longitude,
    neighborhood_display,
    city
  ) VALUES (
    v_location_id,
    v_latitude,
    v_longitude,
    v_neighborhood_display,
    v_city
  )
  RETURNING id INTO v_alert_id;

  RETURN jsonb_build_object(
    'success', true,
    'alert_id', v_alert_id,
    'location_id', v_location_id,
    'latitude', v_latitude,
    'longitude', v_longitude
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', 'internal_error', 'detail', SQLERRM);
END;
$func$;

CREATE OR REPLACE FUNCTION create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id             UUID := auth.uid();
  v_profile_id          UUID;
  v_location_id         UUID;
  v_location            RECORD;
  v_issue_count         INTEGER;
  v_duplicate_count     INTEGER;
  v_issue_id            UUID;
  v_category            TEXT;
  v_title               TEXT;
  v_description         TEXT;
  v_address_ref         TEXT;
  v_priority            TEXT;
  v_city_name           TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT id
  INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id
    AND is_active = TRUE
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  v_location_id := (payload->>'location_id')::UUID;
  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'location_id_required');
  END IF;

  SELECT
    l.id,
    l.name,
    l.type,
    l.status,
    parent.id AS parent_id,
    parent.name AS parent_name,
    parent.type AS parent_type,
    grandparent.name AS grandparent_name
  INTO v_location
  FROM locations l
  LEFT JOIN locations parent ON parent.id = l.parent_id
  LEFT JOIN locations grandparent ON grandparent.id = parent.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type NOT IN ('neighborhood', 'district') THEN
    RETURN jsonb_build_object('error', 'location_must_be_locality');
  END IF;

  v_city_name := CASE
    WHEN v_location.parent_type = 'city' THEN v_location.parent_name
    ELSE v_location.grandparent_name
  END;

  v_category := payload->>'category';
  v_title := payload->>'title';
  v_description := payload->>'description';
  v_address_ref := payload->>'address_reference';
  v_priority := COALESCE(payload->>'priority', 'media');

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;

  IF char_length(COALESCE(v_title, '')) < 10 OR char_length(v_title) > 100 THEN
    RETURN jsonb_build_object('error', 'invalid_title_length');
  END IF;

  IF char_length(COALESCE(v_description, '')) < 20 OR char_length(v_description) > 500 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;

  SELECT COUNT(*)
  INTO v_issue_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_issue_count >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND category = v_category
    AND location_id = v_location_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_issue');
  END IF;

  INSERT INTO community_issues (
    author_profile_id,
    profile_id,
    location_id,
    category,
    title,
    description,
    neighborhood,
    neighborhood_display,
    city,
    address_reference,
    priority
  ) VALUES (
    v_profile_id,
    v_profile_id,
    v_location_id,
    v_category,
    v_title,
    v_description,
    lower(trim(v_location.name)),
    v_location.name,
    lower(trim(COALESCE(v_city_name, v_location.name))),
    v_address_ref,
    v_priority
  )
  RETURNING id INTO v_issue_id;

  INSERT INTO community_issue_audit (issue_id, actor_id, action_type, metadata)
  VALUES (
    v_issue_id,
    v_user_id,
    'created',
    jsonb_build_object(
      'category', v_category,
      'location_id', v_location_id,
      'city', COALESCE(v_city_name, v_location.name),
      'neighborhood', v_location.name
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'issue_id', v_issue_id,
    'location_id', v_location_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', 'internal_error', 'detail', SQLERRM);
END;
$func$;

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
    locality.id AS district_id,
    locality.name AS district_name,
    city.id AS city_id,
    city.name AS city_name,
    COALESCE(city.metadata->>'state_code', locality.metadata->>'state_code') AS state_code
  FROM primary_residence pr
  LEFT JOIN locations locality ON locality.id = pr.location_id
  LEFT JOIN locations city
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
  p.updated_at
FROM profiles p
LEFT JOIN territory t ON t.user_id = p.user_id
WHERE p.is_active = true;

COMMENT ON VIEW public_profiles IS
'Public profile view with location visibility policy derived from user residence SSOT.';

ALTER TABLE territory_communities
  DROP CONSTRAINT IF EXISTS territory_communities_territory_type_check;

ALTER TABLE territory_communities
  ADD CONSTRAINT territory_communities_territory_type_check
  CHECK (territory_type IN ('neighborhood', 'district', 'territorial_group'));

UPDATE territory_communities tc
SET territory_type = 'neighborhood',
    updated_at = now()
FROM locations l
WHERE tc.territory_id = l.id
  AND l.type = 'neighborhood'
  AND tc.territory_type = 'district';
