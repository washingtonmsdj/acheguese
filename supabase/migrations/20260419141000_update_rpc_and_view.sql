-- ============================================================================
-- COMMUNITY ALERTS — Atualizar RPC e View para SSOT Territorial
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_alert(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
