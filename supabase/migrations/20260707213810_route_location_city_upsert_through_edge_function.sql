CREATE OR REPLACE FUNCTION public.rpc_upsert_canonical_city_by_ibge(
  p_state_code TEXT,
  p_city_name TEXT,
  p_ibge_code TEXT
)
RETURNS TABLE (
  city_id UUID,
  state_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_state_code TEXT;
  v_city_name TEXT;
  v_ibge_code TEXT;
  v_state_id UUID;
  v_city_id UUID;
  v_city_slug TEXT;
  v_is_service_role BOOLEAN := COALESCE(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF auth.uid() IS NULL AND NOT v_is_service_role THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_state_code := lower(trim(COALESCE(p_state_code, '')));
  v_city_name := trim(COALESCE(p_city_name, ''));
  v_ibge_code := regexp_replace(COALESCE(p_ibge_code, ''), '\D', '', 'g');

  IF v_state_code = '' OR length(v_state_code) <> 2 THEN
    RAISE EXCEPTION 'invalid_state_code';
  END IF;
  IF v_city_name = '' THEN
    RAISE EXCEPTION 'invalid_city_name';
  END IF;
  IF length(v_ibge_code) < 6 THEN
    RAISE EXCEPTION 'invalid_ibge_code';
  END IF;

  SELECT id INTO v_state_id
  FROM locations
  WHERE type = 'state'
    AND lower(slug) = v_state_code
    AND status = 'active'
  LIMIT 1;

  IF v_state_id IS NULL THEN
    RAISE EXCEPTION 'state_not_seeded';
  END IF;

  SELECT id INTO v_city_id
  FROM locations
  WHERE type = 'city'
    AND parent_id = v_state_id
    AND (
      metadata->>'ibge_code' = v_ibge_code
      OR lower(name) = lower(v_city_name)
    )
  LIMIT 1;

  IF v_city_id IS NULL THEN
    v_city_slug := regexp_replace(lower(v_city_name), '[^a-z0-9]+', '-', 'g');
    v_city_slug := regexp_replace(v_city_slug, '(^-+|-+$)', '', 'g');
    IF v_city_slug = '' THEN
      RAISE EXCEPTION 'invalid_city_slug';
    END IF;

    INSERT INTO locations (
      parent_id,
      type,
      slug,
      name,
      full_name,
      geographic_path,
      metadata,
      status
    )
    VALUES (
      v_state_id,
      'city',
      v_city_slug,
      v_city_name,
      v_city_name || ', ' || upper(v_state_code) || ', Brasil',
      '/br/' || v_state_code || '/' || v_city_slug,
      jsonb_build_object(
        'ibge_code', v_ibge_code,
        'state_code', upper(v_state_code),
        'country_code', 'BR',
        'seed_source', 'rpc_upsert_canonical_city_by_ibge'
      ),
      'active'
    )
    RETURNING id INTO v_city_id;
  ELSE
    UPDATE locations
    SET
      name = v_city_name,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'ibge_code', v_ibge_code,
        'state_code', upper(v_state_code),
        'country_code', 'BR'
      ),
      status = 'active',
      updated_at = now()
    WHERE id = v_city_id;
  END IF;

  RETURN QUERY SELECT v_city_id, v_state_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(text, text, text)
  TO service_role;

COMMENT ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(text, text, text)
  IS 'Canonical city reconciliation helper. Browser access is routed through location-rpc and validated server-side.';
