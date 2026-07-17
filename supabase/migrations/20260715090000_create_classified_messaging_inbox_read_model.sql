-- Classified Messaging inbox read model.
-- Replaces per-conversation last-message/unread queries with one bounded page.

-- security-authority: public-rpc public.list_classified_conversation_previews
CREATE OR REPLACE FUNCTION public.list_classified_conversation_previews(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 31,
  p_cursor_last_message_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  classified_id UUID,
  buyer_id UUID,
  seller_id UUID,
  status TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  blocked_by UUID,
  block_reason TEXT,
  classified_title TEXT,
  classified_price NUMERIC,
  classified_photo TEXT,
  classified_public_id TEXT,
  classified_slug TEXT,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message_text TEXT,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_search TEXT := NULLIF(lower(trim(p_search)), '');
  v_search_pattern TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF p_profile_id IS NULL OR NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 51 THEN
    RAISE EXCEPTION 'invalid_page_limit' USING ERRCODE = '22023';
  END IF;
  IF (p_cursor_last_message_at IS NULL) <> (p_cursor_id IS NULL) THEN
    RAISE EXCEPTION 'invalid_conversation_cursor' USING ERRCODE = '22023';
  END IF;
  IF v_search IS NOT NULL AND char_length(v_search) > 100 THEN
    RAISE EXCEPTION 'search_too_long' USING ERRCODE = '22023';
  END IF;

  IF v_search IS NOT NULL THEN
    v_search_pattern := '%' || replace(
      replace(replace(v_search, E'\\', E'\\\\'), '%', E'\\%'),
      '_',
      E'\\_'
    ) || '%';
  END IF;

  RETURN QUERY
  SELECT
    conversation.id,
    conversation.classified_id,
    conversation.buyer_id,
    conversation.seller_id,
    conversation.status,
    conversation.last_message_at,
    conversation.created_at,
    conversation.updated_at,
    conversation.is_active,
    conversation.blocked_by,
    conversation.block_reason,
    classified.title AS classified_title,
    COALESCE(classified.price, 0) AS classified_price,
    CASE
      WHEN jsonb_typeof(classified.photos) = 'array'
        THEN COALESCE(classified.photos ->> 0, '')
      ELSE ''
    END AS classified_photo,
    classified.public_id AS classified_public_id,
    classified.slug AS classified_slug,
    other_profile.id AS other_user_id,
    COALESCE(other_profile.name, 'Usuario') AS other_user_name,
    COALESCE(other_profile.avatar_url, '') AS other_user_avatar,
    COALESCE(last_message.text, '') AS last_message_text,
    COALESCE(unread.unread_count, 0)::BIGINT AS unread_count
  FROM public.conversations conversation
  JOIN public.classifieds classified
    ON classified.id = conversation.classified_id
  JOIN public.profiles other_profile
    ON other_profile.id = CASE
      WHEN conversation.buyer_id = p_profile_id THEN conversation.seller_id
      ELSE conversation.buyer_id
    END
  LEFT JOIN LATERAL (
    SELECT message.text
    FROM public.messages message
    WHERE message.conversation_id = conversation.id
    ORDER BY message.created_at DESC, message.id DESC
    LIMIT 1
  ) last_message ON TRUE
  LEFT JOIN LATERAL (
    SELECT count(*)::BIGINT AS unread_count
    FROM public.messages message
    WHERE message.conversation_id = conversation.id
      AND message.sender_profile_id <> p_profile_id
      AND message.read_at IS NULL
  ) unread ON TRUE
  WHERE (conversation.buyer_id = p_profile_id OR conversation.seller_id = p_profile_id)
    AND (
      p_cursor_last_message_at IS NULL
      OR (conversation.last_message_at, conversation.id)
        < (p_cursor_last_message_at, p_cursor_id)
    )
    AND (
      v_search IS NULL
      OR lower(classified.title) LIKE v_search_pattern ESCAPE E'\\'
      OR lower(COALESCE(other_profile.name, '')) LIKE v_search_pattern ESCAPE E'\\'
    )
  ORDER BY conversation.last_message_at DESC, conversation.id DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.list_classified_conversation_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_classified_conversation_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) TO authenticated;

COMMENT ON FUNCTION public.list_classified_conversation_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) IS 'Bounded keyset inbox read model for an authenticated active Profile in Classified Messaging.';
