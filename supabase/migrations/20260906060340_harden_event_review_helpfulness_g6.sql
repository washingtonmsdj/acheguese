-- G6 Events: harden event review helpfulness without breaking the currently
-- deployed browser client. INSERT remains temporarily available to authenticated
-- clients under strict RLS until the broker-backed frontend is deployed.

DROP POLICY IF EXISTS "Profiles manage own event review helpfulness"
  ON public.event_review_helpfulness;

DROP POLICY IF EXISTS "Profiles read own event review helpfulness"
  ON public.event_review_helpfulness;
CREATE POLICY "Profiles read own event review helpfulness"
  ON public.event_review_helpfulness
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Profiles insert own event review helpfulness"
  ON public.event_review_helpfulness;
CREATE POLICY "Profiles insert own event review helpfulness"
  ON public.event_review_helpfulness
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.event_reviews er
      WHERE er.id = event_review_helpfulness.review_id
        AND er.status = 'active'
        AND er.reviewer_profile_id <> event_review_helpfulness.profile_id
    )
  );

REVOKE UPDATE, DELETE
  ON TABLE public.event_review_helpfulness
  FROM authenticated;

GRANT SELECT, INSERT
  ON TABLE public.event_review_helpfulness
  TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_event_review_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND COALESCE(auth.jwt()->>'role', '') <> 'service_role'
  THEN
    IF NEW.event_id <> OLD.event_id
      OR NEW.reviewer_profile_id <> OLD.reviewer_profile_id
      OR NEW.helpful_count <> OLD.helpful_count
      OR NEW.status <> OLD.status
    THEN
      RAISE EXCEPTION 'event_review_protected_columns';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_event_review_helpful(
  p_review_id uuid,
  p_profile_id uuid,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reviewer_profile_id uuid;
  v_vote_id uuid;
BEGIN
  IF p_review_id IS NULL OR p_profile_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_event_review_helpful_payload';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'not_authorized_for_event_profile';
  END IF;

  SELECT er.reviewer_profile_id
  INTO v_reviewer_profile_id
  FROM public.event_reviews er
  WHERE er.id = p_review_id
    AND er.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_review_not_found_or_inactive';
  END IF;

  IF v_reviewer_profile_id = p_profile_id THEN
    RAISE EXCEPTION 'event_review_self_helpful_not_allowed';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('event_review_helpful'),
    hashtext(p_review_id::text || ':' || p_actor_user_id::text)
  );

  IF EXISTS (
    SELECT 1
    FROM public.event_review_helpfulness erh
    JOIN public.profiles p ON p.id = erh.profile_id
    WHERE erh.review_id = p_review_id
      AND p.user_id = p_actor_user_id
  ) THEN
    RETURN jsonb_build_object(
      'marked', false,
      'alreadyMarked', true
    );
  END IF;

  INSERT INTO public.event_review_helpfulness (review_id, profile_id)
  VALUES (p_review_id, p_profile_id)
  ON CONFLICT (review_id, profile_id) DO NOTHING
  RETURNING id INTO v_vote_id;

  RETURN jsonb_build_object(
    'marked', v_vote_id IS NOT NULL,
    'alreadyMarked', v_vote_id IS NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_event_review_helpful(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_event_review_helpful(uuid, uuid, uuid)
  TO service_role;

COMMENT ON FUNCTION public.mark_event_review_helpful(uuid, uuid, uuid)
  IS 'Server-owned event review helpfulness command. Called by event-rpc after JWT authentication; rejects self-votes and duplicate votes across profiles of one user.';
