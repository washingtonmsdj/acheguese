-- STAGED CUTOVER for Community Poll. Keep outside supabase/migrations until
-- the compatibility window is complete; assign a fresh timestamp on promotion.
--
-- Apply only after:
--   * the ADDITIVE migration is live;
--   * the RPC-based frontend is live and observed;
--   * the read-only Poll preflight passes in cutover mode;
--   * every legacy Vote has an evidence-backed profile_id.
--
-- This migration never repairs incompatible data. Every unsafe state aborts.

DO $poll_cutover_preflight$
DECLARE
  v_expected_snapshot JSONB;
BEGIN
  IF to_regclass('public.community_polls') IS NULL
     OR to_regclass('public.community_poll_options') IS NULL
     OR to_regclass('public.community_poll_votes') IS NULL THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: additive Poll tables are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_poll_votes'
      AND column_name = 'profile_id'
      AND data_type = 'uuid'
  ) OR to_regprocedure(
    'public.get_community_poll_for_post(uuid)'
  ) IS NULL OR to_regprocedure(
    'public.create_post_with_poll(jsonb)'
  ) IS NULL OR to_regprocedure(
    'public.cast_community_poll_vote(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: ADDITIVE columns or RPCs are missing';
  END IF;

  IF to_regclass('public.uq_community_poll_votes_legacy_user') IS NULL
     OR to_regclass('public.uq_community_poll_votes_profile_option') IS NULL
     OR to_regclass('public.uq_community_poll_options_poll_id_id') IS NULL THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: transitional Poll indexes are missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE pg_catalog.jsonb_typeof(post.content_payload) = 'object'
      AND pg_catalog.jsonb_typeof(post.content_payload->'poll') = 'object'
      AND (
        post.content_payload->'poll' ? 'question'
        OR post.content_payload->'poll' ? 'options'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.community_polls poll
        WHERE poll.post_id = post.id
      )
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: JSON-only Polls still require backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_polls
    GROUP BY post_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: duplicate community_polls.post_id rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_options
    GROUP BY poll_id, position
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: duplicate Poll option positions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_options
    GROUP BY poll_id, lower(btrim(text))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: duplicate normalized Poll option text';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_polls poll
    LEFT JOIN public.community_poll_options option
      ON option.poll_id = poll.id
    GROUP BY poll.id
    HAVING count(option.id) NOT BETWEEN 2 AND 6
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: a Poll does not contain between two and six Options';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT
        poll_id,
        count(*) AS option_count,
        count(position) AS positioned_count,
        count(DISTINCT position) AS distinct_positions,
        min(position) AS min_position,
        max(position) AS max_position
      FROM public.community_poll_options
      GROUP BY poll_id
    ) option_sequence
    WHERE positioned_count <> option_count
       OR distinct_positions <> option_count
       OR min_position <> 0
       OR max_position <> option_count - 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: Poll option positions are not contiguous from zero';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_polls
    WHERE char_length(btrim(question)) NOT BETWEEN 8 AND 500
  ) OR EXISTS (
    SELECT 1
    FROM public.community_poll_options
    WHERE char_length(btrim(text)) NOT BETWEEN 1 AND 200
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: Poll question or Option text violates the canonical limits';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes
    WHERE profile_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: community_poll_votes.profile_id still contains NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    LEFT JOIN public.profiles profile ON profile.id = vote.profile_id
    WHERE profile.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: a Vote references an invalid Profile';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    JOIN public.profiles profile ON profile.id = vote.profile_id
    WHERE profile.user_id <> vote.user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = vote.profile_id
          AND member.user_id = vote.user_id
      )
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: Vote user_id has no evidence of association with profile_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    LEFT JOIN public.community_poll_options option
      ON option.id = vote.option_id
     AND option.poll_id = vote.poll_id
    WHERE option.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: a Vote references an Option from another Poll';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes
    GROUP BY poll_id, profile_id, option_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: duplicate canonical profile Option Votes';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    JOIN public.community_polls poll ON poll.id = vote.poll_id
    WHERE poll.allow_multiple_choice = FALSE
    GROUP BY vote.poll_id, vote.profile_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: a single-choice Poll has multiple Votes for one Profile';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_options option
    WHERE option.votes <> (
      SELECT count(*)::INTEGER
      FROM public.community_poll_votes vote
      WHERE vote.option_id = option.id
    )
  ) THEN
    RAISE EXCEPTION
      'POLL_CUTOVER_BLOCKED: legacy Option counts are not synchronized';
  END IF;

  FOR v_expected_snapshot IN
    SELECT pg_catalog.jsonb_build_object(
      'poll_id', poll.id,
      'expected', COALESCE(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', option.id,
            'text', option.text,
            'votes', option.votes,
            'position', option.position
          )
          ORDER BY option.position, option.id
        ) FILTER (WHERE option.id IS NOT NULL),
        '[]'::jsonb
      ),
      'actual', poll.options
    )
    FROM public.community_polls poll
    LEFT JOIN public.community_poll_options option ON option.poll_id = poll.id
    GROUP BY poll.id, poll.options
  LOOP
    IF v_expected_snapshot->'expected' IS DISTINCT FROM v_expected_snapshot->'actual' THEN
      RAISE EXCEPTION
        'POLL_CUTOVER_BLOCKED: legacy Poll options snapshot is not synchronized';
    END IF;
  END LOOP;
END;
$poll_cutover_preflight$;

ALTER TABLE public.community_polls
  ADD CONSTRAINT community_polls_question_not_blank
  CHECK (char_length(btrim(question)) BETWEEN 8 AND 500)
  NOT VALID;

ALTER TABLE public.community_poll_options
  ADD CONSTRAINT community_poll_options_text_not_blank
  CHECK (char_length(btrim(text)) BETWEEN 1 AND 200)
  NOT VALID;

ALTER TABLE public.community_polls
  VALIDATE CONSTRAINT community_polls_question_not_blank;
ALTER TABLE public.community_poll_options
  VALIDATE CONSTRAINT community_poll_options_text_not_blank;
ALTER TABLE public.community_poll_votes
  VALIDATE CONSTRAINT community_poll_votes_profile_id_fkey;
ALTER TABLE public.community_poll_votes
  VALIDATE CONSTRAINT community_poll_votes_poll_option_fkey;

ALTER TABLE public.community_poll_votes
  ALTER COLUMN profile_id SET NOT NULL;

ALTER TABLE public.community_poll_votes
  ADD CONSTRAINT community_poll_votes_poll_profile_option_key
  UNIQUE (poll_id, profile_id, option_id);

DROP INDEX public.uq_community_poll_votes_legacy_user;

DROP POLICY IF EXISTS "Polls viewable" ON public.community_polls;
DROP POLICY IF EXISTS "Authors manage polls" ON public.community_polls;
DROP POLICY IF EXISTS community_polls_visible_post_read ON public.community_polls;
DROP POLICY IF EXISTS community_polls_owner_or_admin_read ON public.community_polls;

CREATE POLICY community_polls_visible_post_read
  ON public.community_polls FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts post
      WHERE post.id = community_polls.post_id
        AND post.is_published = TRUE
        AND post.is_hidden = FALSE
        AND post.is_removed = FALSE
    )
  );

CREATE POLICY community_polls_owner_or_admin_read
  ON public.community_polls FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts post
      WHERE post.id = community_polls.post_id
        AND (
          private.auth_owns_active_profile(post.author_profile_id)
          OR COALESCE(
            private.is_admin_user((SELECT auth.uid())),
            FALSE
          )
        )
    )
  );

DROP POLICY IF EXISTS "Poll options viewable" ON public.community_poll_options;
DROP POLICY IF EXISTS "Authors manage poll options" ON public.community_poll_options;
DROP POLICY IF EXISTS community_poll_options_visible_post_read
  ON public.community_poll_options;
DROP POLICY IF EXISTS community_poll_options_owner_or_admin_read
  ON public.community_poll_options;

CREATE POLICY community_poll_options_visible_post_read
  ON public.community_poll_options FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls poll
      JOIN public.posts post ON post.id = poll.post_id
      WHERE poll.id = community_poll_options.poll_id
        AND post.is_published = TRUE
        AND post.is_hidden = FALSE
        AND post.is_removed = FALSE
    )
  );

CREATE POLICY community_poll_options_owner_or_admin_read
  ON public.community_poll_options FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls poll
      JOIN public.posts post ON post.id = poll.post_id
      WHERE poll.id = community_poll_options.poll_id
        AND (
          private.auth_owns_active_profile(post.author_profile_id)
          OR COALESCE(
            private.is_admin_user((SELECT auth.uid())),
            FALSE
          )
        )
    )
  );

DROP POLICY IF EXISTS "Poll votes viewable by authenticated"
  ON public.community_poll_votes;
DROP POLICY IF EXISTS "Users manage own poll votes"
  ON public.community_poll_votes;
DROP POLICY IF EXISTS community_poll_votes_owner_read
  ON public.community_poll_votes;

CREATE POLICY community_poll_votes_owner_read
  ON public.community_poll_votes FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE INSERT (id, poll_id, user_id, option_id, created_at),
       UPDATE (poll_id, user_id, option_id, created_at)
  ON public.community_poll_votes FROM authenticated;

REVOKE ALL ON TABLE public.community_polls FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_poll_options FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_poll_votes FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.community_polls TO anon, authenticated;
GRANT SELECT ON TABLE public.community_poll_options TO anon, authenticated;
GRANT SELECT ON TABLE public.community_poll_votes TO authenticated;

COMMENT ON COLUMN public.community_poll_votes.profile_id IS
  'Canonical non-null active-profile identity after Community Poll CUTOVER.';
COMMENT ON CONSTRAINT community_poll_votes_poll_profile_option_key
  ON public.community_poll_votes IS
  'Retry uniqueness. Single-choice semantics are serialized and enforced by cast_community_poll_vote.';
