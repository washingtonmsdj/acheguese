-- Harden community creation RPCs with canonical verified residence checks.
--
-- The UI already gates these actions through CommunityAccessPolicy. This
-- migration makes the database contract equivalent for direct RPC calls.

CREATE OR REPLACE FUNCTION public.auth_has_verified_residence_at_location(
  p_location_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_residences ur
    WHERE ur.user_id = auth.uid()
      AND ur.location_id = p_location_id
      AND ur.is_verified = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.auth_has_verified_residence_at_location(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_has_verified_residence_at_location(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.auth_has_verified_residence_at_location(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_community_alert(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  v_category             text;
  v_title                text;
  v_description          text;
  v_alert_count          integer;
  v_duplicate_count      integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT id INTO v_profile_id
  FROM public.profiles
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
  FROM public.locations l
  LEFT JOIN public.locations parent ON parent.id = l.parent_id
  LEFT JOIN public.locations grandparent ON grandparent.id = parent.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type NOT IN ('neighborhood', 'district') THEN
    RETURN jsonb_build_object('error', 'location_must_be_locality');
  END IF;

  IF NOT public.auth_has_verified_residence_at_location(v_location_id) THEN
    RETURN jsonb_build_object('error', 'verified_residence_required');
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

  v_category := payload->>'category';
  v_title := COALESCE(NULLIF(payload->>'title', ''), v_category);
  v_description := payload->>'description';

  IF v_category NOT IN (
    'tiroteio_disparos',
    'assalto_em_andamento',
    'tentativa_de_invasao',
    'incendio_explosao',
    'acidente_grave',
    'alagamento_deslizamento',
    'risco_na_via',
    'pessoa_vulneravel_em_risco'
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;

  IF char_length(COALESCE(v_description, '')) < 20 OR char_length(v_description) > 280 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;

  SELECT COUNT(*)
  INTO v_alert_count
  FROM public.community_alerts
  WHERE profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_alert_count >= 3 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM public.community_alerts
  WHERE profile_id = v_profile_id
    AND type = v_category
    AND location_id = v_location_id
    AND created_at > NOW() - INTERVAL '30 minutes'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_alert');
  END IF;

  INSERT INTO public.community_alerts (
    profile_id,
    type,
    title,
    description,
    status,
    location_id,
    latitude,
    longitude,
    neighborhood_display,
    city,
    coordinate_source
  ) VALUES (
    v_profile_id,
    v_category,
    v_title,
    v_description,
    'ativo',
    v_location_id,
    v_latitude,
    v_longitude,
    v_neighborhood_display,
    v_city,
    CASE WHEN v_latitude IS NULL OR v_longitude IS NULL THEN NULL ELSE 'territory_centroid' END
  )
  RETURNING id INTO v_alert_id;

  INSERT INTO public.community_alert_audit (alert_id, actor_id, action_type, metadata)
  VALUES (
    v_alert_id,
    v_user_id,
    'created',
    jsonb_build_object(
      'category', v_category,
      'location_id', v_location_id,
      'city', v_city,
      'neighborhood', v_neighborhood_display
    )
  );

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

CREATE OR REPLACE FUNCTION public.create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  FROM public.profiles
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
  FROM public.locations l
  LEFT JOIN public.locations parent ON parent.id = l.parent_id
  LEFT JOIN public.locations grandparent ON grandparent.id = parent.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type NOT IN ('neighborhood', 'district') THEN
    RETURN jsonb_build_object('error', 'location_must_be_locality');
  END IF;

  IF NOT public.auth_has_verified_residence_at_location(v_location_id) THEN
    RETURN jsonb_build_object('error', 'verified_residence_required');
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
  FROM public.community_issues
  WHERE author_profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_issue_count >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM public.community_issues
  WHERE author_profile_id = v_profile_id
    AND category = v_category
    AND location_id = v_location_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_issue');
  END IF;

  INSERT INTO public.community_issues (
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

  INSERT INTO public.community_issue_audit (issue_id, actor_id, action_type, metadata)
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

REVOKE ALL ON FUNCTION public.create_community_alert(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_community_alert(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_community_alert(jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.create_community_issue(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_community_issue(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_community_issue(JSONB) TO authenticated;
