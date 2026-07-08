-- Route privileged profile mutation RPCs through the authenticated profile-rpc
-- Edge Function. The browser no longer executes these SECURITY DEFINER
-- functions directly; service_role is the only direct database caller.

CREATE SCHEMA IF NOT EXISTS private;

COMMENT ON SCHEMA private IS
  'Internal helpers used by policies and service-role RPC brokers. Not exposed through the Data API.';

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.profile_create_profile_with_extension(
  p_actor_user_id uuid,
  p_profile_type text,
  p_handle text,
  p_display_name text,
  p_avatar_url text DEFAULT NULL::text,
  p_bio text DEFAULT NULL::text,
  p_extension_data jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_current_user_id uuid;
  v_profile_id uuid;
  v_normalized_handle citext;
  v_address_id uuid;
  v_location_id uuid;
  v_professional_slug text;
BEGIN
  v_current_user_id := p_actor_user_id;

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;

  IF p_profile_type IN ('business', 'professional', 'driver') AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extension data required for ' || p_profile_type || ' profiles');
  END IF;

  IF p_profile_type = 'business' THEN
    IF p_extension_data->>'legal_name' IS NULL OR trim(p_extension_data->>'legal_name') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'legal_name is required for business profiles');
    END IF;
  END IF;

  IF p_profile_type = 'professional' THEN
    IF p_extension_data->>'profession' IS NULL OR trim(p_extension_data->>'profession') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'profession is required for professional profiles');
    END IF;
    IF p_extension_data->>'location_id' IS NULL OR trim(p_extension_data->>'location_id') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'location_id is required for professional profiles');
    END IF;
  END IF;

  IF p_profile_type = 'driver' THEN
    IF p_extension_data->>'license_number' IS NULL OR trim(p_extension_data->>'license_number') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_number is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_category' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_category is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_expiry' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_expiry is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_state' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_state is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_type' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_type is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_plate' IS NULL OR trim(p_extension_data->>'vehicle_plate') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_plate is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_model' IS NULL OR trim(p_extension_data->>'vehicle_model') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_model is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_year' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_year is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_color' IS NULL OR trim(p_extension_data->>'vehicle_color') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_color is required for driver profiles');
    END IF;
  END IF;

  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');

  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,99}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;

  IF p_profile_type = 'personal' AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = v_current_user_id
      AND profile_type = 'personal'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a personal profile');
  END IF;

  IF p_profile_type = 'driver' AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = v_current_user_id
      AND profile_type = 'driver'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a driver profile');
  END IF;

  v_address_id := NULLIF(p_extension_data->>'address_id', '')::uuid;
  v_location_id := NULLIF(p_extension_data->>'location_id', '')::uuid;

  IF p_profile_type = 'professional' THEN
    v_professional_slug := NULLIF(trim(COALESCE(p_extension_data->>'slug', '')), '');
    IF v_professional_slug IS NULL THEN
      v_professional_slug := v_normalized_handle::text;
    END IF;
    v_professional_slug := lower(regexp_replace(v_professional_slug, '[^a-z0-9-]+', '-', 'g'));
    v_professional_slug := regexp_replace(v_professional_slug, '-+', '-', 'g');
    v_professional_slug := regexp_replace(v_professional_slug, '^-|-$', '', 'g');
  END IF;

  INSERT INTO profiles (
    user_id,
    profile_type,
    handle,
    name,
    display_name,
    avatar_url,
    bio
  )
  VALUES (
    v_current_user_id,
    p_profile_type,
    v_normalized_handle,
    p_display_name,
    p_display_name,
    p_avatar_url,
    p_bio
  )
  RETURNING id INTO v_profile_id;

  IF p_profile_type = 'business' THEN
    INSERT INTO business_data (
      profile_id,
      business_name,
      legal_name,
      cnpj,
      company_type,
      industry,
      status,
      address_id,
      location_id
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry',
      'pending',
      v_address_id,
      v_location_id
    );

    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');

  ELSIF p_profile_type = 'professional' THEN
    INSERT INTO professional_data (
      profile_id,
      slug,
      professional_name,
      service_category,
      service_subcategory,
      description,
      certifications,
      experience_years,
      education,
      price_range,
      service_areas,
      available_hours,
      whatsapp,
      is_accepting_clients,
      address_id,
      location_id,
      metadata
    ) VALUES (
      v_profile_id,
      v_professional_slug,
      p_display_name,
      p_extension_data->'metadata'->>'category',
      p_extension_data->>'profession',
      p_bio,
      COALESCE(p_extension_data->'certifications', '[]'::jsonb),
      NULLIF(p_extension_data->>'years_experience', '')::integer,
      p_extension_data->>'education',
      p_extension_data->'metadata'->>'price_range',
      COALESCE(p_extension_data->'service_area', '[]'::jsonb),
      p_extension_data->'metadata'->'available_hours',
      p_extension_data->'metadata'->>'whatsapp',
      true,
      v_address_id,
      v_location_id,
      COALESCE(p_extension_data->'metadata', '{}'::jsonb)
    );

    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');

  ELSIF p_profile_type = 'driver' THEN
    INSERT INTO driver_data (
      profile_id,
      license_number,
      license_category,
      license_expiry,
      license_state,
      vehicle,
      vehicle_type,
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      documents_verified,
      documents_verified_at,
      background_check_status,
      background_check_date,
      is_available,
      can_do_delivery,
      can_do_rides
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      p_extension_data->>'license_category',
      (p_extension_data->>'license_expiry')::date,
      p_extension_data->>'license_state',
      jsonb_build_object(
        'type', p_extension_data->>'vehicle_type',
        'plate', p_extension_data->>'vehicle_plate',
        'model', p_extension_data->>'vehicle_model',
        'year', NULLIF(p_extension_data->>'vehicle_year', '')::integer,
        'color', p_extension_data->>'vehicle_color'
      ),
      p_extension_data->>'vehicle_type',
      p_extension_data->>'vehicle_plate',
      p_extension_data->>'vehicle_model',
      NULLIF(p_extension_data->>'vehicle_year', '')::integer,
      p_extension_data->>'vehicle_color',
      COALESCE((p_extension_data->>'documents_verified')::boolean, false),
      NULLIF(p_extension_data->>'documents_verified_at', '')::timestamptz,
      COALESCE(p_extension_data->>'background_check_status', 'pending'),
      NULLIF(p_extension_data->>'background_check_date', '')::timestamptz,
      COALESCE((p_extension_data->>'is_available')::boolean, false),
      COALESCE((p_extension_data->>'can_do_delivery')::boolean, true),
      COALESCE((p_extension_data->>'can_do_rides')::boolean, true)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', v_profile_id,
      'handle', v_normalized_handle
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.profile_update_handle(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_handle text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_current_user_id uuid;
  v_normalized_handle citext;
BEGIN
  v_current_user_id := p_actor_user_id;

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_current_user_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_current_user_id
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  v_normalized_handle := lower(trim(regexp_replace(p_new_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');

  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;

  UPDATE profiles
  SET handle = v_normalized_handle
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'handle', v_normalized_handle);
END;
$function$;

CREATE OR REPLACE FUNCTION private.profile_delete_profile(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_current_user_id uuid;
BEGIN
  v_current_user_id := p_actor_user_id;

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_current_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can delete profile');
  END IF;

  DELETE FROM profiles
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$function$;

CREATE OR REPLACE FUNCTION private.profile_transfer_ownership(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_current_user_id uuid;
  v_profile_type text;
BEGIN
  v_current_user_id := p_actor_user_id;

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_current_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can transfer ownership');
  END IF;

  SELECT profile_type
  INTO v_profile_type
  FROM profiles
  WHERE id = p_profile_id;

  IF v_profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer ownership of personal or driver profiles');
  END IF;

  DELETE FROM profile_members
  WHERE profile_id = p_profile_id
    AND role = 'owner';

  INSERT INTO profile_members (profile_id, user_id, role, invited_by)
  VALUES (p_profile_id, p_new_owner_user_id, 'owner', v_current_user_id)
  ON CONFLICT (profile_id, user_id)
  DO UPDATE SET role = 'owner';

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id);
END;
$function$;

CREATE OR REPLACE FUNCTION private.profile_invite_member_by_email(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_email text,
  p_role text DEFAULT 'member'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_caller_id uuid;
  v_profile_type text;
  v_target_user_id uuid;
  v_is_authorized boolean := false;
BEGIN
  v_caller_id := p_actor_user_id;

  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email cannot be empty');
  END IF;

  IF p_role NOT IN ('member', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role. Use member or admin');
  END IF;

  SELECT profile_type
  INTO v_profile_type
  FROM profiles
  WHERE id = p_profile_id;

  IF v_profile_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_profile_type NOT IN ('business', 'professional') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only business and professional profiles accept members');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_caller_id
  ) THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized AND EXISTS (
    SELECT 1
    FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_caller_id
      AND role IN ('owner', 'admin')
  ) THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  SELECT id
  INTO v_target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found for this email');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_target_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this profile');
  END IF;

  INSERT INTO profile_members (profile_id, user_id, role)
  VALUES (p_profile_id, v_target_user_id, p_role);

  RETURN jsonb_build_object('success', true, 'message', 'Member added successfully');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_profile_with_extension(
  p_profile_type text,
  p_handle text,
  p_display_name text,
  p_avatar_url text DEFAULT NULL::text,
  p_bio text DEFAULT NULL::text,
  p_extension_data jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_create_profile_with_extension(
    auth.uid(),
    p_profile_type,
    p_handle,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_extension_data
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_profile_handle(
  p_profile_id uuid,
  p_new_handle text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_update_handle(auth.uid(), p_profile_id, p_new_handle);
$function$;

CREATE OR REPLACE FUNCTION public.delete_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_delete_profile(auth.uid(), p_profile_id);
$function$;

CREATE OR REPLACE FUNCTION public.transfer_profile_ownership(
  p_profile_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_transfer_ownership(auth.uid(), p_profile_id, p_new_owner_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.invite_profile_member_by_email(
  p_profile_id uuid,
  p_email text,
  p_role text DEFAULT 'member'::text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_invite_member_by_email(auth.uid(), p_profile_id, p_email, p_role);
$function$;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_profile_with_extension(
  p_actor_user_id uuid,
  p_profile_type text,
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
AS $function$
  SELECT private.profile_create_profile_with_extension(
    p_actor_user_id,
    p_profile_type,
    p_handle,
    p_display_name,
    p_avatar_url,
    p_bio,
    p_extension_data
  );
$function$;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_profile_handle(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_handle text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_update_handle(p_actor_user_id, p_profile_id, p_new_handle);
$function$;

CREATE OR REPLACE FUNCTION public.profile_rpc_delete_profile(
  p_actor_user_id uuid,
  p_profile_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_delete_profile(p_actor_user_id, p_profile_id);
$function$;

CREATE OR REPLACE FUNCTION public.profile_rpc_transfer_profile_ownership(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_transfer_ownership(p_actor_user_id, p_profile_id, p_new_owner_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.profile_rpc_invite_profile_member_by_email(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_email text,
  p_role text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.profile_invite_member_by_email(p_actor_user_id, p_profile_id, p_email, p_role);
$function$;

REVOKE ALL ON FUNCTION private.profile_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.profile_update_handle(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.profile_delete_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.profile_invite_member_by_email(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.profile_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.profile_update_handle(uuid, uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.profile_delete_profile(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.profile_invite_member_by_email(uuid, uuid, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_profile_with_extension(text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_profile_handle(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_profile(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transfer_profile_ownership(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invite_profile_member_by_email(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_update_profile_handle(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_delete_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_transfer_profile_ownership(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_invite_profile_member_by_email(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_profile_with_extension(text, text, text, text, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.update_profile_handle(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_profile(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.transfer_profile_ownership(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.invite_profile_member_by_email(uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_profile_handle(uuid, uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_delete_profile(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_transfer_profile_ownership(uuid, uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_invite_profile_member_by_email(uuid, uuid, text, text)
  TO service_role;

COMMENT ON FUNCTION public.profile_rpc_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)
  IS 'Service-role broker target for profile-rpc createProfile. Browser clients must not execute it directly.';
COMMENT ON FUNCTION public.profile_rpc_update_profile_handle(uuid, uuid, text)
  IS 'Service-role broker target for profile-rpc updateHandle. Browser clients must not execute it directly.';
COMMENT ON FUNCTION public.profile_rpc_delete_profile(uuid, uuid)
  IS 'Service-role broker target for profile-rpc deleteProfile. Browser clients must not execute it directly.';
COMMENT ON FUNCTION public.profile_rpc_transfer_profile_ownership(uuid, uuid, uuid)
  IS 'Service-role broker target for profile-rpc transferOwnership. Browser clients must not execute it directly.';
COMMENT ON FUNCTION public.profile_rpc_invite_profile_member_by_email(uuid, uuid, text, text)
  IS 'Service-role broker target for profile-rpc inviteMemberByEmail. Browser clients must not execute it directly.';
