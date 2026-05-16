-- Comunicacao Territorial MVP Seguro
-- Dominio editorial/institucional separado de comunidade.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.communication_slugify(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(coalesce(input, ''));
  normalized := translate(
    normalized,
    'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'
  );
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := regexp_replace(normalized, '(^-|-$)', '', 'g');
  RETURN nullif(normalized, '');
END;
$$;

CREATE TABLE IF NOT EXISTS public.communication_channel_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  public_name text NOT NULL,
  channel_kind text NOT NULL,
  description text NOT NULL,
  website_url text NULL,
  contact_email text NOT NULL,
  contact_phone text NULL,
  requested_location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text NULL,
  reviewed_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_channel_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT communication_channel_requests_kind_check CHECK (channel_kind IN ('tv_bairro', 'radio', 'portal', 'collective', 'newspaper', 'public_utility', 'other')),
  CONSTRAINT communication_channel_requests_public_name_check CHECK (char_length(trim(public_name)) >= 3),
  CONSTRAINT communication_channel_requests_description_check CHECK (char_length(trim(description)) >= 20)
);

CREATE TABLE IF NOT EXISTS public.communication_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_name text NOT NULL,
  legal_name text NULL,
  slug text NOT NULL UNIQUE,
  channel_kind text NOT NULL,
  description text NOT NULL,
  website_url text NULL,
  contact_email text NULL,
  contact_phone text NULL,
  status text NOT NULL DEFAULT 'pending_verification',
  verification_status text NOT NULL DEFAULT 'unverified',
  reliability_score integer NOT NULL DEFAULT 70,
  alert_cooldown_until timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_channels_kind_check CHECK (channel_kind IN ('tv_bairro', 'radio', 'portal', 'collective', 'newspaper', 'public_utility', 'other')),
  CONSTRAINT communication_channels_status_check CHECK (status IN ('pending_verification', 'active', 'restricted', 'suspended', 'rejected')),
  CONSTRAINT communication_channels_verification_check CHECK (verification_status IN ('unverified', 'verified', 'revoked')),
  CONSTRAINT communication_channels_reliability_check CHECK (reliability_score BETWEEN 0 AND 100),
  CONSTRAINT communication_channels_slug_check CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.communication_channel_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  territory_role text NOT NULL DEFAULT 'primary',
  can_publish boolean NOT NULL DEFAULT true,
  can_alert boolean NOT NULL DEFAULT false,
  can_push boolean NOT NULL DEFAULT false,
  approved_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_channel_territories_unique_location UNIQUE (channel_id, location_id),
  CONSTRAINT communication_channel_territories_role_check CHECK (territory_role IN ('primary', 'coverage', 'temporary'))
);

CREATE TABLE IF NOT EXISTS public.communication_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  publication_type text NOT NULL,
  title text NOT NULL,
  summary text NULL,
  body text NOT NULL,
  source_url text NULL,
  media jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  trust_label text NOT NULL DEFAULT 'verified_source',
  published_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_publications_type_check CHECK (publication_type IN ('news', 'coverage', 'event', 'job', 'public_utility', 'report')),
  CONSTRAINT communication_publications_status_check CHECK (status IN ('draft', 'published', 'under_review', 'removed', 'retracted')),
  CONSTRAINT communication_publications_title_check CHECK (char_length(trim(title)) >= 5),
  CONSTRAINT communication_publications_body_check CHECK (char_length(trim(body)) >= 20)
);

CREATE TABLE IF NOT EXISTS public.communication_channel_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NULL REFERENCES public.communication_channels(id) ON DELETE SET NULL,
  request_id uuid NULL REFERENCES public.communication_channel_requests(id) ON DELETE SET NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_channel_requests_status ON public.communication_channel_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_channels_slug ON public.communication_channels(slug);
CREATE INDEX IF NOT EXISTS idx_communication_channels_status ON public.communication_channels(status);
CREATE INDEX IF NOT EXISTS idx_communication_channel_territories_location ON public.communication_channel_territories(location_id);
CREATE INDEX IF NOT EXISTS idx_communication_channel_territories_channel ON public.communication_channel_territories(channel_id);
CREATE INDEX IF NOT EXISTS idx_communication_publications_channel ON public.communication_publications(channel_id);
CREATE INDEX IF NOT EXISTS idx_communication_publications_location ON public.communication_publications(location_id);
CREATE INDEX IF NOT EXISTS idx_communication_publications_status_published ON public.communication_publications(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_audit_channel ON public.communication_channel_audit(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_audit_request ON public.communication_channel_audit(request_id, created_at DESC);

ALTER TABLE public.communication_channel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channel_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channel_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_channel_publish_in_location(channel_id uuid, location_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.communication_current_user_can_manage_channel(p_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.communication_channels cc
      JOIN public.profile_members pm ON pm.profile_id = cc.profile_id
      WHERE cc.id = p_channel_id
        AND cc.status = 'active'
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    );
$$;

CREATE POLICY communication_requests_insert_own
  ON public.communication_channel_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY communication_requests_select_own_or_admin
  ON public.communication_channel_requests
  FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid() OR coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_requests_update_admin
  ON public.communication_channel_requests
  FOR UPDATE TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_channels_select_public_active
  ON public.communication_channels
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY communication_channels_admin_all
  ON public.communication_channels
  FOR ALL TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_channels_member_select
  ON public.communication_channels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_members pm
      WHERE pm.profile_id = communication_channels.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY communication_territories_public_active_channel
  ON public.communication_channel_territories
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_channels cc
      WHERE cc.id = communication_channel_territories.channel_id
        AND cc.status = 'active'
    )
  );

CREATE POLICY communication_territories_admin_all
  ON public.communication_channel_territories
  FOR ALL TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_publications_select_public_published
  ON public.communication_publications
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY communication_publications_member_select
  ON public.communication_publications
  FOR SELECT TO authenticated
  USING (public.communication_current_user_can_manage_channel(channel_id));

CREATE POLICY communication_publications_member_insert
  ON public.communication_publications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.communication_current_user_can_manage_channel(channel_id)
    AND public.can_channel_publish_in_location(channel_id, location_id)
  );

CREATE POLICY communication_publications_member_update
  ON public.communication_publications
  FOR UPDATE TO authenticated
  USING (public.communication_current_user_can_manage_channel(channel_id))
  WITH CHECK (
    public.communication_current_user_can_manage_channel(channel_id)
    AND public.can_channel_publish_in_location(channel_id, location_id)
  );

CREATE POLICY communication_publications_admin_all
  ON public.communication_publications
  FOR ALL TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_audit_admin_select
  ON public.communication_channel_audit
  FOR SELECT TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE POLICY communication_audit_admin_insert
  ON public.communication_channel_audit
  FOR INSERT TO authenticated
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE OR REPLACE FUNCTION public.request_communication_channel(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request_id uuid;
  v_location_id uuid;
  v_profile_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  v_location_id := nullif(payload->>'requested_location_id', '')::uuid;
  v_profile_id := nullif(payload->>'requested_profile_id', '')::uuid;

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
    trim(payload->>'public_name'),
    coalesce(nullif(payload->>'channel_kind', ''), 'portal'),
    trim(payload->>'description'),
    nullif(payload->>'website_url', ''),
    trim(payload->>'contact_email'),
    nullif(payload->>'contact_phone', ''),
    v_location_id,
    'pending'
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.communication_channel_audit (request_id, actor_user_id, action_type, metadata)
  VALUES (v_request_id, v_user_id, 'request_created', jsonb_build_object('source', 'request_communication_channel'));

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_communication_channel(request_id uuid, payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_request public.communication_channel_requests%ROWTYPE;
  v_profile_id uuid;
  v_channel_id uuid;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 1;
BEGIN
  IF NOT coalesce(public.is_admin_from_roles(v_admin_id), false) THEN
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

  v_base_slug := coalesce(public.communication_slugify(payload->>'slug'), public.communication_slugify(v_request.public_name), 'canal');
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
    nullif(payload->>'legal_name', ''),
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
      admin_notes = nullif(payload->>'admin_notes', ''),
      reviewed_by_user_id = v_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = v_request.id;

  INSERT INTO public.communication_channel_audit (channel_id, request_id, actor_user_id, action_type, metadata)
  VALUES (v_channel_id, v_request.id, v_admin_id, 'request_approved', jsonb_build_object('slug', v_slug));

  RETURN jsonb_build_object('success', true, 'channel_id', v_channel_id, 'profile_id', v_profile_id, 'slug', v_slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_communication_channel_request(request_id uuid, admin_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT coalesce(public.is_admin_from_roles(v_admin_id), false) THEN
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
  VALUES (admin_reject_communication_channel_request.request_id, v_admin_id, 'request_rejected', jsonb_build_object('admin_notes', admin_notes));

  RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_communication_publication(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_channel_id uuid := nullif(payload->>'channel_id', '')::uuid;
  v_location_id uuid := nullif(payload->>'location_id', '')::uuid;
  v_publication_id uuid;
  v_publication_type text := coalesce(nullif(payload->>'publication_type', ''), 'news');
  v_author_profile_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF v_publication_type NOT IN ('news', 'coverage', 'event', 'job', 'public_utility', 'report') THEN
    RAISE EXCEPTION 'publication_type_not_allowed_in_mvp';
  END IF;

  SELECT cc.profile_id INTO v_author_profile_id
  FROM public.communication_channels cc
  WHERE cc.id = v_channel_id
    AND cc.status = 'active';

  IF v_author_profile_id IS NULL THEN
    RAISE EXCEPTION 'channel_not_active';
  END IF;

  IF NOT public.communication_current_user_can_manage_channel(v_channel_id) THEN
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
    trim(payload->>'title'),
    nullif(payload->>'summary', ''),
    trim(payload->>'body'),
    nullif(payload->>'source_url', ''),
    coalesce(payload->'media', '{}'::jsonb),
    'draft',
    'verified_source'
  )
  RETURNING id INTO v_publication_id;

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (v_channel_id, v_user_id, 'publication_created', jsonb_build_object('publication_id', v_publication_id));

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication_id, 'status', 'draft');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_communication_publication_draft(publication_id uuid, payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_publication public.communication_publications%ROWTYPE;
BEGIN
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

  IF NOT public.communication_current_user_can_manage_channel(v_publication.channel_id) THEN
    RAISE EXCEPTION 'channel_member_required';
  END IF;

  IF payload ? 'location_id' THEN
    IF NOT public.can_channel_publish_in_location(
      v_publication.channel_id,
      nullif(payload->>'location_id', '')::uuid
    ) THEN
      RAISE EXCEPTION 'location_not_authorized_for_channel';
    END IF;
  END IF;

  UPDATE public.communication_publications
  SET
    location_id = coalesce(nullif(payload->>'location_id', '')::uuid, v_publication.location_id),
    publication_type = coalesce(nullif(payload->>'publication_type', ''), v_publication.publication_type),
    title = coalesce(nullif(trim(payload->>'title'), ''), v_publication.title),
    summary = coalesce(payload->>'summary', v_publication.summary),
    body = coalesce(nullif(trim(payload->>'body'), ''), v_publication.body),
    source_url = coalesce(nullif(payload->>'source_url', ''), v_publication.source_url),
    media = coalesce(payload->'media', v_publication.media),
    updated_at = now()
  WHERE id = v_publication.id;

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (
    v_publication.channel_id,
    v_user_id,
    'publication_draft_updated',
    jsonb_build_object('publication_id', v_publication.id)
  );

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication.id, 'status', 'draft');
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_communication_publication(publication_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_publication public.communication_publications%ROWTYPE;
BEGIN
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

  IF NOT public.communication_current_user_can_manage_channel(v_publication.channel_id) THEN
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

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (v_publication.channel_id, v_user_id, 'publication_published', jsonb_build_object('publication_id', v_publication.id));

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication.id, 'status', 'published');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_communication_channel(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_communication_channel(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_communication_channel_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_communication_publication(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_communication_publication_draft(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_communication_publication(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_channel_publish_in_location(uuid, uuid) TO authenticated;

