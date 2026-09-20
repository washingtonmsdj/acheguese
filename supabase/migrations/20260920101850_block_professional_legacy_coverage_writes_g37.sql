-- G37 expand: stop the canonical Professional broker from accepting any
-- legacy territorial coverage fields. Coverage is owned by public.service_areas.
-- Direct table grants remain temporarily for the stale production web build and
-- are removed only at the same-SHA cutover.

CREATE OR REPLACE FUNCTION public.profile_rpc_update_professional_data(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF COALESCE(p_patch, '{}'::jsonb) ?| ARRAY[
    'service_area',
    'service_areas',
    'service_radius_km'
  ] THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Professional coverage is owned by service_areas'
    );
  END IF;

  RETURN private.profile_patch_professional_data(
    p_actor_user_id,
    p_profile_id,
    COALESCE(p_patch, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_update_professional_data(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_professional_data(uuid, uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_professional(
  p_actor_user_id uuid,
  p_handle text,
  p_display_name text,
  p_avatar_url text,
  p_bio text,
  p_extension_data jsonb,
  p_professional_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_create jsonb;
  v_patch jsonb;
  v_profile_id uuid;
BEGIN
  IF COALESCE(p_extension_data, '{}'::jsonb) ?| ARRAY[
       'service_area',
       'service_areas',
       'service_radius_km'
     ]
     OR COALESCE(p_professional_patch, '{}'::jsonb) ?| ARRAY[
       'service_area',
       'service_areas',
       'service_radius_km'
     ] THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Professional coverage is owned by service_areas'
    );
  END IF;

  v_create := private.profile_create_profile_with_extension(
    p_actor_user_id,
    'professional',
    p_handle,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_extension_data
  );

  IF NOT COALESCE((v_create->>'success')::boolean, false) THEN
    RETURN v_create;
  END IF;

  v_profile_id := (v_create->'data'->>'profile_id')::uuid;
  v_patch := private.profile_patch_professional_data(
    p_actor_user_id,
    v_profile_id,
    COALESCE(p_professional_patch, '{}'::jsonb)
  );

  IF NOT COALESCE((v_patch->>'success')::boolean, false) THEN
    RAISE EXCEPTION 'professional_create_patch_failed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_create;
END;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_create_professional(
  uuid, text, text, text, text, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_create_professional(
  uuid, text, text, text, text, jsonb, jsonb
) TO service_role;
