-- Route communication territorial mutation RPCs through communication-rpc.
-- Browser clients keep using a user JWT, while the Edge Function calls these
-- privileged routines with service_role and passes the real actor user id.

CREATE OR REPLACE FUNCTION public.can_channel_publish_in_location(
  channel_id uuid,
  location_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.communication_channels cc
    JOIN public.communication_channel_territories cct ON cct.channel_id = cc.id
    WHERE cc.id = $1
      AND cct.location_id = $2
      AND cc.status = 'active'
      AND cct.can_publish = true
  );
$$;

CREATE OR REPLACE FUNCTION public.communication_user_can_manage_channel(
  p_channel_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_user_id IS NOT NULL
    AND (
      coalesce(public.is_admin_from_roles(p_user_id), false)
      OR EXISTS (
        SELECT 1
        FROM public.communication_channels cc
        JOIN public.profile_members pm ON pm.profile_id = cc.profile_id
        WHERE cc.id = p_channel_id
          AND cc.status = 'active'
          AND pm.user_id = p_user_id
          AND pm.role IN ('owner', 'admin')
          AND pm.is_active = true
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.request_communication_channel(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_payload jsonb := coalesce(request_communication_channel.payload, '{}'::jsonb);
  v_actor_user_id_text text := nullif(v_payload->>'actor_user_id', '');
  v_user_id uuid;
  v_request_id uuid;
  v_location_id uuid;
  v_profile_id uuid;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    IF v_actor_user_id_text IS NULL THEN
      RAISE EXCEPTION 'actor_user_id_required';
    END IF;

    IF v_actor_user_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'invalid_actor_user_id';
    END IF;

    v_user_id := v_actor_user_id_text::uuid;
  ELSE
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  v_location_id := nullif(v_payload->>'requested_location_id', '')::uuid;
  v_profile_id := nullif(v_payload->>'requested_profile_id', '')::uuid;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'requested_location_id_required';
  END IF;

  IF v_profile_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_profile_id AND p.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'requested_profile_not_owned';
  END IF;

  INSERT INTO public.communication_channel_requests (
    requester_user_id,
    requested_profile_id,
    public_name,
    channel_kind,
    description,
    website_url,
    contact_email,
    contact_phone,
    requested_location_id,
    status
  ) VALUES (
    v_user_id,
    v_profile_id,
    trim(v_payload->>'public_name'),
    coalesce(nullif(v_payload->>'channel_kind', ''), 'portal'),
    trim(v_payload->>'description'),
    nullif(v_payload->>'website_url', ''),
    trim(v_payload->>'contact_email'),
    nullif(v_payload->>'contact_phone', ''),
    v_location_id,
    'pending'
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.communication_channel_audit (request_id, actor_user_id, action_type, metadata)
  VALUES (v_request_id, v_user_id, 'request_created', jsonb_build_object('source', 'request_communication_channel'));

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_communication_publication(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_payload jsonb := coalesce(create_communication_publication.payload, '{}'::jsonb);
  v_actor_user_id_text text := nullif(v_payload->>'actor_user_id', '');
  v_user_id uuid;
  v_channel_id uuid := nullif(v_payload->>'channel_id', '')::uuid;
  v_location_id uuid := nullif(v_payload->>'location_id', '')::uuid;
  v_publication_id uuid;
  v_publication_type text := coalesce(nullif(v_payload->>'publication_type', ''), 'news');
  v_content_format text := coalesce(nullif(v_payload->>'content_format', ''), 'article');
  v_author_profile_id uuid;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    IF v_actor_user_id_text IS NULL THEN
      RAISE EXCEPTION 'actor_user_id_required';
    END IF;

    IF v_actor_user_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'invalid_actor_user_id';
    END IF;

    v_user_id := v_actor_user_id_text::uuid;
  ELSE
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF v_publication_type NOT IN ('news', 'coverage', 'event', 'job', 'public_utility', 'report') THEN
    RAISE EXCEPTION 'publication_type_not_allowed_in_mvp';
  END IF;

  IF v_content_format NOT IN ('article', 'update') THEN
    RAISE EXCEPTION 'content_format_not_allowed';
  END IF;

  SELECT cc.profile_id INTO v_author_profile_id
  FROM public.communication_channels cc
  WHERE cc.id = v_channel_id
    AND cc.status = 'active';

  IF v_author_profile_id IS NULL THEN
    RAISE EXCEPTION 'channel_not_active';
  END IF;

  IF NOT public.communication_user_can_manage_channel(v_channel_id, v_user_id) THEN
    RAISE EXCEPTION 'channel_member_required';
  END IF;

  IF NOT public.can_channel_publish_in_location(v_channel_id, v_location_id) THEN
    RAISE EXCEPTION 'location_not_authorized_for_channel';
  END IF;

  INSERT INTO public.communication_publications (
    channel_id,
    author_profile_id,
    location_id,
    publication_type,
    content_format,
    title,
    summary,
    body,
    source_url,
    media,
    status,
    trust_label
  ) VALUES (
    v_channel_id,
    v_author_profile_id,
    v_location_id,
    v_publication_type,
    v_content_format,
    trim(v_payload->>'title'),
    nullif(v_payload->>'summary', ''),
    trim(v_payload->>'body'),
    nullif(v_payload->>'source_url', ''),
    coalesce(v_payload->'media', '{}'::jsonb),
    'draft',
    'verified_source'
  )
  RETURNING id INTO v_publication_id;

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (
    v_channel_id,
    v_user_id,
    'publication_created',
    jsonb_build_object('publication_id', v_publication_id, 'content_format', v_content_format)
  );

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication_id, 'status', 'draft');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_communication_publication_draft(
  publication_id uuid,
  payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_payload jsonb := coalesce(update_communication_publication_draft.payload, '{}'::jsonb);
  v_actor_user_id_text text := nullif(v_payload->>'actor_user_id', '');
  v_user_id uuid;
  v_publication public.communication_publications%ROWTYPE;
  v_next_content_format text;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    IF v_actor_user_id_text IS NULL THEN
      RAISE EXCEPTION 'actor_user_id_required';
    END IF;

    IF v_actor_user_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'invalid_actor_user_id';
    END IF;

    v_user_id := v_actor_user_id_text::uuid;
  ELSE
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT * INTO v_publication
  FROM public.communication_publications
  WHERE id = update_communication_publication_draft.publication_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'publication_not_found';
  END IF;

  IF v_publication.status <> 'draft' THEN
    RAISE EXCEPTION 'only_draft_can_be_edited';
  END IF;

  IF NOT public.communication_user_can_manage_channel(v_publication.channel_id, v_user_id) THEN
    RAISE EXCEPTION 'channel_member_required';
  END IF;

  IF v_payload ? 'location_id' THEN
    IF NOT public.can_channel_publish_in_location(
      v_publication.channel_id,
      nullif(v_payload->>'location_id', '')::uuid
    ) THEN
      RAISE EXCEPTION 'location_not_authorized_for_channel';
    END IF;
  END IF;

  v_next_content_format := coalesce(nullif(v_payload->>'content_format', ''), v_publication.content_format);
  IF v_next_content_format NOT IN ('article', 'update') THEN
    RAISE EXCEPTION 'content_format_not_allowed';
  END IF;

  UPDATE public.communication_publications
  SET
    location_id = coalesce(nullif(v_payload->>'location_id', '')::uuid, v_publication.location_id),
    publication_type = coalesce(nullif(v_payload->>'publication_type', ''), v_publication.publication_type),
    content_format = v_next_content_format,
    title = coalesce(nullif(trim(v_payload->>'title'), ''), v_publication.title),
    summary = coalesce(v_payload->>'summary', v_publication.summary),
    body = coalesce(nullif(trim(v_payload->>'body'), ''), v_publication.body),
    source_url = coalesce(nullif(v_payload->>'source_url', ''), v_publication.source_url),
    media = coalesce(v_payload->'media', v_publication.media),
    updated_at = now()
  WHERE id = v_publication.id;

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (
    v_publication.channel_id,
    v_user_id,
    'publication_draft_updated',
    jsonb_build_object('publication_id', v_publication.id, 'content_format', v_next_content_format)
  );

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication.id, 'status', 'draft');
END;
$$;

DROP FUNCTION IF EXISTS public.publish_communication_publication(uuid);

CREATE OR REPLACE FUNCTION public.publish_communication_publication(
  publication_id uuid,
  actor_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '');
  v_user_id uuid;
  v_publication public.communication_publications%ROWTYPE;
BEGIN
  IF v_jwt_role = 'service_role' THEN
    v_user_id := publish_communication_publication.actor_user_id;
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'actor_user_id_required';
    END IF;
  ELSE
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT * INTO v_publication
  FROM public.communication_publications
  WHERE id = publish_communication_publication.publication_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'publication_not_found';
  END IF;

  IF NOT public.communication_user_can_manage_channel(v_publication.channel_id, v_user_id) THEN
    RAISE EXCEPTION 'channel_member_required';
  END IF;

  IF NOT public.can_channel_publish_in_location(v_publication.channel_id, v_publication.location_id) THEN
    RAISE EXCEPTION 'location_not_authorized_for_channel';
  END IF;

  UPDATE public.communication_publications
  SET status = 'published',
      published_at = coalesce(published_at, now()),
      updated_at = now()
  WHERE id = v_publication.id;

  PERFORM public.communication_upsert_default_distribution(v_publication.id);

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (
    v_publication.channel_id,
    v_user_id,
    'publication_published',
    jsonb_build_object('publication_id', v_publication.id)
  );

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication.id, 'status', 'published');
END;
$$;

REVOKE ALL ON FUNCTION public.can_channel_publish_in_location(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_channel_publish_in_location(uuid, uuid)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.communication_user_can_manage_channel(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.communication_user_can_manage_channel(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.request_communication_channel(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_communication_channel(jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_communication_publication(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_communication_publication(jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_communication_publication_draft(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_communication_publication_draft(uuid, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.publish_communication_publication(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_communication_publication(uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.can_channel_publish_in_location(uuid, uuid)
  IS 'Invoker-scoped check for whether an active communication channel may publish in a location.';
COMMENT ON FUNCTION public.communication_user_can_manage_channel(uuid, uuid)
  IS 'Internal service-role helper for communication-rpc actor authorization.';
COMMENT ON FUNCTION public.request_communication_channel(jsonb)
  IS 'Creates communication channel requests through communication-rpc only.';
COMMENT ON FUNCTION public.create_communication_publication(jsonb)
  IS 'Creates communication publications through communication-rpc only.';
COMMENT ON FUNCTION public.update_communication_publication_draft(uuid, jsonb)
  IS 'Updates communication publication drafts through communication-rpc only.';
COMMENT ON FUNCTION public.publish_communication_publication(uuid, uuid)
  IS 'Publishes communication publications through communication-rpc only.';
