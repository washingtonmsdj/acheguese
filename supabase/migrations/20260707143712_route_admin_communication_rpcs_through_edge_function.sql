-- Route privileged communication territorial admin RPCs through
-- admin-communication-rpc. The Edge Function validates the user JWT and admin
-- role, then calls these functions with service_role while passing the real
-- admin user id for review/audit fields.

CREATE OR REPLACE FUNCTION public.admin_approve_communication_channel(
  request_id uuid,
  payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_payload jsonb := coalesce(admin_approve_communication_channel.payload, '{}'::jsonb);
  v_admin_user_id_text text := nullif(v_payload->>'admin_user_id', '');
  v_admin_id uuid;
  v_request public.communication_channel_requests%ROWTYPE;
  v_profile_id uuid;
  v_channel_id uuid;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 1;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    IF v_admin_user_id_text IS NULL THEN
      RAISE EXCEPTION 'admin_user_id_required';
    END IF;

    IF v_admin_user_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'invalid_admin_user_id';
    END IF;

    v_admin_id := v_admin_user_id_text::uuid;
  ELSE
    v_admin_id := auth.uid();
  END IF;

  IF v_admin_id IS NULL OR NOT coalesce(public.is_admin_from_roles(v_admin_id), false) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  SELECT * INTO v_request
  FROM public.communication_channel_requests
  WHERE id = admin_approve_communication_channel.request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'request_already_reviewed';
  END IF;

  v_base_slug := coalesce(public.communication_slugify(v_payload->>'slug'), public.communication_slugify(v_request.public_name), 'canal');
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.communication_channels WHERE slug = v_slug)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE slug = v_slug OR handle = v_slug OR username = v_slug) LOOP
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix::text;
  END LOOP;

  IF v_request.requested_profile_id IS NOT NULL THEN
    SELECT p.id INTO v_profile_id
    FROM public.profiles p
    WHERE p.id = v_request.requested_profile_id
      AND p.user_id = v_request.requester_user_id;
  END IF;

  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (
      user_id,
      profile_type,
      name,
      display_name,
      handle,
      username,
      slug,
      bio,
      contact_email,
      phone,
      website,
      location_id,
      is_active,
      is_public,
      verified,
      verified_at,
      reputation_score,
      trust_score
    ) VALUES (
      v_request.requester_user_id,
      'communication_channel',
      v_request.public_name,
      v_request.public_name,
      v_slug,
      v_slug,
      v_slug,
      v_request.description,
      v_request.contact_email,
      v_request.contact_phone,
      v_request.website_url,
      v_request.requested_location_id,
      true,
      true,
      true,
      now(),
      70,
      70
    )
    RETURNING id INTO v_profile_id;

    INSERT INTO public.profile_members (profile_id, user_id, role, invited_by)
    VALUES (v_profile_id, v_request.requester_user_id, 'owner', v_admin_id)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.profiles
    SET profile_type = 'communication_channel',
        display_name = v_request.public_name,
        name = v_request.public_name,
        slug = coalesce(slug, v_slug),
        handle = coalesce(handle, v_slug),
        username = coalesce(username, v_slug),
        verified = true,
        verified_at = coalesce(verified_at, now()),
        updated_at = now()
    WHERE id = v_profile_id;

    INSERT INTO public.profile_members (profile_id, user_id, role, invited_by)
    VALUES (v_profile_id, v_request.requester_user_id, 'owner', v_admin_id)
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.communication_channels (
    profile_id,
    public_name,
    legal_name,
    slug,
    channel_kind,
    description,
    website_url,
    contact_email,
    contact_phone,
    status,
    verification_status,
    reliability_score
  ) VALUES (
    v_profile_id,
    v_request.public_name,
    nullif(v_payload->>'legal_name', ''),
    v_slug,
    v_request.channel_kind,
    v_request.description,
    v_request.website_url,
    v_request.contact_email,
    v_request.contact_phone,
    'active',
    'verified',
    70
  )
  RETURNING id INTO v_channel_id;

  INSERT INTO public.communication_channel_territories (
    channel_id,
    location_id,
    territory_role,
    can_publish,
    can_alert,
    can_push,
    approved_by_user_id,
    approved_at
  ) VALUES (
    v_channel_id,
    v_request.requested_location_id,
    'primary',
    true,
    false,
    false,
    v_admin_id,
    now()
  );

  UPDATE public.communication_channel_requests
  SET status = 'approved',
      admin_notes = nullif(v_payload->>'admin_notes', ''),
      reviewed_by_user_id = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = v_request.id;

  INSERT INTO public.communication_channel_audit (channel_id, request_id, actor_user_id, action_type, metadata)
  VALUES (v_channel_id, v_request.id, v_admin_id, 'request_approved', jsonb_build_object('slug', v_slug));

  RETURN jsonb_build_object('success', true, 'channel_id', v_channel_id, 'profile_id', v_profile_id, 'slug', v_slug);
END;
$$;

DROP FUNCTION IF EXISTS public.admin_reject_communication_channel_request(uuid, text);

CREATE OR REPLACE FUNCTION public.admin_reject_communication_channel_request(
  request_id uuid,
  admin_notes text DEFAULT NULL,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_admin_id uuid;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    v_admin_id := admin_reject_communication_channel_request.admin_user_id;
    IF v_admin_id IS NULL THEN
      RAISE EXCEPTION 'admin_user_id_required';
    END IF;
  ELSE
    v_admin_id := auth.uid();
  END IF;

  IF v_admin_id IS NULL OR NOT coalesce(public.is_admin_from_roles(v_admin_id), false) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  UPDATE public.communication_channel_requests
  SET status = 'rejected',
      admin_notes = admin_reject_communication_channel_request.admin_notes,
      reviewed_by_user_id = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = admin_reject_communication_channel_request.request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found_or_already_reviewed';
  END IF;

  INSERT INTO public.communication_channel_audit (request_id, actor_user_id, action_type, metadata)
  VALUES (
    admin_reject_communication_channel_request.request_id,
    v_admin_id,
    'request_rejected',
    jsonb_build_object('admin_notes', admin_reject_communication_channel_request.admin_notes)
  );

  RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_communication_channel(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_communication_channel(uuid, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.admin_reject_communication_channel_request(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_communication_channel_request(uuid, text, uuid)
  TO service_role;

COMMENT ON FUNCTION public.admin_approve_communication_channel(uuid, jsonb)
  IS 'Approves communication channel requests through admin-communication-rpc only.';
COMMENT ON FUNCTION public.admin_reject_communication_channel_request(uuid, text, uuid)
  IS 'Rejects communication channel requests through admin-communication-rpc only.';
