-- G43 pending: make territorial group visibility updates atomic.
--
-- Do not deploy territorial-update-group-visibility with the source that calls
-- this command until this migration is promoted and proven in the same target
-- environment. The Edge owns admin/MFA/AAL2 authorization and protected audit;
-- SQL owns only the atomic row mutation and acknowledgement.
--
-- Privacy cleanup: the historical Edge stored admin UUID in
-- territorial_groups.metadata.updated_by. Active groups are publicly readable,
-- and no runtime consumer uses that key. This command removes that public UUID
-- when the group visibility is next updated. Actor identity remains in the
-- protected Edge audit instead.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.territorial_groups') IS NULL THEN
    RAISE EXCEPTION 'preflight: public.territorial_groups missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.territorial_groups'::regclass
      AND attname = 'metadata'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'preflight: territorial_groups.metadata missing';
  END IF;

  IF NOT has_table_privilege(
    'service_role',
    'public.territorial_groups',
    'SELECT,UPDATE'
  ) THEN
    RAISE EXCEPTION 'preflight: service_role lacks territorial_groups privileges';
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.territorial_update_group_visibility(
  p_group_id UUID,
  p_flag TEXT,
  p_value BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_group JSONB;
BEGIN
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'invalid_group_id' USING ERRCODE = '22023';
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

  UPDATE public.territorial_groups AS group_row
  SET
    metadata = (COALESCE(group_row.metadata, '{}'::JSONB) - 'updated_by')
      || jsonb_build_object(
        p_flag, p_value,
        'updated_at', v_now
      ),
    updated_at = v_now
  WHERE group_row.id = p_group_id
  RETURNING to_jsonb(group_row) INTO v_group;

  IF v_group IS NULL THEN
    RAISE EXCEPTION 'group_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF (v_group->'metadata'->p_flag) IS DISTINCT FROM to_jsonb(p_value) THEN
    RAISE EXCEPTION 'group_visibility_ack_mismatch';
  END IF;

  IF (v_group->'metadata') ? 'updated_by' THEN
    RAISE EXCEPTION 'group_visibility_actor_leak_not_removed';
  END IF;

  RETURN jsonb_build_object('group', v_group);
END;
$function$;

REVOKE ALL ON FUNCTION public.territorial_update_group_visibility(UUID, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.territorial_update_group_visibility(UUID, TEXT, BOOLEAN)
  TO service_role;

DO $postcondition$
DECLARE
  v_definition TEXT;
BEGIN
  IF has_function_privilege(
    'anon',
    'public.territorial_update_group_visibility(uuid,text,boolean)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.territorial_update_group_visibility(uuid,text,boolean)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: browser role can execute group visibility command';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.territorial_update_group_visibility(uuid,text,boolean)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: service_role cannot execute group visibility command';
  END IF;

  SELECT pg_get_functiondef(
    'public.territorial_update_group_visibility(uuid,text,boolean)'::regprocedure
  ) INTO v_definition;

  IF position("metadata = (COALESCE(group_row.metadata, '{}'::JSONB) - 'updated_by')" in v_definition) = 0
     OR position('jsonb_build_object' in v_definition) = 0 THEN
    RAISE EXCEPTION 'postcondition: atomic metadata merge/privacy cleanup missing';
  END IF;

  IF position('auth.role()' in v_definition) <> 0 THEN
    RAISE EXCEPTION 'postcondition: deprecated auth.role boundary reintroduced';
  END IF;
END
$postcondition$;

NOTIFY pgrst, 'reload schema';
COMMIT;
