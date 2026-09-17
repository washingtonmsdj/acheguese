-- G36C3 expand: domain-owned Profile creation.
-- Personal remains owned by profile-rpc; Driver creation moves to mobility-rpc.
-- The shared private profile creator remains an internal primitive only.

CREATE OR REPLACE FUNCTION private.profile_create_personal(
  p_actor_user_id uuid,
  p_username text,
  p_display_name text,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_username text;
  v_handle text;
  v_create jsonb;
  v_patch_result jsonb;
  v_profile_id uuid;
  v_attempt integer := 0;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid personal profile patch');
  END IF;

  v_username := lower(btrim(COALESCE(p_username, '')));
  v_username := regexp_replace(v_username, '[[:space:]-]+', '_', 'g');
  v_username := regexp_replace(v_username, '_+', '_', 'g');
  v_username := regexp_replace(v_username, '^_+|_+$', '', 'g');

  IF v_username !~ '^[a-z][a-z0-9_]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username format');
  END IF;

  IF private.profile_username_is_reserved(v_username) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserved username');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.username = v_username
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username already in use');
  END IF;

  v_handle := replace(v_username, '_', '-');
  WHILE EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.handle = v_handle
  ) LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > 8 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Could not allocate profile handle');
    END IF;
    v_handle := left(replace(v_username, '_', '-'), 88)
      || '-'
      || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END LOOP;

  BEGIN
    v_create := private.profile_create_profile_with_extension(
      p_actor_user_id,
      'personal',
      v_handle,
      p_display_name,
      p_avatar_url,
      p_bio,
      NULL
    );

    IF NOT COALESCE((v_create->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_create->>'error', 'Personal profile create failed');
    END IF;

    v_profile_id := (v_create->'data'->>'profile_id')::uuid;

    v_patch_result := private.profile_patch_owned(
      p_actor_user_id,
      v_profile_id,
      p_patch,
      v_username
    );

    IF NOT COALESCE((v_patch_result->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_patch_result->>'error', 'Personal profile patch failed');
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'profile_id', v_profile_id,
        'handle', v_handle,
        'username', v_username
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_create_personal(
  uuid, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_create_personal(
  uuid, text, text, text, text, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_personal(
  p_actor_user_id uuid,
  p_username text,
  p_display_name text,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_create_personal(
    p_actor_user_id,
    p_username,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_patch
  );
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_create_personal(
  uuid, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_create_personal(
  uuid, text, text, text, text, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_rpc_create_driver_profile(
  p_actor_user_id uuid,
  p_handle text,
  p_display_name text,
  p_avatar_url text,
  p_bio text,
  p_extension_data jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_create_profile_with_extension(
    p_actor_user_id,
    'driver',
    p_handle,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_extension_data
  );
$$;

REVOKE ALL ON FUNCTION public.mobility_rpc_create_driver_profile(
  uuid, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_rpc_create_driver_profile(
  uuid, text, text, text, text, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION private.mobility_ensure_admin_driver_profile(
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $$
DECLARE
  v_profile_id uuid;
  v_source public.profiles%ROWTYPE;
  v_name text;
  v_display_name text;
  v_handle text;
  v_now timestamptz := clock_timestamp();
  v_driver public.driver_data%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_from_roles(p_actor_user_id), false)
  THEN
    RAISE EXCEPTION 'Project admin authority is required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('mobility-admin-driver:' || p_actor_user_id::text, 0)
  );

  SELECT profile.id
  INTO v_profile_id
  FROM public.profiles AS profile
  WHERE profile.user_id = p_actor_user_id
    AND profile.profile_type = 'driver'
  ORDER BY profile.created_at ASC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    SELECT profile.*
    INTO v_source
    FROM public.profiles AS profile
    WHERE profile.user_id = p_actor_user_id
      AND profile.profile_type = 'personal'
    ORDER BY profile.is_active DESC, profile.created_at ASC
    LIMIT 1;

    v_name := COALESCE(
      NULLIF(btrim(v_source.name), ''),
      NULLIF(btrim(v_source.display_name), ''),
      'Administrador'
    );
    v_display_name := COALESCE(
      NULLIF(btrim(v_source.display_name), ''),
      v_name
    ) || ' (Motorista)';

    v_handle := left(
      regexp_replace(
        lower(COALESCE(
          NULLIF(v_source.handle::text, ''),
          NULLIF(v_source.username, ''),
          'admin-driver'
        )),
        '[^a-z0-9-]+',
        '-',
        'g'
      ),
      72
    );
    v_handle := regexp_replace(v_handle, '^-+|-+$', '', 'g');
    IF length(v_handle) < 3 THEN
      v_handle := 'admin-driver';
    END IF;
    v_handle := v_handle
      || '-driver-'
      || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

    INSERT INTO public.profiles (
      user_id,
      profile_type,
      handle,
      name,
      display_name,
      avatar_url,
      is_active
    ) VALUES (
      p_actor_user_id,
      'driver',
      v_handle,
      v_name,
      v_display_name,
      v_source.avatar_url,
      true
    )
    RETURNING id INTO v_profile_id;
  END IF;

  INSERT INTO public.driver_data (
    profile_id,
    is_online,
    is_verified,
    subscription_active,
    rating,
    total_rides,
    total_rides_completed,
    total_rides_cancelled,
    acceptance_rate,
    cancellation_rate,
    is_available,
    documents_verified,
    documents_verified_at,
    background_check_status,
    background_check_date,
    can_do_delivery,
    can_do_rides
  ) VALUES (
    v_profile_id,
    false,
    true,
    true,
    5.0,
    0,
    0,
    0,
    100.0,
    0.0,
    false,
    true,
    v_now,
    'approved',
    v_now,
    true,
    true
  )
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT driver.*
  INTO v_driver
  FROM public.driver_data AS driver
  WHERE driver.profile_id = v_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', to_jsonb(v_driver)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.mobility_ensure_admin_driver_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.mobility_ensure_admin_driver_profile(uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_rpc_ensure_admin_driver_profile(
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $$
  SELECT private.mobility_ensure_admin_driver_profile(p_actor_user_id);
$$;

REVOKE ALL ON FUNCTION public.mobility_rpc_ensure_admin_driver_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_rpc_ensure_admin_driver_profile(uuid)
  TO service_role;

COMMENT ON FUNCTION public.profile_rpc_create_personal(
  uuid, text, text, text, text, jsonb
) IS 'Service-role target for atomic Personal profile creation through profile-rpc.';

COMMENT ON FUNCTION public.mobility_rpc_create_driver_profile(
  uuid, text, text, text, text, jsonb
) IS 'Service-role target for atomic Driver profile creation through mobility-rpc.';

COMMENT ON FUNCTION public.mobility_rpc_ensure_admin_driver_profile(uuid)
  IS 'Service-role target for admin-only self bootstrap of a Driver profile through mobility-rpc.';

-- Expand/contract:
-- public.profile_rpc_create_profile_with_extension remains until profile-rpc
-- and mobility-rpc are both deployed from the new source and proven live.
