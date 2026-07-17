-- Consolidates entity coverage under one server-owned, transactional contract.
-- Coverage is public discovery data, but every mutation is authorized in SQL.

CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  coverage_type TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  radius_km NUMERIC NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  center_latitude DOUBLE PRECISION NULL,
  center_longitude DOUBLE PRECISION NULL,
  coverage_polygon public.geometry NULL,
  CONSTRAINT service_areas_entity_type_check CHECK (
    entity_type IN ('business', 'service_provider', 'classified', 'mobility_driver', 'ad_campaign')
  ),
  CONSTRAINT service_areas_coverage_type_check CHECK (
    coverage_type IN ('district', 'city', 'radius')
  ),
  CONSTRAINT service_areas_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT valid_radius_for_type CHECK (
    (coverage_type = 'radius' AND radius_km BETWEEN 1 AND 100)
    OR (coverage_type <> 'radius' AND radius_km IS NULL)
  ),
  CONSTRAINT unique_coverage_per_entity_location UNIQUE (
    entity_type,
    entity_id,
    location_id,
    coverage_type
  )
);

-- Existing remote environments predate the canonical migration file. Keep the
-- migration replayable without replacing extension-owned geometry objects.
ALTER TABLE public.service_areas
  ADD COLUMN IF NOT EXISTS center_latitude DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS center_longitude DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS coverage_polygon public.geometry NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_entity
  ON public.service_areas (entity_type, entity_id, status);

CREATE INDEX IF NOT EXISTS idx_service_areas_location
  ON public.service_areas (location_id, entity_type, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_areas_one_primary
  ON public.service_areas (entity_type, entity_id)
  WHERE is_primary = TRUE;

DROP TRIGGER IF EXISTS update_service_areas_updated_at ON public.service_areas;
CREATE TRIGGER update_service_areas_updated_at
  BEFORE UPDATE ON public.service_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_areas_select ON public.service_areas;
DROP POLICY IF EXISTS service_areas_insert_service_role ON public.service_areas;
DROP POLICY IF EXISTS service_areas_update_service_role ON public.service_areas;
DROP POLICY IF EXISTS service_areas_delete_service_role ON public.service_areas;
DROP POLICY IF EXISTS public_read_service_areas ON public.service_areas;

CREATE POLICY public_read_service_areas
  ON public.service_areas
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

REVOKE ALL PRIVILEGES ON TABLE public.service_areas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.service_areas TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.service_areas TO service_role;

CREATE OR REPLACE FUNCTION private.require_coverage_entity_write(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_is_privileged BOOLEAN := COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE(public.is_admin_from_roles(auth.uid()), FALSE);
  v_entity_exists BOOLEAN := FALSE;
  v_actor_owns_entity BOOLEAN := FALSE;
BEGIN
  IF p_entity_type IS NULL
    OR p_entity_type NOT IN (
      'business',
      'service_provider',
      'classified',
      'mobility_driver',
      'ad_campaign'
    )
  THEN
    RAISE EXCEPTION 'Unsupported coverage entity type'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'Coverage entity id is required'
      USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_privileged THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication is required'
        USING ERRCODE = '42501';
    END IF;

    v_actor_profile_id := private.current_active_profile_id();
    IF v_actor_profile_id IS NULL THEN
      RAISE EXCEPTION 'An active profile is required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  CASE p_entity_type
    WHEN 'business' THEN
      SELECT
        TRUE,
        v_is_privileged OR business.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.business_data business
      WHERE business.id = p_entity_id;

    WHEN 'service_provider' THEN
      SELECT
        TRUE,
        v_is_privileged OR professional.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.professional_data professional
      WHERE professional.id = p_entity_id;

    WHEN 'classified' THEN
      SELECT
        TRUE,
        v_is_privileged
          OR classified.seller_id = v_actor_profile_id
          OR classified.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.classifieds classified
      WHERE classified.id = p_entity_id;

    WHEN 'mobility_driver' THEN
      SELECT
        TRUE,
        v_is_privileged OR driver.profile_id = v_actor_profile_id
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.driver_data driver
      WHERE driver.id = p_entity_id;

    WHEN 'ad_campaign' THEN
      SELECT
        TRUE,
        v_is_privileged
          OR campaign.created_by_profile_id = v_actor_profile_id
          OR EXISTS (
            SELECT 1
            FROM public.business_data owner_business
            WHERE owner_business.id = campaign.owner_business_id
              AND owner_business.profile_id = v_actor_profile_id
          )
      INTO v_entity_exists, v_actor_owns_entity
      FROM public.ad_campaigns campaign
      WHERE campaign.id = p_entity_id;
  END CASE;

  IF NOT COALESCE(v_entity_exists, FALSE)
    OR NOT COALESCE(v_actor_owns_entity, FALSE)
  THEN
    -- Deliberately avoid disclosing whether another actor's entity exists.
    RAISE EXCEPTION 'Coverage entity is unavailable for this actor'
      USING ERRCODE = '42501';
  END IF;

  RETURN v_actor_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION private.require_coverage_entity_write(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.require_coverage_entity_write(TEXT, UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION public.replace_entity_coverage(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_coverages JSONB
)
RETURNS SETOF public.service_areas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication is required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.require_coverage_entity_write(p_entity_type, p_entity_id);

  IF p_coverages IS NULL OR jsonb_typeof(p_coverages) <> 'array' THEN
    RAISE EXCEPTION 'Coverages must be a JSON array'
      USING ERRCODE = '22023';
  END IF;

  v_count := jsonb_array_length(p_coverages);
  IF v_count > 50 THEN
    RAISE EXCEPTION 'At most 50 coverage areas are allowed'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_coverages) item
    WHERE jsonb_typeof(item) <> 'object'
  ) THEN
    RAISE EXCEPTION 'Every coverage entry must be an object'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_coverages) AS item(
      coverage_type TEXT,
      location_id UUID,
      radius_km NUMERIC,
      is_primary BOOLEAN
    )
    WHERE item.coverage_type IS NULL
      OR item.coverage_type NOT IN ('district', 'city', 'radius')
      OR item.location_id IS NULL
      OR (
        item.coverage_type = 'radius'
        AND (item.radius_km IS NULL OR item.radius_km < 1 OR item.radius_km > 100)
      )
      OR (item.coverage_type <> 'radius' AND item.radius_km IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Coverage entries contain invalid type, location or radius'
      USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(*)
    FROM jsonb_to_recordset(p_coverages) AS item(
      coverage_type TEXT,
      location_id UUID,
      radius_km NUMERIC,
      is_primary BOOLEAN
    )
    WHERE COALESCE(item.is_primary, FALSE)
  ) > 1 THEN
    RAISE EXCEPTION 'Only one primary coverage area is allowed'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_coverages) AS item(
      coverage_type TEXT,
      location_id UUID,
      radius_km NUMERIC,
      is_primary BOOLEAN
    )
    GROUP BY item.coverage_type, item.location_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate coverage areas are not allowed'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_coverages) AS item(
      coverage_type TEXT,
      location_id UUID,
      radius_km NUMERIC,
      is_primary BOOLEAN
    )
    LEFT JOIN public.locations location ON location.id = item.location_id
    WHERE location.id IS NULL OR location.status <> 'active'
  ) THEN
    RAISE EXCEPTION 'Every coverage location must exist and be active'
      USING ERRCODE = '23503';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_entity_type),
    hashtext(p_entity_id::TEXT)
  );

  DELETE FROM public.service_areas area
  WHERE area.entity_type = p_entity_type
    AND area.entity_id = p_entity_id;

  IF v_count > 0 THEN
    INSERT INTO public.service_areas (
      entity_type,
      entity_id,
      coverage_type,
      location_id,
      radius_km,
      is_primary,
      status
    )
    SELECT
      p_entity_type,
      p_entity_id,
      item.coverage_type,
      item.location_id,
      CASE WHEN item.coverage_type = 'radius' THEN item.radius_km ELSE NULL END,
      COALESCE(item.is_primary, FALSE),
      'active'
    FROM jsonb_to_recordset(p_coverages) AS item(
      coverage_type TEXT,
      location_id UUID,
      radius_km NUMERIC,
      is_primary BOOLEAN
    );
  END IF;

  RETURN QUERY
  SELECT area.*
  FROM public.service_areas area
  WHERE area.entity_type = p_entity_type
    AND area.entity_id = p_entity_id
  ORDER BY area.is_primary DESC, area.created_at ASC, area.id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_entity_coverage(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_coverage_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_removed_count INTEGER;
BEGIN
  IF auth.uid() IS NULL AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication is required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.require_coverage_entity_write(p_entity_type, p_entity_id);
  PERFORM pg_advisory_xact_lock(hashtext(p_entity_type), hashtext(p_entity_id::TEXT));

  DELETE FROM public.service_areas area
  WHERE area.entity_type = p_entity_type
    AND area.entity_id = p_entity_id
    AND (p_coverage_id IS NULL OR area.id = p_coverage_id);

  GET DIAGNOSTICS v_removed_count = ROW_COUNT;
  RETURN v_removed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_entity_coverage_status(
  p_coverage_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_area public.service_areas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication is required'
      USING ERRCODE = '42501';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid coverage status'
      USING ERRCODE = '22023';
  END IF;

  SELECT area.*
  INTO v_area
  FROM public.service_areas area
  WHERE area.id = p_coverage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coverage area not found'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.require_coverage_entity_write(v_area.entity_type, v_area.entity_id);

  UPDATE public.service_areas area
  SET status = p_status
  WHERE area.id = p_coverage_id;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_entity_coverage(TEXT, UUID, JSONB)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_entity_coverage(TEXT, UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_entity_coverage_status(UUID, TEXT)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.replace_entity_coverage(TEXT, UUID, JSONB)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_entity_coverage(TEXT, UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_entity_coverage_status(UUID, TEXT)
  TO authenticated, service_role;

COMMENT ON TABLE public.service_areas IS
  'Canonical SSOT for territorial coverage of independently owned platform entities.';
COMMENT ON FUNCTION public.replace_entity_coverage(TEXT, UUID, JSONB) IS
  'Atomically replaces coverage after deriving and authorizing the active actor profile.';

-- The geospatial prototype RPCs used a different taxonomy and accepted browser
-- coordinates as authority. There are no remaining runtime or database callers.
DROP FUNCTION IF EXISTS public.add_coverage_by_location(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.add_coverage_by_radius(TEXT, UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.check_coverage(TEXT, UUID, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.find_entities_with_coverage(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS public.get_coverage_areas(TEXT, UUID);
DROP FUNCTION IF EXISTS public.remove_coverage(UUID);
