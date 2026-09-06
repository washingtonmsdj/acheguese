-- G6 Education analytics identifier repair.
-- education_profiles.business_id is a legacy name for profiles.id, while the
-- analytics foreign key is intentionally business_data.id. Make that distinction
-- explicit before data exists.

DO $$
DECLARE
  v_rows integer;
BEGIN
  SELECT count(*)::integer
  INTO v_rows
  FROM public.education_analytics_events;

  IF v_rows <> 0 THEN
    RAISE EXCEPTION
      'education analytics identifier repair expects empty table, found % rows',
      v_rows;
  END IF;
END;
$$;

DROP POLICY IF EXISTS allow_anonymous_insert_analytics
ON public.education_analytics_events;

ALTER TABLE public.education_analytics_events
  RENAME COLUMN business_id TO business_data_id;

ALTER TABLE public.education_analytics_events
  RENAME CONSTRAINT education_analytics_events_business_id_fkey
  TO education_analytics_events_business_data_id_fkey;

CREATE POLICY allow_anonymous_insert_analytics
ON public.education_analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.education_profiles ep
    WHERE ep.id = education_analytics_events.education_profile_id
      AND ep.niche_key::text = education_analytics_events.niche_key::text
      AND (
        education_analytics_events.business_data_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.business_data bd
          WHERE bd.id = education_analytics_events.business_data_id
            AND bd.profile_id = ep.business_id
            AND bd.status = 'active'
        )
      )
  )
  AND (
    program_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.education_programs p
      WHERE p.id = education_analytics_events.program_id
        AND p.education_profile_id =
          education_analytics_events.education_profile_id
    )
  )
  AND (
    education_event_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.education_events e
      WHERE e.id = education_analytics_events.education_event_id
        AND e.education_profile_id =
          education_analytics_events.education_profile_id
    )
  )
  AND (
    lead_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.education_leads l
      WHERE l.id = education_analytics_events.lead_id
        AND l.education_profile_id =
          education_analytics_events.education_profile_id
    )
  )
  AND octet_length(COALESCE(metadata, '{}'::jsonb)::text) <= 8192
);

COMMENT ON COLUMN public.education_analytics_events.business_data_id IS
  'Canonical Business aggregate id (business_data.id), never a Profile id.';
COMMENT ON COLUMN public.education_profiles.business_id IS
  'Legacy column name: stores the canonical Business Profile id (profiles.id), not business_data.id.';
