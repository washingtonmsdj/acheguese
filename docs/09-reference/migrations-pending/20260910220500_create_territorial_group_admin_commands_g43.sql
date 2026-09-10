-- G43 phase 1 (pending): introduce server-owned transactional commands for
-- territorial group administration without removing the current browser path.
--
-- Promotion order is intentionally additive:
--   1. run this migration after remote preflight;
--   2. deploy territorial-group-admin-rpc with verify_jwt=true;
--   3. smoke saveGroup/setStatus with an admin AAL2 session;
--   4. switch the browser owner to the broker and certify the frontend;
--   5. only then promote the separate DML-lock migration.
--
-- This ordering prevents an outage while Postgres/Edge/frontend are cut over.
--
-- Authority contract: both commands are SECURITY INVOKER. EXECUTE is revoked
-- from PUBLIC/anon/authenticated and granted only to service_role. The Edge
-- owns end-user admin/MFA authorization; the SQL functions do not duplicate
-- that boundary with deprecated auth.role() checks.
--
-- Concurrency contract: an existing group row is locked before related
-- location rows; selected location rows are locked in deterministic UUID order
-- while scope is validated; membership writes are serialized during the
-- compatibility window so the command cannot observe one set and persist a
-- different set inside its own transaction.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.territorial_groups') IS NULL
     OR to_regclass('public.territorial_group_members') IS NULL
     OR to_regclass('public.locations') IS NULL THEN
    RAISE EXCEPTION 'preflight: territorial group tables are incomplete';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.territorial_groups', 'SELECT,INSERT,UPDATE') THEN
    RAISE EXCEPTION 'preflight: service_role lacks territorial_groups privileges';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.territorial_group_members', 'SELECT,INSERT,DELETE') THEN
    RAISE EXCEPTION 'preflight: service_role lacks territorial_group_members privileges';
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.territorial_admin_save_group(
  p_group_id UUID,
  p_slug TEXT,
  p_name TEXT,
  p_description TEXT,
  p_anchor_city_id UUID,
  p_member_location_ids UUID[],
  p_actor_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_group_id UUID;
  v_existing_anchor UUID;
  v_existing_status TEXT;
  v_member_ids UUID[] := ARRAY[]::UUID[];
  v_member_count INTEGER := 0;
  v_locked_member_count INTEGER := 0;
  v_valid_member_count INTEGER := 0;
  v_group JSONB;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_actor_user_id' USING ERRCODE = '22023';
  END IF;

  p_slug := lower(btrim(COALESCE(p_slug, '')));
  p_name := btrim(COALESCE(p_name, ''));
  p_description := NULLIF(btrim(COALESCE(p_description, '')), '');

  IF char_length(p_slug) < 2
     OR char_length(p_slug) > 120
     OR p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'invalid_group_slug' USING ERRCODE = '22023';
  END IF;

  IF char_length(p_name) < 2 OR char_length(p_name) > 160 THEN
    RAISE EXCEPTION 'invalid_group_name' USING ERRCODE = '22023';
  END IF;

  IF p_description IS NOT NULL AND char_length(p_description) > 1000 THEN
    RAISE EXCEPTION 'invalid_group_description' USING ERRCODE = '22023';
  END IF;

  IF p_anchor_city_id IS NULL THEN
    RAISE EXCEPTION 'invalid_anchor_city' USING ERRCODE = '22023';
  END IF;

  IF p_member_location_ids IS NULL OR cardinality(p_member_location_ids) > 500 THEN
    RAISE EXCEPTION 'invalid_group_members' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(p_member_location_ids) AS member_id
    WHERE member_id IS NULL
  ) THEN
    RAISE EXCEPTION 'invalid_group_members' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT member_id ORDER BY member_id), ARRAY[]::UUID[])
  INTO v_member_ids
  FROM unnest(p_member_location_ids) AS member_id;

  v_member_count := cardinality(v_member_ids);

  -- Keep the lock order stable: group -> anchor city -> member locations ->
  -- membership table. The same group cannot be edited concurrently with a
  -- status transition while its membership snapshot is being replaced.
  IF p_group_id IS NOT NULL THEN
    SELECT group_row.anchor_city_id, group_row.status
    INTO v_existing_anchor, v_existing_status
    FROM public.territorial_groups AS group_row
    WHERE group_row.id = p_group_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'group_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF v_existing_anchor IS DISTINCT FROM p_anchor_city_id THEN
      RAISE EXCEPTION 'anchor_city_immutable' USING ERRCODE = '22023';
    END IF;
  END IF;

  PERFORM city.id
  FROM public.locations AS city
  WHERE city.id = p_anchor_city_id
    AND city.type::TEXT = 'city'
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_anchor_city' USING ERRCODE = '22023';
  END IF;

  PERFORM member.id
  FROM public.locations AS member
  WHERE member.id = ANY(v_member_ids)
  ORDER BY member.id
  FOR SHARE;
  GET DIAGNOSTICS v_locked_member_count = ROW_COUNT;

  IF v_locked_member_count <> v_member_count THEN
    RAISE EXCEPTION 'invalid_group_member_scope' USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::INTEGER
  INTO v_valid_member_count
  FROM public.locations AS member
  WHERE member.id = ANY(v_member_ids)
    AND member.type::TEXT IN ('district', 'neighborhood')
    AND member.status::TEXT = 'active'
    AND member.parent_id = p_anchor_city_id;

  IF v_valid_member_count <> v_member_count THEN
    RAISE EXCEPTION 'invalid_group_member_scope' USING ERRCODE = '22023';
  END IF;

  IF p_group_id IS NULL THEN
    BEGIN
      INSERT INTO public.territorial_groups (
        slug,
        name,
        description,
        anchor_city_id,
        status
      ) VALUES (
        p_slug,
        p_name,
        p_description,
        p_anchor_city_id,
        'inactive'
      )
      RETURNING id INTO v_group_id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE EXCEPTION 'group_slug_conflict' USING ERRCODE = '23505';
    END;
  ELSE
    IF v_existing_status = 'active' AND v_member_count = 0 THEN
      RAISE EXCEPTION 'active_group_requires_member' USING ERRCODE = '23514';
    END IF;

    BEGIN
      UPDATE public.territorial_groups AS group_row
      SET
        slug = p_slug,
        name = p_name,
        description = p_description
      WHERE group_row.id = p_group_id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE EXCEPTION 'group_slug_conflict' USING ERRCODE = '23505';
    END;

    v_group_id := p_group_id;
  END IF;

  -- Phase 1 coexists briefly with the historical browser DML path. Serialize
  -- membership DML while this command replaces the complete set so no old
  -- writer can interleave DELETE/INSERT inside the transaction.
  LOCK TABLE public.territorial_group_members IN SHARE ROW EXCLUSIVE MODE;

  DELETE FROM public.territorial_group_members AS membership
  WHERE membership.group_id = v_group_id;

  IF v_member_count > 0 THEN
    INSERT INTO public.territorial_group_members (group_id, location_id)
    SELECT v_group_id, member_id
    FROM unnest(v_member_ids) AS member_id;
  END IF;

  SELECT to_jsonb(group_row)
  INTO v_group
  FROM public.territorial_groups AS group_row
  WHERE group_row.id = v_group_id;

  IF v_group IS NULL THEN
    RAISE EXCEPTION 'group_save_ack_missing';
  END IF;

  RETURN jsonb_build_object(
    'group', v_group,
    'memberIds', to_jsonb(v_member_ids),
    'memberCount', v_member_count,
    'created', p_group_id IS NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.territorial_admin_set_group_status(
  p_group_id UUID,
  p_status TEXT,
  p_actor_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_group JSONB;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_actor_user_id' USING ERRCODE = '22023';
  END IF;

  IF p_group_id IS NULL OR p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'invalid_group_status_request' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.territorial_groups AS group_row
  WHERE group_row.id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'group_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- Match saveGroup lock order for the shared membership resource.
  LOCK TABLE public.territorial_group_members IN SHARE ROW EXCLUSIVE MODE;

  IF p_status = 'active' AND NOT EXISTS (
    SELECT 1
    FROM public.territorial_group_members AS membership
    WHERE membership.group_id = p_group_id
  ) THEN
    RAISE EXCEPTION 'active_group_requires_member' USING ERRCODE = '23514';
  END IF;

  UPDATE public.territorial_groups AS group_row
  SET status = p_status
  WHERE group_row.id = p_group_id
  RETURNING to_jsonb(group_row) INTO v_group;

  IF v_group IS NULL OR v_group->>'status' IS DISTINCT FROM p_status THEN
    RAISE EXCEPTION 'group_status_ack_mismatch';
  END IF;

  RETURN jsonb_build_object('group', v_group);
END;
$function$;

REVOKE ALL ON FUNCTION public.territorial_admin_save_group(UUID, TEXT, TEXT, TEXT, UUID, UUID[], UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.territorial_admin_set_group_status(UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.territorial_admin_save_group(UUID, TEXT, TEXT, TEXT, UUID, UUID[], UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.territorial_admin_set_group_status(UUID, TEXT, UUID)
  TO service_role;

DO $postcondition$
DECLARE
  v_save_definition TEXT;
  v_status_definition TEXT;
BEGIN
  IF has_function_privilege(
    'anon',
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[],uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[],uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'anon',
    'public.territorial_admin_set_group_status(uuid,text,uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.territorial_admin_set_group_status(uuid,text,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: browser role can execute territorial admin commands';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[],uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.territorial_admin_set_group_status(uuid,text,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'postcondition: service_role cannot execute territorial admin commands';
  END IF;

  SELECT pg_get_functiondef(
    'public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[],uuid)'::regprocedure
  ) INTO v_save_definition;
  SELECT pg_get_functiondef(
    'public.territorial_admin_set_group_status(uuid,text,uuid)'::regprocedure
  ) INTO v_status_definition;

  IF position('auth.role()' in v_save_definition) <> 0
     OR position('auth.role()' in v_status_definition) <> 0 THEN
    RAISE EXCEPTION 'postcondition: deprecated auth.role boundary reintroduced';
  END IF;

  IF position('ORDER BY member.id' in v_save_definition) = 0
     OR position('GET DIAGNOSTICS v_locked_member_count = ROW_COUNT' in v_save_definition) = 0
     OR position('FOR SHARE' in v_save_definition) = 0
     OR position('LOCK TABLE public.territorial_group_members IN SHARE ROW EXCLUSIVE MODE' in v_save_definition) = 0
     OR position('LOCK TABLE public.territorial_group_members IN SHARE ROW EXCLUSIVE MODE' in v_status_definition) = 0 THEN
    RAISE EXCEPTION 'postcondition: G43 concurrency locks missing';
  END IF;
END
$postcondition$;

NOTIFY pgrst, 'reload schema';
COMMIT;
