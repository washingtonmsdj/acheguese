-- Keep the professional review write algorithm in one private Core command.
-- The generic public command still requires the currently selected profile,
-- while an engagement review remains bound to the original requester profile.

BEGIN;

-- security-authority: internal-function private.auth_owns_usable_profile
CREATE OR REPLACE FUNCTION private.auth_owns_usable_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_profile_id IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = p_profile_id
        AND profile.is_active = TRUE
        AND NOT (
          (profile.is_suspended = TRUE OR profile.suspended = TRUE)
          AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
        )
        AND (
          profile.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.profile_members member
            WHERE member.profile_id = profile.id
              AND member.user_id = auth.uid()
              AND member.is_active = TRUE
          )
        )
    );
$$;

-- security-authority: internal-function private.upsert_professional_profile_review
CREATE OR REPLACE FUNCTION private.upsert_professional_profile_review(
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_reviewer_profile_id) THEN
    RAISE EXCEPTION 'active_reviewer_profile_required'
      USING ERRCODE = '42501';
  END IF;

  RETURN private.upsert_professional_profile_review(
    p_reviewed_profile_id,
    p_reviewer_profile_id,
    p_rating,
    p_comment
  );
END;
$$;

-- security-authority: public-rpc public.submit_professional_engagement_review
CREATE OR REPLACE FUNCTION public.submit_professional_engagement_review(
  p_engagement_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '4s'
AS $$
DECLARE
  v_lead_id UUID;
  v_professional_profile_id UUID;
  v_requester_profile_id UUID;
  v_review_id UUID;
  v_review_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT
    engagement.lead_id,
    professional.profile_id,
    engagement.requester_profile_id
  INTO
    v_lead_id,
    v_professional_profile_id,
    v_requester_profile_id
  FROM public.professional_service_engagements engagement
  JOIN public.professional_data professional
    ON professional.id = engagement.professional_id
  WHERE engagement.id = p_engagement_id
    AND engagement.requester_user_id = auth.uid()
    AND engagement.status = 'completed'
  FOR UPDATE OF engagement;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'completed_owned_engagement_required'
      USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_usable_profile(v_requester_profile_id) THEN
    RAISE EXCEPTION 'owned_requester_profile_required'
      USING ERRCODE = '42501';
  END IF;

  v_review_result := private.upsert_professional_profile_review(
    v_professional_profile_id,
    v_requester_profile_id,
    p_rating,
    p_comment
  );
  v_review_id := (v_review_result -> 'review' ->> 'id')::UUID;

  INSERT INTO public.professional_lead_events (
    lead_id,
    event_type,
    actor_user_id,
    payload
  ) VALUES (
    v_lead_id,
    'engagement_review_submitted',
    auth.uid(),
    jsonb_build_object(
      'engagement_id', p_engagement_id,
      'review_id', v_review_id,
      'rating', p_rating
    )
  );

  RETURN v_review_result;
END;
$$;

REVOKE ALL ON FUNCTION private.auth_owns_usable_profile(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.upsert_professional_profile_review(
  UUID, UUID, INTEGER, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.auth_owns_usable_profile(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION private.upsert_professional_profile_review(
  UUID, UUID, INTEGER, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) TO authenticated, service_role;

COMMENT ON FUNCTION private.auth_owns_usable_profile(UUID) IS
  'Checks whether the authenticated user still owns or actively belongs to a usable profile, independent of current selection.';
COMMENT ON FUNCTION private.upsert_professional_profile_review(
  UUID, UUID, INTEGER, TEXT
) IS
  'Canonical internal write command for eligible professional profile reviews. Callers must authorize reviewer identity first.';
COMMENT ON FUNCTION public.upsert_profile_review(
  UUID, UUID, INTEGER, TEXT
) IS
  'Creates or updates an eligible professional review for the currently selected profile.';
COMMENT ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) IS
  'Submits an engagement review and audit event atomically for the original requester profile still owned by the authenticated user.';

COMMIT;
