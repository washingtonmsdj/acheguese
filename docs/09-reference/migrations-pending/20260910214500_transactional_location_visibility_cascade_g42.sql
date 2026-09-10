-- G42 pending cutover: make territorial location visibility updates atomic.
--
-- This migration stays in migrations-pending until the target Postgres is
-- reachable and the current remote Edge can be cut over in the same controlled
-- operation. The browser never executes this RPC directly: the authenticated
-- territorial-update-location-visibility Edge verifies admin + MFA/AAL2 and
-- injects p_actor_user_id from the verified JWT.
--
-- Semantics preserved from the product contract:
--   * any canonical visibility flag updates the requested location;
--   * setting is_selector_active=false additionally hides every descendant;
--   * setting is_selector_active=true does NOT force descendants back on;
--   * landing/navigation changes do not cascade.
--
-- Scale contract: G5 already proved the canonical descendant set for normal
-- locations through the indexed geographic_path prefix. Do not regress this
-- mutation to a recursive row-by-row traversal.

BEGIN;

DO $preflight$
DECLARE
  v_pattern_index_ready BOOLEAN;
BEGIN
  IF to_regclass('public.locations') IS NULL THEN
    RAISE EXCEPTION 'preflight: public.locations missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.locations'::regclass
      AND attname = 'geographic_path'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'preflight: public.locations.geographic_path missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.locations'::regclass
      AND attname = 'metadata'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'preflight: public.locations.metadata missing';
  END IF;

  SELECT i.indisvalid AND i.indisready
  INTO v_pattern_index_ready
  FROM pg_index AS i
  WHERE i.indexrelid = to_regclass('public.idx_locations_geographic_path_pattern');

  IF COALESCE(v_pattern_index_ready, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'preflight: indexed geographic_path prefix contract missing';
  END IF;

  IF to_regprocedure('public.rpc_get_location_descendants_ids(uuid)') IS NULL THEN
    RAISE EXCEPTION 'preflight: canonical descendant resolver missing';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.locations', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.locations', 'UPDATE') THEN
    RAISE EXCEPTION 'preflight: service_role lacks required locations privileges';
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.territorial_update_location_visibility(
  p_location_id UUID,
  p_flag TEXT,
  p_value BOOLEAN,
  p_actor_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_path TEXT;
  v_affected_count INTEGER := 0;
  v_location JSONB;
  v_cascade BOOLEAN := p_flag = 'is_selector_active' AND p_value IS FALSE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'invalid_location_id' USING ERRCODE = '22023';
  END IF;

  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_actor_user_id' USING ERRCODE = '22023';
  END IF;

  IF p_flag IS NULL OR p_flag NOT IN (
    'is_selector_active',
    'is_landing_enabled',
    'is_navigable'
  ) THEN
    RAISE EXCEPTION 'invalid_visibility_flag' USING ERRCODE = '22023';
  END IF;

  IF p_value IS NULL THEN
    RAISE EXCEPTION 'invalid_visibility_value' USING ERRCODE = '22023';
  END IF;

  -- Administrative visibility changes are rare and correctness is more
  -- important than write concurrency here. Lock the hierarchy against
  -- concurrent structural writes so a new descendant cannot be attached while
  -- the indexed prefix scope is being mutated.
  LOCK TABLE public.locations IN SHARE ROW EXCLUSIVE MODE;

  SELECT location.geographic_path
  INTO v_path
  FROM public.locations AS location
  WHERE location.id = p_location_id;

  IF v_path IS NULL THEN
    RAISE EXCEPTION 'location_not_found' USING ERRCODE = 'P0002';
  END IF;

  WITH updated AS (
    UPDATE public.locations AS target
    SET
      metadata = COALESCE(target.metadata, '{}'::JSONB)
        || jsonb_build_object(
          p_flag, p_value,
          'updated_by', p_actor_user_id,
          'updated_at', v_now
        ),
      updated_at = v_now
    WHERE
      target.id = p_location_id
      OR (
        v_cascade
        AND target.geographic_path LIKE v_path || '/%'
      )
    RETURNING
      target.id,
      target.parent_id,
      target.type,
      target.slug,
      target.name,
      target.full_name,
      target.geographic_path,
      target.status,
      target.metadata,
      target.created_at,
      target.updated_at
  )
  SELECT
    count(*)::INTEGER,
    (
      jsonb_agg(to_jsonb(updated))
      FILTER (WHERE updated.id = p_location_id)
    )->0
  INTO v_affected_count, v_location
  FROM updated;

  IF v_affected_count < 1 OR v_location IS NULL THEN
    RAISE EXCEPTION 'location_visibility_update_not_persisted';
  END IF;

  IF (v_location->'metadata'->p_flag) IS DISTINCT FROM to_jsonb(p_value) THEN
    RAISE EXCEPTION 'location_visibility_ack_mismatch';
  END IF;

  RETURN jsonb_build_object(
    'location', v_location,
    'affectedCount', v_affected_count,
    'cascaded', v_cascade
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.territorial_update_location_visibility(UUID, TEXT, BOOLEAN, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.territorial_update_location_visibility(UUID, TEXT, BOOLEAN, UUID)
  TO service_role;

DO $postcondition$
DECLARE
  v_definition TEXT;
BEGIN
  IF has_function_privilege(
    'authenticated',
    'public.territorial_update_location_visibility(uuid,text,boolean,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: authenticated can execute territorial visibility RPC';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.territorial_update_location_visibility(uuid,text,boolean,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: service_role cannot execute territorial visibility RPC';
  END IF;

  SELECT pg_get_functiondef(
    'public.territorial_update_location_visibility(uuid,text,boolean,uuid)'::regprocedure
  ) INTO v_definition;

  IF position('target.geographic_path LIKE v_path || ''/%''' in v_definition) = 0 THEN
    RAISE EXCEPTION 'postcondition: indexed descendant prefix scope missing';
  END IF;

  IF position('LOCK TABLE public.locations IN SHARE ROW EXCLUSIVE MODE' in v_definition) = 0 THEN
    RAISE EXCEPTION 'postcondition: hierarchy write lock missing';
  END IF;

  IF position('service_role_required' in v_definition) = 0 THEN
    RAISE EXCEPTION 'postcondition: service-role boundary missing';
  END IF;
END
$postcondition$;

NOTIFY pgrst, 'reload schema';
COMMIT;
