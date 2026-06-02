-- ============================================================================
-- COMMUNITY ALERTS — Atualizar RPC e View para SSOT Territorial
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_alert(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id             uuid := auth.uid();
  v_profile_id          uuid;
  v_location_id         uuid;
  v_location            record;
  v_latitude            double precision;
  v_longitude           double precision;
  v_neighborhood_display text;
  v_city                text;
  v_alert_id            uuid;
  v_category            text;
  v_title               text;
  v_description         text;
  v_alert_count         integer;
  v_duplicate_count     integer;
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

  SELECT l.id, l.name, l.type, l.status, l.metadata, parent.name as parent_name
  INTO v_location
  FROM locations l
  LEFT JOIN locations parent ON parent.id = l.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type != 'district' THEN
    RETURN jsonb_build_object('error', 'location_must_be_district');
  END IF;

  IF v_location.metadata ? 'centroid' THEN
    v_latitude := (v_location.metadata->'centroid'->>'lat')::double precision;
    v_longitude := (v_location.metadata->'centroid'->>'lng')::double precision;
  END IF;

  v_neighborhood_display := v_location.name;
  v_city := v_location.parent_name;

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
  FROM community_alerts
  WHERE profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_alert_count >= 3 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM community_alerts
  WHERE profile_id = v_profile_id
    AND type = v_category
    AND location_id = v_location_id
    AND created_at > NOW() - INTERVAL '30 minutes'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_alert');
  END IF;

  INSERT INTO community_alerts (
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

  INSERT INTO community_alert_audit (alert_id, actor_id, action_type, metadata)
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

DROP VIEW IF EXISTS community_alerts_public CASCADE;

CREATE OR REPLACE VIEW community_alerts_public AS
SELECT
  id,
  location_id,
  latitude,
  longitude,
  neighborhood_display,
  city,
  created_at,
  updated_at
FROM community_alerts
WHERE location_id IS NOT NULL;
