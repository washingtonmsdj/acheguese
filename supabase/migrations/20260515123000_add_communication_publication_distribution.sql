-- Comunicacao Territorial: distribuicao contextual para comunidades.
-- Mantem /comunicacao como origem canonica e distribui publicacoes para abas/blocos territoriais.

ALTER TABLE public.communication_publications
  ADD COLUMN IF NOT EXISTS content_format text NOT NULL DEFAULT 'article';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'communication_publications_content_format_check'
  ) THEN
    ALTER TABLE public.communication_publications
      ADD CONSTRAINT communication_publications_content_format_check
      CHECK (content_format IN ('article', 'update'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.communication_publication_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.communication_publications(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  target_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  relevance_score integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT communication_publication_distribution_target_check CHECK (
    target_type IN ('communication_hub', 'community_tab', 'contextual_feed')
  ),
  CONSTRAINT communication_publication_distribution_relevance_check CHECK (relevance_score BETWEEN 0 AND 100),
  CONSTRAINT communication_publication_distribution_unique_target UNIQUE (publication_id, location_id, target_type)
);

CREATE INDEX IF NOT EXISTS idx_communication_distribution_location_target
  ON public.communication_publication_distribution(location_id, target_type, is_active, relevance_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_distribution_publication
  ON public.communication_publication_distribution(publication_id);

CREATE INDEX IF NOT EXISTS idx_communication_publications_content_format
  ON public.communication_publications(content_format, status, published_at DESC);

ALTER TABLE public.communication_publication_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY communication_distribution_public_published
  ON public.communication_publication_distribution
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.communication_publications cp
      JOIN public.communication_channels cc ON cc.id = cp.channel_id
      WHERE cp.id = communication_publication_distribution.publication_id
        AND cp.status = 'published'
        AND cc.status = 'active'
    )
  );

CREATE POLICY communication_distribution_member_select
  ON public.communication_publication_distribution
  FOR SELECT TO authenticated
  USING (public.communication_current_user_can_manage_channel(channel_id));

CREATE POLICY communication_distribution_admin_all
  ON public.communication_publication_distribution
  FOR ALL TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), false))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), false));

CREATE OR REPLACE FUNCTION public.communication_upsert_default_distribution(p_publication_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_publication public.communication_publications%ROWTYPE;
BEGIN
  SELECT * INTO v_publication
  FROM public.communication_publications
  WHERE id = p_publication_id;

  IF NOT FOUND OR v_publication.status <> 'published' THEN
    RETURN;
  END IF;

  INSERT INTO public.communication_publication_distribution (
    publication_id,
    channel_id,
    location_id,
    target_type,
    is_active,
    relevance_score
  )
  VALUES
    (v_publication.id, v_publication.channel_id, v_publication.location_id, 'communication_hub', true, 60),
    (v_publication.id, v_publication.channel_id, v_publication.location_id, 'community_tab', true, 60)
  ON CONFLICT (publication_id, location_id, target_type)
  DO UPDATE SET
    is_active = true,
    relevance_score = EXCLUDED.relevance_score,
    updated_at = now();
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
  v_content_format text := coalesce(nullif(payload->>'content_format', ''), 'article');
  v_author_profile_id uuid;
BEGIN
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
  VALUES (
    v_channel_id,
    v_user_id,
    'publication_created',
    jsonb_build_object('publication_id', v_publication_id, 'content_format', v_content_format)
  );

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
  v_next_content_format text;
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

  v_next_content_format := coalesce(nullif(payload->>'content_format', ''), v_publication.content_format);
  IF v_next_content_format NOT IN ('article', 'update') THEN
    RAISE EXCEPTION 'content_format_not_allowed';
  END IF;

  UPDATE public.communication_publications
  SET
    location_id = coalesce(nullif(payload->>'location_id', '')::uuid, v_publication.location_id),
    publication_type = coalesce(nullif(payload->>'publication_type', ''), v_publication.publication_type),
    content_format = v_next_content_format,
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
    jsonb_build_object('publication_id', v_publication.id, 'content_format', v_next_content_format)
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

  PERFORM public.communication_upsert_default_distribution(v_publication.id);

  INSERT INTO public.communication_channel_audit (channel_id, actor_user_id, action_type, metadata)
  VALUES (v_publication.channel_id, v_user_id, 'publication_published', jsonb_build_object('publication_id', v_publication.id));

  RETURN jsonb_build_object('success', true, 'publication_id', v_publication.id, 'status', 'published');
END;
$$;

GRANT EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) TO authenticated;
