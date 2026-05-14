BEGIN;

-- National minimum SSOT base:
-- - Ensure Brazil country node
-- - Ensure all 27 states
-- - Provide controlled RPC to upsert canonical city by IBGE code

DO $$
DECLARE
  v_country_id UUID;
BEGIN
  SELECT id INTO v_country_id
  FROM locations
  WHERE type = 'country'
    AND lower(slug) = 'br'
  LIMIT 1;

  IF v_country_id IS NULL THEN
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
      NULL,
      'country',
      'br',
      'Brasil',
      'Brasil',
      '/br',
      jsonb_build_object('country_code', 'BR'),
      'active'
    )
    RETURNING id INTO v_country_id;
  END IF;
END $$;

WITH country AS (
  SELECT id
  FROM locations
  WHERE type = 'country'
    AND lower(slug) = 'br'
  LIMIT 1
),
states(uf, state_name, region_name) AS (
  VALUES
    ('ac', 'Acre', 'Norte'),
    ('al', 'Alagoas', 'Nordeste'),
    ('ap', 'Amapa', 'Norte'),
    ('am', 'Amazonas', 'Norte'),
    ('ba', 'Bahia', 'Nordeste'),
    ('ce', 'Ceara', 'Nordeste'),
    ('df', 'Distrito Federal', 'Centro-Oeste'),
    ('es', 'Espirito Santo', 'Sudeste'),
    ('go', 'Goias', 'Centro-Oeste'),
    ('ma', 'Maranhao', 'Nordeste'),
    ('mt', 'Mato Grosso', 'Centro-Oeste'),
    ('ms', 'Mato Grosso do Sul', 'Centro-Oeste'),
    ('mg', 'Minas Gerais', 'Sudeste'),
    ('pa', 'Para', 'Norte'),
    ('pb', 'Paraiba', 'Nordeste'),
    ('pr', 'Parana', 'Sul'),
    ('pe', 'Pernambuco', 'Nordeste'),
    ('pi', 'Piaui', 'Nordeste'),
    ('rj', 'Rio de Janeiro', 'Sudeste'),
    ('rn', 'Rio Grande do Norte', 'Nordeste'),
    ('rs', 'Rio Grande do Sul', 'Sul'),
    ('ro', 'Rondonia', 'Norte'),
    ('rr', 'Roraima', 'Norte'),
    ('sc', 'Santa Catarina', 'Sul'),
    ('sp', 'Sao Paulo', 'Sudeste'),
    ('se', 'Sergipe', 'Nordeste'),
    ('to', 'Tocantins', 'Norte')
)
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
SELECT
  c.id AS parent_id,
  'state'::location_type AS type,
  s.uf AS slug,
  s.state_name AS name,
  s.state_name || ', Brasil' AS full_name,
  '/br/' || s.uf AS geographic_path,
  jsonb_build_object(
    'state_code', upper(s.uf),
    'region', s.region_name,
    'country_code', 'BR'
  ) AS metadata,
  'active'::location_status AS status
FROM states s
CROSS JOIN country c
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  metadata = locations.metadata || EXCLUDED.metadata,
  status = 'active',
  updated_at = now();

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
SET search_path = public
AS $$
DECLARE
  v_state_code TEXT;
  v_city_name TEXT;
  v_ibge_code TEXT;
  v_state_id UUID;
  v_city_id UUID;
  v_city_slug TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
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

REVOKE ALL ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(TEXT, TEXT, TEXT) IS
  'Upserts canonical city by IBGE code under a seeded state. Controlled backend reconciliation; frontend must not insert locations directly.';

COMMIT;

