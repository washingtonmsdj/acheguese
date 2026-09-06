-- G6 delegated profile management.
-- Keep platform-global admin separate from profile-local management:
-- storage role 'admin' is surfaced as Gestor/Manager. Only the structural owner
-- in profiles.user_id can manage people/access or transfer ownership.

CREATE OR REPLACE FUNCTION private.profile_invite_member_by_email(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_email text,
  p_role text DEFAULT 'member'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_profile_type text;
  v_target_user_id uuid;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email cannot be empty');
  END IF;

  IF p_role NOT IN ('member', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role. Use member or manager');
  END IF;

  SELECT profile_type
  INTO v_profile_type
  FROM public.profiles
  WHERE id = p_profile_id
    AND user_id = p_actor_user_id
  FOR UPDATE;

  IF v_profile_type IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_profile_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Only the profile owner can manage people and access'
      );
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_profile_type NOT IN ('business', 'professional') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only business and professional profiles accept members'
    );
  END IF;

  SELECT id
  INTO v_target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found for this email');
  END IF;

  IF v_target_user_id = p_actor_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'The profile owner already has full access'
    );
  END IF;

  INSERT INTO public.profile_members (
    profile_id, user_id, role, invited_by, is_active
  )
  VALUES (
    p_profile_id, v_target_user_id, p_role, p_actor_user_id, true
  )
  ON CONFLICT (profile_id, user_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    invited_by = EXCLUDED.invited_by,
    is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE p_role
      WHEN 'admin' THEN 'Manager access granted successfully'
      ELSE 'Member access granted successfully'
    END,
    'role', p_role
  );
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
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_profile_type text;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_new_owner_user_id IS NULL OR p_new_owner_user_id = p_actor_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a different new owner');
  END IF;

  SELECT profile_type
  INTO v_profile_type
  FROM public.profiles
  WHERE id = p_profile_id
    AND user_id = p_actor_user_id
  FOR UPDATE;

  IF v_profile_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only the current profile owner can transfer ownership'
    );
  END IF;

  IF v_profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot transfer ownership of personal or driver profiles'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_new_owner_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New owner user not found');
  END IF;

  UPDATE public.profiles
  SET user_id = p_new_owner_user_id, updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO public.profile_members (
    profile_id, user_id, role, invited_by, is_active
  )
  VALUES (
    p_profile_id, p_actor_user_id, 'admin', p_actor_user_id, true
  )
  ON CONFLICT (profile_id, user_id) DO UPDATE
  SET role = 'admin', is_active = true;

  UPDATE public.profile_members
  SET role = 'admin'
  WHERE profile_id = p_profile_id
    AND role = 'owner'
    AND user_id <> p_new_owner_user_id;

  INSERT INTO public.profile_members (
    profile_id, user_id, role, invited_by, is_active
  )
  VALUES (
    p_profile_id, p_new_owner_user_id, 'owner', p_actor_user_id, true
  )
  ON CONFLICT (profile_id, user_id) DO UPDATE
  SET role = 'owner', is_active = true, invited_by = EXCLUDED.invited_by;

  UPDATE public.business_data
  SET
    metadata = CASE
      WHEN COALESCE(metadata->>'custody_status', '') = 'claimed'
        THEN COALESCE(metadata, '{}'::jsonb)
          || jsonb_build_object(
            'claimed_user_id', p_new_owner_user_id,
            'ownership_transferred_at', now()
          )
      ELSE metadata
    END,
    updated_at = now()
  WHERE profile_id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'previous_owner_user_id', p_actor_user_id,
    'new_owner_user_id', p_new_owner_user_id,
    'previous_owner_role', 'admin'
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.profile_invite_member_by_email(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_invite_member_by_email(uuid, uuid, text, text)
TO service_role;

REVOKE ALL ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
TO service_role;

COMMENT ON FUNCTION private.profile_invite_member_by_email(uuid, uuid, text, text) IS
  'Owner-only people/access mutation. Storage role admin is surfaced as Gestor/Manager, never platform admin.';
COMMENT ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid) IS
  'Owner-only atomic canonical ownership transfer; profiles.user_id is the structural authority and former owner becomes manager.';
