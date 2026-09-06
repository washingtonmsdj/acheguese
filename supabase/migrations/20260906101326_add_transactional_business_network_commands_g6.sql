-- G6 transactional Business network commands.
-- Network structure is a structural-owner operation. Hierarchy does not grant
-- inherited Profile management authority.

CREATE OR REPLACE FUNCTION private.business_network_convert_to_network(p_actor_user_id uuid, p_standalone_profile_id uuid, p_brand_name text, p_unit_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_standalone public.business_data;
  v_owner_user_id uuid;
  v_hub_handle text;
  v_create_result jsonb;
  v_hub_profile_id uuid;
  v_hub_business_id uuid;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF char_length(trim(COALESCE(p_brand_name, ''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'invalid_brand_name' USING ERRCODE = '22023';
  END IF;
  IF char_length(trim(COALESCE(p_unit_name, ''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'invalid_unit_name' USING ERRCODE = '22023';
  END IF;

  SELECT bd.*
  INTO v_standalone
  FROM public.business_data bd
  WHERE bd.profile_id = p_standalone_profile_id
    AND bd.business_role = 'standalone'
    AND bd.status <> 'deleted'
  FOR UPDATE;

  IF v_standalone.id IS NULL THEN
    RAISE EXCEPTION 'standalone_business_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT p.user_id
  INTO v_owner_user_id
  FROM public.profiles p
  WHERE p.id = v_standalone.profile_id
  FOR UPDATE;

  IF v_owner_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'network_structure_requires_profile_owner'
      USING ERRCODE = '42501';
  END IF;

  v_hub_handle := lower(
    regexp_replace(
      COALESCE(NULLIF(v_standalone.slug, ''), p_standalone_profile_id::text)
        || '-rede',
      '[^a-z0-9-]+',
      '-',
      'g'
    )
  );
  v_hub_handle := trim(both '-' from regexp_replace(v_hub_handle, '-+', '-', 'g'));
  v_hub_handle := left(v_hub_handle, 99);

  IF EXISTS (
    SELECT 1 FROM public.profiles p WHERE lower(p.handle::text) = v_hub_handle
  ) THEN
    RAISE EXCEPTION 'network_handle_already_exists' USING ERRCODE = '23505';
  END IF;

  v_create_result := private.profile_create_profile_with_extension(
    p_actor_user_id,
    'business',
    v_hub_handle,
    trim(p_brand_name),
    NULL,
    'Rede ' || trim(p_brand_name),
    jsonb_build_object(
      'legal_name', trim(p_brand_name),
      'location_id', v_standalone.location_id::text
    )
  );

  IF COALESCE((v_create_result->>'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'network_profile_create_failed:%',
      COALESCE(v_create_result->>'error', 'unknown')
      USING ERRCODE = 'P0001';
  END IF;

  v_hub_profile_id := NULLIF(v_create_result#>>'{data,profile_id}', '')::uuid;
  IF v_hub_profile_id IS NULL THEN
    RAISE EXCEPTION 'network_profile_create_missing_id'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT bd.id INTO v_hub_business_id
  FROM public.business_data bd
  WHERE bd.profile_id = v_hub_profile_id
  FOR UPDATE;

  IF v_hub_business_id IS NULL THEN
    RAISE EXCEPTION 'network_business_extension_missing'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.business_data hub
  SET
    business_name = trim(p_brand_name),
    legal_name = trim(p_brand_name),
    slug = v_hub_handle,
    business_role = 'brand_hub',
    parent_business_id = NULL,
    is_headquarters = false,
    unit_name = NULL,
    location_id = NULL,
    address_id = NULL,
    category = v_standalone.category,
    subcategory = v_standalone.subcategory,
    description = v_standalone.description,
    status = v_standalone.status,
    payment_methods = COALESCE(v_standalone.payment_methods, '[]'::jsonb),
    specialties = COALESCE(v_standalone.specialties, '[]'::jsonb),
    facilities = COALESCE(v_standalone.facilities, '[]'::jsonb),
    website = v_standalone.website,
    instagram = v_standalone.instagram,
    facebook = v_standalone.facebook,
    metadata = COALESCE(v_standalone.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'network_created_at', now(),
        'network_created_from_business_id', v_standalone.id
      ),
    updated_at = now()
  WHERE hub.id = v_hub_business_id;

  UPDATE public.business_data
  SET
    business_role = 'branch',
    parent_business_id = v_hub_business_id,
    is_headquarters = true,
    unit_name = trim(p_unit_name),
    updated_at = now()
  WHERE id = v_standalone.id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'brand_hub_id', v_hub_profile_id,
      'brand_hub_business_id', v_hub_business_id,
      'first_branch_id', v_standalone.id,
      'first_branch_profile_id', v_standalone.profile_id
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION private.business_network_create_branch(p_actor_user_id uuid, p_brand_hub_id uuid, p_business_name text, p_unit_name text, p_slug text, p_location_id uuid, p_is_headquarters boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_hub public.business_data;
  v_hub_owner_user_id uuid;
  v_slug text;
  v_profile_handle text;
  v_create_result jsonb;
  v_branch_profile_id uuid;
  v_branch_business_id uuid;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF char_length(trim(COALESCE(p_business_name, ''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'invalid_branch_business_name' USING ERRCODE = '22023';
  END IF;
  IF char_length(trim(COALESCE(p_unit_name, ''))) NOT BETWEEN 2 AND 160 THEN
    RAISE EXCEPTION 'invalid_branch_unit_name' USING ERRCODE = '22023';
  END IF;
  IF p_location_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = p_location_id AND l.status = 'active'
  ) THEN
    RAISE EXCEPTION 'invalid_branch_location' USING ERRCODE = '22023';
  END IF;

  v_slug := lower(trim(COALESCE(p_slug, '')));
  v_slug := trim(both '-' from regexp_replace(v_slug, '[^a-z0-9-]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  IF char_length(v_slug) NOT BETWEEN 3 AND 100 THEN
    RAISE EXCEPTION 'invalid_branch_slug' USING ERRCODE = '22023';
  END IF;

  SELECT bd.*
  INTO v_hub
  FROM public.business_data bd
  WHERE bd.id = p_brand_hub_id
    AND bd.business_role = 'brand_hub'
    AND bd.status <> 'deleted'
  FOR UPDATE;

  IF v_hub.id IS NULL THEN
    RAISE EXCEPTION 'brand_hub_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT p.user_id
  INTO v_hub_owner_user_id
  FROM public.profiles p
  WHERE p.id = v_hub.profile_id
  FOR UPDATE;

  IF v_hub_owner_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'network_structure_requires_profile_owner'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.location_id = p_location_id
      AND bd.slug = v_slug
      AND bd.status <> 'deleted'
  ) THEN
    RAISE EXCEPTION 'branch_slug_already_exists_in_location'
      USING ERRCODE = '23505';
  END IF;

  v_profile_handle := left(
    regexp_replace(
      COALESCE(NULLIF(v_hub.slug, ''), 'rede') || '-' || v_slug,
      '[^a-z0-9-]+',
      '-',
      'g'
    ),
    90
  );
  v_profile_handle := trim(both '-' from regexp_replace(v_profile_handle, '-+', '-', 'g'));
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE lower(p.handle::text) = v_profile_handle
  ) THEN
    v_profile_handle := left(v_profile_handle, 90)
      || '-' || substr(md5(p_brand_hub_id::text || ':' || p_location_id::text || ':' || v_slug), 1, 8);
  END IF;

  v_create_result := private.profile_create_profile_with_extension(
    p_actor_user_id,
    'business',
    v_profile_handle,
    trim(p_business_name),
    NULL,
    NULL,
    jsonb_build_object(
      'legal_name', trim(p_business_name),
      'location_id', p_location_id::text
    )
  );

  IF COALESCE((v_create_result->>'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'branch_profile_create_failed:%',
      COALESCE(v_create_result->>'error', 'unknown')
      USING ERRCODE = 'P0001';
  END IF;

  v_branch_profile_id := NULLIF(v_create_result#>>'{data,profile_id}', '')::uuid;
  SELECT bd.id INTO v_branch_business_id
  FROM public.business_data bd
  WHERE bd.profile_id = v_branch_profile_id
  FOR UPDATE;

  IF v_branch_business_id IS NULL THEN
    RAISE EXCEPTION 'branch_business_extension_missing'
      USING ERRCODE = 'P0001';
  END IF;

  IF COALESCE(p_is_headquarters, false) THEN
    UPDATE public.business_data
    SET is_headquarters = false, updated_at = now()
    WHERE parent_business_id = v_hub.id
      AND business_role = 'branch'
      AND is_headquarters = true;
  END IF;

  UPDATE public.business_data branch
  SET
    business_name = trim(p_business_name),
    legal_name = trim(p_business_name),
    slug = v_slug,
    business_role = 'branch',
    parent_business_id = v_hub.id,
    is_headquarters = COALESCE(p_is_headquarters, false),
    unit_name = trim(p_unit_name),
    location_id = p_location_id,
    category = v_hub.category,
    subcategory = v_hub.subcategory,
    description = v_hub.description,
    status = v_hub.status,
    payment_methods = COALESCE(v_hub.payment_methods, '[]'::jsonb),
    specialties = COALESCE(v_hub.specialties, '[]'::jsonb),
    facilities = COALESCE(v_hub.facilities, '[]'::jsonb),
    website = v_hub.website,
    instagram = v_hub.instagram,
    facebook = v_hub.facebook,
    metadata = COALESCE(v_hub.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'network_parent_business_id', v_hub.id,
        'network_created_at', now()
      ),
    updated_at = now()
  WHERE branch.id = v_branch_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'branch_id', v_branch_business_id,
      'branch_profile_id', v_branch_profile_id,
      'brand_hub_business_id', v_hub.id
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION private.business_network_set_headquarters(p_actor_user_id uuid, p_brand_hub_id uuid, p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_hub_profile_id uuid;
  v_hub_owner_user_id uuid;
BEGIN
  SELECT bd.profile_id
  INTO v_hub_profile_id
  FROM public.business_data bd
  WHERE bd.id = p_brand_hub_id
    AND bd.business_role = 'brand_hub'
    AND bd.status <> 'deleted'
  FOR UPDATE;

  IF v_hub_profile_id IS NULL THEN
    RAISE EXCEPTION 'brand_hub_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT p.user_id
  INTO v_hub_owner_user_id
  FROM public.profiles p
  WHERE p.id = v_hub_profile_id
  FOR UPDATE;

  IF v_hub_owner_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'network_structure_requires_profile_owner'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = p_branch_id
      AND bd.parent_business_id = p_brand_hub_id
      AND bd.business_role = 'branch'
      AND bd.status <> 'deleted'
  ) THEN
    RAISE EXCEPTION 'branch_not_in_brand_hub' USING ERRCODE = '22023';
  END IF;

  UPDATE public.business_data
  SET is_headquarters = false, updated_at = now()
  WHERE parent_business_id = p_brand_hub_id
    AND business_role = 'branch'
    AND is_headquarters = true;

  UPDATE public.business_data
  SET is_headquarters = true, updated_at = now()
  WHERE id = p_branch_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'brand_hub_business_id', p_brand_hub_id,
      'headquarters_branch_id', p_branch_id
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.business_network_rpc_convert_to_network(p_actor_user_id uuid, p_standalone_profile_id uuid, p_brand_name text, p_unit_name text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.business_network_convert_to_network(
    p_actor_user_id,
    p_standalone_profile_id,
    p_brand_name,
    p_unit_name
  );
$function$
;

CREATE OR REPLACE FUNCTION public.business_network_rpc_create_branch(p_actor_user_id uuid, p_brand_hub_id uuid, p_business_name text, p_unit_name text, p_slug text, p_location_id uuid, p_is_headquarters boolean)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.business_network_create_branch(
    p_actor_user_id,
    p_brand_hub_id,
    p_business_name,
    p_unit_name,
    p_slug,
    p_location_id,
    p_is_headquarters
  );
$function$
;

CREATE OR REPLACE FUNCTION public.business_network_rpc_set_headquarters(p_actor_user_id uuid, p_brand_hub_id uuid, p_branch_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.business_network_set_headquarters(
    p_actor_user_id,
    p_brand_hub_id,
    p_branch_id
  );
$function$
;

REVOKE ALL ON FUNCTION private.business_network_convert_to_network(uuid,uuid,text,text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.business_network_create_branch(uuid,uuid,text,text,text,uuid,boolean)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.business_network_set_headquarters(uuid,uuid,uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.business_network_rpc_convert_to_network(uuid,uuid,text,text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.business_network_rpc_create_branch(uuid,uuid,text,text,text,uuid,boolean)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.business_network_rpc_set_headquarters(uuid,uuid,uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.business_network_convert_to_network(uuid,uuid,text,text)
TO service_role;
GRANT EXECUTE ON FUNCTION private.business_network_create_branch(uuid,uuid,text,text,text,uuid,boolean)
TO service_role;
GRANT EXECUTE ON FUNCTION private.business_network_set_headquarters(uuid,uuid,uuid)
TO service_role;

GRANT EXECUTE ON FUNCTION public.business_network_rpc_convert_to_network(uuid,uuid,text,text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.business_network_rpc_create_branch(uuid,uuid,text,text,text,uuid,boolean)
TO service_role;
GRANT EXECUTE ON FUNCTION public.business_network_rpc_set_headquarters(uuid,uuid,uuid)
TO service_role;

COMMENT ON FUNCTION public.business_network_rpc_convert_to_network(uuid,uuid,text,text) IS
  'Service-role-only target for business-network-rpc. Atomically creates canonical Profile+Business hub and converts the standalone Business into its first branch.';
COMMENT ON FUNCTION public.business_network_rpc_create_branch(uuid,uuid,text,text,text,uuid,boolean) IS
  'Service-role-only target for business-network-rpc. Atomically creates a canonical branch Profile+Business extension owned by the hub structural owner.';
COMMENT ON FUNCTION public.business_network_rpc_set_headquarters(uuid,uuid,uuid) IS
  'Service-role-only target for business-network-rpc. Structural owner only; hierarchy never implies inherited Profile management authority.';
