-- P0 hardening for the canonical Community Poll Vote command.
--
-- VOTE_POLL is an explicit territorial engagement action:
--   TERRITORIAL_ENGAGEMENT_MEMBER_ALLOWED
-- authenticated-only access is not sufficient; the active profile must have
-- a server-derived residence or active Community membership for the Poll's
-- Post location, and the Community rollout must be active.

DO $migration_preflight$
BEGIN
  IF to_regclass('public.module_rollouts') IS NULL THEN
    RAISE EXCEPTION
      'POLL_VOTE_ROLLOUT_AUTHORITY_UNRESOLVED: public.module_rollouts is missing';
  END IF;
END;
$migration_preflight$;

CREATE OR REPLACE FUNCTION private.can_vote_community_poll(
  p_poll_id UUID,
  p_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH RECURSIVE poll_context AS (
    SELECT
      poll.id AS poll_id,
      post.location_id
    FROM public.community_polls poll
    JOIN public.posts post
      ON post.id = poll.post_id
    WHERE poll.id = p_poll_id
      AND post.is_published = TRUE
      AND post.is_hidden = FALSE
      AND post.is_removed = FALSE
  ),
  location_chain AS (
    SELECT
      location.id,
      location.parent_id,
      location.status,
      0 AS depth
    FROM public.locations location
    JOIN poll_context context
      ON context.location_id = location.id

    UNION ALL

    SELECT
      parent.id,
      parent.parent_id,
      parent.status,
      chain.depth + 1
    FROM public.locations parent
    JOIN location_chain chain
      ON parent.id = chain.parent_id
    WHERE chain.depth < 32
  ),
  effective_rollout AS (
    SELECT rollout.status
    FROM location_chain chain
    JOIN public.module_rollouts rollout
      ON rollout.location_id = chain.id
     AND rollout.module_key = 'community'
    WHERE chain.status::TEXT = 'active'
    ORDER BY chain.depth
    LIMIT 1
  ),
  owned_profile AS (
    SELECT profile.id, profile.user_id
    FROM public.profiles profile
    WHERE profile.id = p_profile_id
      AND profile.user_id = auth.uid()
      AND private.auth_owns_active_profile(p_profile_id)
  )
  SELECT EXISTS (
    SELECT 1
    FROM poll_context context
    CROSS JOIN owned_profile profile
    WHERE EXISTS (
      SELECT 1
      FROM effective_rollout rollout
      WHERE rollout.status = 'active'
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_residences residence
        WHERE residence.user_id = profile.user_id
          AND residence.location_id = context.location_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.community_memberships membership
        JOIN public.territory_communities community
          ON community.id = membership.community_id
         AND community.status::TEXT = 'active'
        WHERE membership.profile_id = profile.id
          AND membership.user_id = profile.user_id
          AND membership.status = 'active'
          AND (
            (
              community.territory_type IN ('district', 'neighborhood')
              AND community.territory_id = context.location_id
            )
            OR (
              community.territory_type = 'territorial_group'
              AND EXISTS (
                SELECT 1
                FROM public.territorial_group_members group_member
                WHERE group_member.group_id = community.territory_id
                  AND group_member.location_id = context.location_id
              )
            )
          )
      )
    )
  );
$function$;

REVOKE ALL ON FUNCTION private.can_vote_community_poll(UUID, UUID)
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION private.can_vote_community_poll(UUID, UUID) IS
  'Private VOTE_POLL authorization: resource-derived territory, active profile ownership, territorial/community link and active Community rollout. Residence verification is intentionally not required.';

CREATE OR REPLACE FUNCTION public.cast_community_poll_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_poll public.community_polls%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT poll.*
  INTO v_poll
  FROM public.community_polls poll
  WHERE poll.id = p_poll_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.id = v_poll.post_id
      AND post.is_published = TRUE
      AND post.is_hidden = FALSE
      AND post.is_removed = FALSE
  ) THEN
    RAISE EXCEPTION 'poll_not_accessible' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_poll_options option
    WHERE option.id = p_option_id
      AND option.poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'poll_option_not_found' USING ERRCODE = '22023';
  END IF;

  IF NOT private.can_vote_community_poll(p_poll_id, p_profile_id) THEN
    RAISE EXCEPTION 'poll_vote_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_poll.expires_at IS NOT NULL AND v_poll.expires_at <= now() THEN
    RAISE EXCEPTION 'poll_expired' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    WHERE vote.poll_id = p_poll_id
      AND vote.option_id = p_option_id
      AND (
        vote.profile_id = p_profile_id
        OR (vote.profile_id IS NULL AND vote.user_id = v_user_id)
      )
  ) THEN
    RETURN private.build_community_poll_dto(
      p_poll_id,
      p_profile_id,
      v_user_id
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes legacy_vote
    WHERE legacy_vote.poll_id = p_poll_id
      AND legacy_vote.user_id = v_user_id
      AND legacy_vote.profile_id IS NULL
  ) THEN
    RAISE EXCEPTION 'legacy_poll_vote_requires_backfill' USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_poll.allow_multiple_choice
     AND EXISTS (
       SELECT 1
       FROM public.community_poll_votes vote
       WHERE vote.poll_id = p_poll_id
         AND vote.profile_id = p_profile_id
     ) THEN
    RAISE EXCEPTION 'poll_already_voted' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.community_poll_votes (
    poll_id,
    option_id,
    user_id,
    profile_id
  ) VALUES (
    p_poll_id,
    p_option_id,
    v_user_id,
    p_profile_id
  )
  ON CONFLICT (poll_id, profile_id, option_id)
    WHERE profile_id IS NOT NULL
  DO NOTHING;

  RETURN private.build_community_poll_dto(
    p_poll_id,
    p_profile_id,
    v_user_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)
  TO authenticated;

COMMENT ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID) IS
  'Casts a territorial VOTE_POLL for an active profile and refreshes legacy projections in the same transaction.';
