-- Consolidate the professional engagement review and its audit event in one
-- database transaction. Actor, target profile and eligibility are derived
-- from the engagement; the browser never supplies identity fields.

BEGIN;

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
  IF v_requester_profile_id IS NULL THEN
    RAISE EXCEPTION 'requester_profile_required'
      USING ERRCODE = '42501';
  END IF;

  v_review_result := public.upsert_profile_review(
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

REVOKE ALL ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) TO authenticated, service_role;

-- Direct participant event writes remain available to the legacy professional
-- workflow, but this server-owned event cannot be forged by that path.
DROP POLICY IF EXISTS professional_lead_events_owner_insert
  ON public.professional_lead_events;
CREATE POLICY professional_lead_events_owner_insert
  ON public.professional_lead_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    event_type <> 'engagement_review_submitted'
    AND EXISTS (
      SELECT 1
      FROM public.professional_leads lead
      JOIN public.professional_data professional
        ON professional.id = lead.professional_id
      JOIN public.profiles profile
        ON profile.id = professional.profile_id
      WHERE lead.id = professional_lead_events.lead_id
        AND profile.user_id = auth.uid()
        AND professional_lead_events.actor_user_id = auth.uid()
    )
  );

COMMENT ON FUNCTION public.submit_professional_engagement_review(
  UUID, INTEGER, TEXT
) IS
  'Submits an eligible professional review and its audit event atomically without trusting browser actor or target identifiers.';

COMMIT;
