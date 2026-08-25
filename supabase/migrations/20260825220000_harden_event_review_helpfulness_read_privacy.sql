-- event_review_helpfulness stores the profile identity behind each helpful vote.
-- Public review rendering already uses event_reviews.helpful_count, and active
-- client code only writes the current profile's helpfulness row.

DROP POLICY IF EXISTS "Event review helpfulness is visible to authenticated users"
  ON public.event_review_helpfulness;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'event_review_helpfulness'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'event review helpfulness broad authenticated read still exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'event_review_helpfulness'
       AND policyname = 'Profiles manage own event review helpfulness'
       AND 'authenticated' = ANY(roles)
       AND qual ILIKE '%profile_id%'
       AND qual ILIKE '%auth.uid%'
  ) THEN
    RAISE EXCEPTION 'event review helpfulness owner contract missing';
  END IF;
END
$$;
