-- Canonical reactions for community group messages.
-- Actor identity, group membership and counters are derived in PostgreSQL.

-- security-authority: internal-table public.group_message_reactions
CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.group_messages_new(id) ON DELETE CASCADE,
  reactor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like'
    CHECK (reaction_type IN ('like')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_message_reactions_message_profile_key
    UNIQUE (message_id, reactor_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_group_message_reactions_message
  ON public.group_message_reactions (message_id, reaction_type);
CREATE INDEX IF NOT EXISTS idx_group_message_reactions_profile_created
  ON public.group_message_reactions (reactor_profile_id, created_at DESC);

ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.group_message_reactions FROM anon, authenticated;

-- security-authority: public-rpc public.toggle_group_message_like
CREATE OR REPLACE FUNCTION public.toggle_group_message_like(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_group_id UUID;
  v_enabled BOOLEAN;
  v_liked BOOLEAN;
  v_likes_count INTEGER;
  v_recent_actions INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_message_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT m.group_id,
         COALESCE(g.capabilities->>'reactions', 'true') = 'true'
  INTO v_group_id, v_enabled
  FROM public.group_messages_new m
  JOIN public.groups g ON g.id = m.group_id
  WHERE m.id = p_message_id
    AND g.status::TEXT = 'active';

  IF v_group_id IS NULL OR NOT private.auth_is_group_member(v_group_id) THEN
    RAISE EXCEPTION 'group_message_not_reactable' USING ERRCODE = '42501';
  END IF;
  IF NOT v_enabled THEN
    RAISE EXCEPTION 'group_reactions_disabled' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_group_message_like'),
    hashtext(v_actor_profile_id::TEXT || ':' || p_message_id::TEXT)
  );

  SELECT count(*)::INTEGER INTO v_recent_actions
  FROM public.community_social_audit_log audit
  WHERE audit.actor_profile_id = v_actor_profile_id
    AND audit.target_type = 'group_message_reaction'
    AND audit.created_at >= now() - interval '1 minute';
  IF v_recent_actions >= 120 THEN
    RAISE EXCEPTION 'group_reaction_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.group_message_reactions reaction
  WHERE reaction.message_id = p_message_id
    AND reaction.reactor_profile_id = v_actor_profile_id;

  IF FOUND THEN
    v_liked := FALSE;
  ELSE
    INSERT INTO public.group_message_reactions (
      group_id,
      message_id,
      reactor_profile_id,
      reaction_type
    ) VALUES (
      v_group_id,
      p_message_id,
      v_actor_profile_id,
      'like'
    );
    v_liked := TRUE;
  END IF;

  SELECT count(*)::INTEGER INTO v_likes_count
  FROM public.group_message_reactions reaction
  WHERE reaction.message_id = p_message_id
    AND reaction.reaction_type = 'like';

  RETURN jsonb_build_object(
    'message_id', p_message_id,
    'is_liked', v_liked,
    'likes_count', v_likes_count
  );
END;
$$;

-- security-authority: public-rpc public.list_group_message_reaction_state
CREATE OR REPLACE FUNCTION public.list_group_message_reaction_state(
  p_message_ids UUID[]
)
RETURNS TABLE (
  message_id UUID,
  likes_count BIGINT,
  is_liked BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(cardinality(p_message_ids), 0) = 0 THEN
    RETURN;
  END IF;
  IF cardinality(p_message_ids) > 100 THEN
    RAISE EXCEPTION 'too_many_message_ids' USING ERRCODE = '22023';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    requested.message_id,
    count(reaction.id) FILTER (WHERE reaction.reaction_type = 'like'),
    COALESCE(bool_or(reaction.reactor_profile_id = v_actor_profile_id), FALSE)
  FROM unnest(p_message_ids) AS requested(message_id)
  JOIN public.group_messages_new message ON message.id = requested.message_id
  JOIN public.groups group_record ON group_record.id = message.group_id
  LEFT JOIN public.group_message_reactions reaction
    ON reaction.message_id = requested.message_id
  WHERE group_record.status::TEXT = 'active'
    AND private.auth_is_group_member(message.group_id)
  GROUP BY requested.message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_group_message_like(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_group_message_reaction_state(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_group_message_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_group_message_reaction_state(UUID[]) TO authenticated;

DROP TRIGGER IF EXISTS trg_audit_community_social_change
  ON public.group_message_reactions;
CREATE TRIGGER trg_audit_community_social_change
  AFTER INSERT OR UPDATE OR DELETE ON public.group_message_reactions
  FOR EACH ROW EXECUTE FUNCTION private.audit_community_social_change(
    'group_message_reaction'
  );

COMMENT ON TABLE public.group_message_reactions IS
  'Server-owned reactions to private group messages; direct browser access is denied.';
COMMENT ON FUNCTION public.toggle_group_message_like(UUID) IS
  'Atomically toggles the active profile like for a visible group message.';
COMMENT ON FUNCTION public.list_group_message_reaction_state(UUID[]) IS
  'Returns aggregate and active-profile reaction state for up to 100 accessible messages.';
