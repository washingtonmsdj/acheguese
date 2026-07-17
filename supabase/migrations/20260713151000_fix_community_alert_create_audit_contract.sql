-- Keep alert creation auditable through the canonical social audit log.
-- The caller is the authenticated community-rpc Edge Function, which invokes
-- this service-role-only RPC with the verified actor injected server-side.

CREATE INDEX IF NOT EXISTS idx_community_alerts_profile_created
  ON public.community_alerts (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_alerts_profile_type_location_active_created
  ON public.community_alerts (profile_id, type, location_id, created_at DESC)
  WHERE removed_at IS NULL;

CREATE OR REPLACE FUNCTION public.create_community_alert(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
DECLARE
  v_user_id UUID := CASE
    WHEN COALESCE(auth.role(), '') = 'service_role'
      THEN NULLIF(payload->>'_actor_user_id', '')::UUID
    ELSE auth.uid()
  END;
  v_profile_id UUID;
  v_location_id UUID;
  v_location RECORD;
  v_latitude DOUBLE PRECISION;
  v_longitude DOUBLE PRECISION;
  v_neighborhood_display TEXT;
  v_city TEXT;
  v_alert_id UUID;
  v_category TEXT := lower(btrim(COALESCE(payload->>'category', '')));
  v_title TEXT;
  v_description TEXT := btrim(COALESCE(payload->>'description', ''));
  v_alert_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT profile.id
  INTO v_profile_id
  FROM public.profiles profile
  WHERE profile.user_id = v_user_id
    AND profile.is_active = TRUE
  ORDER BY profile.created_at ASC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  BEGIN
    v_location_id := NULLIF(payload->>'location_id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END;

  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'location_id_required');
  END IF;

  SELECT
    location.id,
    location.name,
    location.type,
    location.metadata,
    parent.name AS parent_name,
    parent.type AS parent_type,
    grandparent.name AS grandparent_name
  INTO v_location
  FROM public.locations location
  LEFT JOIN public.locations parent ON parent.id = location.parent_id
  LEFT JOIN public.locations grandparent ON grandparent.id = parent.parent_id
  WHERE location.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type NOT IN ('neighborhood', 'district') THEN
    RETURN jsonb_build_object('error', 'location_must_be_locality');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_residences residence
    WHERE residence.user_id = v_user_id
      AND residence.location_id = v_location_id
      AND residence.is_verified = TRUE
  ) THEN
    RETURN jsonb_build_object('error', 'verified_residence_required');
  END IF;

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

  v_title := COALESCE(NULLIF(btrim(COALESCE(payload->>'title', '')), ''), v_category);
  IF char_length(v_title) > 120 THEN
    RETURN jsonb_build_object('error', 'invalid_title_length');
  END IF;
  IF char_length(v_description) NOT BETWEEN 20 AND 280 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;

  -- Serializes the per-profile limit and duplicate check under concurrent requests.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('community-alert-create:' || v_profile_id::TEXT, 0)
  );

  SELECT count(*)::INTEGER
  INTO v_alert_count
  FROM public.community_alerts alert
  WHERE alert.profile_id = v_profile_id
    AND alert.created_at > now() - INTERVAL '24 hours';

  IF v_alert_count >= 3 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_alerts alert
    WHERE alert.profile_id = v_profile_id
      AND alert.type = v_category
      AND alert.location_id = v_location_id
      AND alert.created_at > now() - INTERVAL '30 minutes'
      AND alert.removed_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'duplicate_alert');
  END IF;

  IF v_location.metadata ? 'centroid' THEN
    v_latitude := (v_location.metadata->'centroid'->>'lat')::DOUBLE PRECISION;
    v_longitude := (v_location.metadata->'centroid'->>'lng')::DOUBLE PRECISION;
  ELSIF v_location.metadata ? 'center_latitude'
        AND v_location.metadata ? 'center_longitude' THEN
    v_latitude := (v_location.metadata->>'center_latitude')::DOUBLE PRECISION;
    v_longitude := (v_location.metadata->>'center_longitude')::DOUBLE PRECISION;
  END IF;

  v_neighborhood_display := v_location.name;
  v_city := CASE
    WHEN v_location.parent_type = 'city' THEN v_location.parent_name
    ELSE v_location.grandparent_name
  END;

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
    CASE
      WHEN v_latitude IS NULL OR v_longitude IS NULL THEN NULL
      ELSE 'territory_centroid'
    END
  )
  RETURNING id INTO v_alert_id;

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    v_user_id,
    v_profile_id,
    'insert',
    'community_alert',
    v_alert_id,
    v_location_id,
    jsonb_build_object(
      'operation', 'created',
      'category', v_category,
      'city', v_city,
      'neighborhood', v_neighborhood_display
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'alert_id', v_alert_id,
    'location_id', v_location_id,
    'latitude', v_latitude,
    'longitude', v_longitude
  );
EXCEPTION WHEN OTHERS THEN
  -- Internal database details must not cross the Edge Function boundary.
  RETURN jsonb_build_object('error', 'internal_error');
END;
$func$;

REVOKE ALL ON FUNCTION public.create_community_alert(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_alert(JSONB)
  TO service_role;

COMMENT ON FUNCTION public.create_community_alert(JSONB) IS
  'Service-role-only alert creation for community-rpc; actor is authenticated by the Edge Function and audit is written atomically.';
