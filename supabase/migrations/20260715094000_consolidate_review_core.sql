-- Consolidate profile reviews in public.reviews and move all browser writes
-- behind server-owned commands. Legacy tables are removed only after every
-- row is represented by the canonical aggregate.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Reconcile remote-only legacy tables before changing the runtime contract.
-- --------------------------------------------------------------------------

DO $migration$
DECLARE
  v_unreconciled BIGINT;
BEGIN
  IF to_regclass('public.business_reviews_new') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO public.reviews (
        reviewed_profile_id,
        reviewer_profile_id,
        rating,
        comment,
        review_type,
        status,
        created_at,
        updated_at
      )
      SELECT
        legacy.reviewed_profile_id,
        legacy.reviewer_profile_id,
        legacy.rating,
        legacy.comment,
        'business',
        'active',
        legacy.created_at,
        legacy.updated_at
      FROM public.business_reviews_new legacy
      ON CONFLICT (reviewed_profile_id, reviewer_profile_id, review_type)
      DO NOTHING
    $sql$;

    EXECUTE $sql$
      SELECT count(*)
      FROM public.business_reviews_new legacy
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.reviews canonical
        WHERE canonical.reviewed_profile_id = legacy.reviewed_profile_id
          AND canonical.reviewer_profile_id = legacy.reviewer_profile_id
          AND canonical.review_type::TEXT = 'business'
          AND canonical.rating = legacy.rating
          AND canonical.comment IS NOT DISTINCT FROM legacy.comment
      )
    $sql$ INTO v_unreconciled;

    IF v_unreconciled > 0 THEN
      RAISE EXCEPTION
        'business_review_reconciliation_failed: % row(s)',
        v_unreconciled;
    END IF;

    EXECUTE 'DROP TABLE public.business_reviews_new RESTRICT';
  END IF;

  IF to_regclass('public.professional_reviews_new') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO public.reviews (
        reviewed_profile_id,
        reviewer_profile_id,
        rating,
        comment,
        review_type,
        status,
        created_at,
        updated_at
      )
      SELECT
        legacy.reviewed_profile_id,
        legacy.reviewer_profile_id,
        legacy.rating,
        legacy.comment,
        'professional',
        'active',
        legacy.created_at,
        legacy.updated_at
      FROM public.professional_reviews_new legacy
      ON CONFLICT (reviewed_profile_id, reviewer_profile_id, review_type)
      DO NOTHING
    $sql$;

    EXECUTE $sql$
      SELECT count(*)
      FROM public.professional_reviews_new legacy
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.reviews canonical
        WHERE canonical.reviewed_profile_id = legacy.reviewed_profile_id
          AND canonical.reviewer_profile_id = legacy.reviewer_profile_id
          AND canonical.review_type::TEXT = 'professional'
          AND canonical.rating = legacy.rating
          AND canonical.comment IS NOT DISTINCT FROM legacy.comment
      )
    $sql$ INTO v_unreconciled;

    IF v_unreconciled > 0 THEN
      RAISE EXCEPTION
        'professional_review_reconciliation_failed: % row(s)',
        v_unreconciled;
    END IF;

    EXECUTE 'DROP TABLE public.professional_reviews_new RESTRICT';
  END IF;
END;
$migration$;

-- --------------------------------------------------------------------------
-- Bounded indexes and public read policy.
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_type_active_created
  ON public.reviews (
    reviewed_profile_id,
    review_type,
    created_at DESC,
    id DESC
  )
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_type_active_created
  ON public.reviews (
    reviewer_profile_id,
    review_type,
    created_at DESC,
    id DESC
  )
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_professional_engagement_review_eligibility
  ON public.professional_service_engagements (
    requester_profile_id,
    professional_id,
    status
  )
  WHERE status = 'completed' AND requester_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_job_review_eligibility
  ON public.professional_jobs (client_id, profile_id, status)
  WHERE status = 'completed' AND client_id IS NOT NULL;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews viewable" ON public.reviews;
DROP POLICY IF EXISTS "Users manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS reviews_public_active_select ON public.reviews;
CREATE POLICY reviews_public_active_select
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.profiles reviewer
      WHERE reviewer.id = reviews.reviewer_profile_id
        AND reviewer.is_active = TRUE
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles reviewed
      WHERE reviewed.id = reviews.reviewed_profile_id
        AND reviewed.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS reviews_admin_select ON public.reviews;
CREATE POLICY reviews_admin_select
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE));

REVOKE ALL ON TABLE public.reviews FROM anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;

-- --------------------------------------------------------------------------
-- Fixed-size per-actor command limiter. A rejected increment rolls back while
-- the stored window remains at its limit, so repeated abuse stays blocked.
-- --------------------------------------------------------------------------

-- security-authority: internal-table private.review_command_rate_limits
CREATE TABLE IF NOT EXISTS private.review_command_rate_limits (
  actor_profile_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'upsert_profile_review',
      'delete_profile_review',
      'set_review_helpfulness'
    )
  ),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_profile_id, action)
);

REVOKE ALL ON TABLE private.review_command_rate_limits
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.review_command_rate_limits TO service_role;

-- security-authority: internal-function private.enforce_review_command_rate_limit
CREATE OR REPLACE FUNCTION private.enforce_review_command_rate_limit(
  p_actor_profile_id UUID,
  p_action TEXT,
  p_request_limit INTEGER,
  p_window INTERVAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  IF p_actor_profile_id IS NULL
     OR p_action NOT IN (
       'upsert_profile_review',
       'delete_profile_review',
       'set_review_helpfulness'
     )
     OR p_request_limit < 1
     OR p_window <= interval '0 seconds' THEN
    RAISE EXCEPTION 'invalid_review_rate_limit_contract'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.review_command_rate_limits AS rate_limit (
    actor_profile_id,
    action,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (p_actor_profile_id, p_action, now(), 1, now())
  ON CONFLICT (actor_profile_id, action)
  DO UPDATE SET
    window_started_at = CASE
      WHEN rate_limit.window_started_at <= now() - p_window THEN now()
      ELSE rate_limit.window_started_at
    END,
    request_count = CASE
      WHEN rate_limit.window_started_at <= now() - p_window THEN 1
      ELSE rate_limit.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_request_count;

  IF v_request_count > p_request_limit THEN
    RAISE EXCEPTION 'review_command_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_review_command_rate_limit(
  UUID, TEXT, INTEGER, INTERVAL
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_review_command_rate_limit(
  UUID, TEXT, INTEGER, INTERVAL
) TO service_role;

-- --------------------------------------------------------------------------
-- Professional profile review commands. Identity and completed-service
-- eligibility are enforced in the database, not inferred by the UI.
-- --------------------------------------------------------------------------

-- security-authority: public-rpc public.upsert_profile_review
CREATE OR REPLACE FUNCTION public.upsert_profile_review(
  p_reviewed_profile_id UUID,
  p_reviewer_profile_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_comment TEXT := NULLIF(trim(COALESCE(p_comment, '')), '');
  v_is_new BOOLEAN;
  v_review public.reviews;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_reviewer_profile_id) THEN
    RAISE EXCEPTION 'active_reviewer_profile_required'
      USING ERRCODE = '42501';
  END IF;
  IF p_reviewed_profile_id IS NULL
     OR p_reviewed_profile_id = p_reviewer_profile_id THEN
    RAISE EXCEPTION 'valid_review_target_required'
      USING ERRCODE = '22023';
  END IF;
  IF p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'review_rating_out_of_range'
      USING ERRCODE = '22023';
  END IF;
  IF v_comment IS NOT NULL AND char_length(v_comment) > 1000 THEN
    RAISE EXCEPTION 'review_comment_too_long'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.professional_data professional
      ON professional.profile_id = profile.id
    WHERE profile.id = p_reviewed_profile_id
      AND profile.is_active = TRUE
      AND profile.is_suspended = FALSE
      AND profile.suspended = FALSE
      AND (
        profile.suspended_until IS NULL
        OR profile.suspended_until <= now()
      )
  ) THEN
    RAISE EXCEPTION 'active_professional_profile_required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_data professional
    JOIN public.professional_service_engagements engagement
      ON engagement.professional_id = professional.id
    WHERE professional.profile_id = p_reviewed_profile_id
      AND engagement.requester_profile_id = p_reviewer_profile_id
      AND engagement.status = 'completed'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.professional_jobs job
    WHERE job.profile_id = p_reviewed_profile_id
      AND job.client_id = p_reviewer_profile_id
      AND job.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'completed_professional_service_required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.enforce_review_command_rate_limit(
    p_reviewer_profile_id,
    'upsert_profile_review',
    20,
    interval '1 hour'
  );
  PERFORM pg_advisory_xact_lock(
    hashtext('profile_review_upsert'),
    hashtext(p_reviewer_profile_id::TEXT || ':' || p_reviewed_profile_id::TEXT)
  );

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.reviews review
    WHERE review.reviewed_profile_id = p_reviewed_profile_id
      AND review.reviewer_profile_id = p_reviewer_profile_id
      AND review.review_type::TEXT = 'professional'
      AND review.status = 'active'
  ) INTO v_is_new;

  INSERT INTO public.reviews (
    reviewed_profile_id,
    reviewer_profile_id,
    rating,
    comment,
    review_type,
    status
  )
  VALUES (
    p_reviewed_profile_id,
    p_reviewer_profile_id,
    p_rating,
    v_comment,
    'professional',
    'active'
  )
  ON CONFLICT (reviewed_profile_id, reviewer_profile_id, review_type)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    status = 'active',
    photos = ARRAY[]::TEXT[],
    order_id = NULL,
    business_response = NULL,
    business_response_at = NULL,
    updated_at = now()
  RETURNING * INTO v_review;

  RETURN jsonb_build_object(
    'review', to_jsonb(v_review),
    'isNew', v_is_new
  );
END;
$$;

-- security-authority: public-rpc public.delete_profile_review
CREATE OR REPLACE FUNCTION public.delete_profile_review(
  p_review_id UUID,
  p_reviewer_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_deleted_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_admin
     AND NOT private.auth_owns_active_profile(p_reviewer_profile_id) THEN
    RAISE EXCEPTION 'active_reviewer_profile_required'
      USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := CASE
    WHEN v_is_admin THEN private.current_active_profile_id()
    ELSE p_reviewer_profile_id
  END;
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_actor_profile_required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.enforce_review_command_rate_limit(
    v_actor_profile_id,
    'delete_profile_review',
    20,
    interval '1 hour'
  );

  UPDATE public.reviews review
  SET status = 'deleted', updated_at = now()
  WHERE review.id = p_review_id
    AND review.review_type::TEXT = 'professional'
    AND review.status = 'active'
    AND (
      v_is_admin
      OR review.reviewer_profile_id = p_reviewer_profile_id
    )
  RETURNING review.id INTO v_deleted_id;

  RETURN v_deleted_id IS NOT NULL;
END;
$$;

-- security-authority: public-rpc public.get_profile_review_stats
CREATE OR REPLACE FUNCTION public.get_profile_review_stats(
  p_reviewed_profile_id UUID,
  p_review_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_review_type NOT IN ('business', 'professional', 'service') THEN
    RAISE EXCEPTION 'invalid_review_type' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'total', count(*),
    'average', COALESCE(round(avg(review.rating)::NUMERIC, 1), 0),
    'distribution', jsonb_build_object(
      '1', count(*) FILTER (WHERE review.rating = 1),
      '2', count(*) FILTER (WHERE review.rating = 2),
      '3', count(*) FILTER (WHERE review.rating = 3),
      '4', count(*) FILTER (WHERE review.rating = 4),
      '5', count(*) FILTER (WHERE review.rating = 5)
    )
  )
  INTO v_result
  FROM public.reviews review
  WHERE review.reviewed_profile_id = p_reviewed_profile_id
    AND review.review_type::TEXT = p_review_type
    AND review.status = 'active';

  RETURN v_result;
END;
$$;

-- --------------------------------------------------------------------------
-- Helpfulness is a server-owned interaction. The browser cannot insert a
-- voter_profile_id directly or enumerate other profiles' votes.
-- --------------------------------------------------------------------------

ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can vote on reviews" ON public.review_helpfulness;
DROP POLICY IF EXISTS review_helpfulness_select_own ON public.review_helpfulness;

REVOKE ALL ON TABLE public.review_helpfulness FROM anon, authenticated;
GRANT ALL ON TABLE public.review_helpfulness TO service_role;

-- security-authority: public-rpc public.set_review_helpfulness
CREATE OR REPLACE FUNCTION public.set_review_helpfulness(
  p_review_id UUID,
  p_voter_profile_id UUID,
  p_is_helpful BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_review_author_profile_id UUID;
  v_vote public.review_helpfulness;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_voter_profile_id) THEN
    RAISE EXCEPTION 'active_voter_profile_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT review.reviewer_profile_id
  INTO v_review_author_profile_id
  FROM public.reviews review
  WHERE review.id = p_review_id
    AND review.status = 'active';

  IF v_review_author_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_review_required' USING ERRCODE = 'P0002';
  END IF;
  IF v_review_author_profile_id = p_voter_profile_id THEN
    RAISE EXCEPTION 'own_review_vote_not_allowed' USING ERRCODE = '42501';
  END IF;

  PERFORM private.enforce_review_command_rate_limit(
    p_voter_profile_id,
    'set_review_helpfulness',
    120,
    interval '1 hour'
  );
  PERFORM pg_advisory_xact_lock(
    hashtext('review_helpfulness'),
    hashtext(p_review_id::TEXT || ':' || p_voter_profile_id::TEXT)
  );

  INSERT INTO public.review_helpfulness (
    review_id,
    voter_profile_id,
    is_helpful
  )
  VALUES (p_review_id, p_voter_profile_id, p_is_helpful)
  ON CONFLICT (review_id, voter_profile_id)
  DO UPDATE SET
    is_helpful = EXCLUDED.is_helpful,
    updated_at = now()
  RETURNING * INTO v_vote;

  RETURN to_jsonb(v_vote);
END;
$$;

-- security-authority: public-rpc public.get_current_review_helpfulness
CREATE OR REPLACE FUNCTION public.get_current_review_helpfulness(
  p_review_id UUID,
  p_voter_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_is_helpful BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_voter_profile_id) THEN
    RAISE EXCEPTION 'active_voter_profile_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT vote.is_helpful
  INTO v_is_helpful
  FROM public.review_helpfulness vote
  WHERE vote.review_id = p_review_id
    AND vote.voter_profile_id = p_voter_profile_id;

  RETURN v_is_helpful;
END;
$$;

-- --------------------------------------------------------------------------
-- Bound the existing public business read model without changing its shape.
-- --------------------------------------------------------------------------

-- security-authority: public-rpc public.get_business_reviews
CREATE OR REPLACE FUNCTION public.get_business_reviews(
  p_business_profile_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  reviewer_profile_id UUID,
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  rating INTEGER,
  comment TEXT,
  photos TEXT[],
  business_response TEXT,
  business_response_at TIMESTAMPTZ,
  order_id UUID,
  helpful_count INTEGER,
  not_helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  is_verified BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT
    review.id,
    review.reviewer_profile_id,
    COALESCE(profile.name, 'Usuario') AS reviewer_name,
    profile.avatar_url AS reviewer_avatar,
    review.rating,
    review.comment,
    COALESCE(review.photos, ARRAY[]::TEXT[]) AS photos,
    review.business_response,
    review.business_response_at,
    review.order_id,
    COALESCE(review.helpful_count, 0) AS helpful_count,
    COALESCE(review.not_helpful_count, 0) AS not_helpful_count,
    review.created_at,
    review.order_id IS NOT NULL AS is_verified
  FROM public.reviews review
  LEFT JOIN public.profiles profile ON profile.id = review.reviewer_profile_id
  WHERE review.reviewed_profile_id = p_business_profile_id
    AND review.status = 'active'
    AND review.review_type::TEXT = 'business'
  ORDER BY review.created_at DESC, review.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
  OFFSET LEAST(GREATEST(COALESCE(p_offset, 0), 0), 5000);
$$;

REVOKE ALL ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_profile_review(UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_profile_review_stats(UUID, TEXT)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_review_helpfulness(UUID, UUID, BOOLEAN)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_review_helpfulness(UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_reviews(UUID, INTEGER, INTEGER)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_profile_review(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_review_stats(UUID, TEXT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_review_helpfulness(UUID, UUID, BOOLEAN)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_review_helpfulness(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID, INTEGER, INTEGER)
  TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_profile_review(UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_review_stats(UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.set_review_helpfulness(UUID, UUID, BOOLEAN)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_review_helpfulness(UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_business_reviews(UUID, INTEGER, INTEGER)
  TO service_role;

COMMENT ON TABLE private.review_command_rate_limits IS
  'Fixed-size per-profile rate windows for server-owned review commands.';
COMMENT ON FUNCTION public.upsert_profile_review(UUID, UUID, INTEGER, TEXT) IS
  'Creates or updates a professional review after ownership and completed-service checks.';
COMMENT ON FUNCTION public.delete_profile_review(UUID, UUID) IS
  'Soft-deletes an owned professional review through a server-owned command.';
COMMENT ON FUNCTION public.get_profile_review_stats(UUID, TEXT) IS
  'Returns bounded aggregate statistics from the canonical reviews table.';
COMMENT ON FUNCTION public.set_review_helpfulness(UUID, UUID, BOOLEAN) IS
  'Sets an owned profile helpfulness vote without trusting browser actor identity.';
COMMENT ON FUNCTION public.get_current_review_helpfulness(UUID, UUID) IS
  'Returns only the authenticated profile own vote for a review.';
COMMENT ON FUNCTION public.get_business_reviews(UUID, INTEGER, INTEGER) IS
  'Returns active business reviews with bounded pagination under public RLS.';
