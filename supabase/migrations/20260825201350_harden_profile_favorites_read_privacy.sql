-- Profile favorites expose a relationship graph (who favorited whom).
-- The legacy SELECT true policy allowed any signed-in user to enumerate that
-- graph. Keep reads available only when the caller can access either involved
-- profile (owner, active profile member, canonical admin), while preserving the
-- existing owner-managed mutation contract.

DROP POLICY IF EXISTS "Anyone can read favorites"
  ON public.profile_favorites_new;
DROP POLICY IF EXISTS profile_favorites_involved_profiles_read
  ON public.profile_favorites_new;

CREATE POLICY profile_favorites_involved_profiles_read
  ON public.profile_favorites_new
  FOR SELECT
  TO authenticated
  USING (
    private.auth_can_access_profile(favoriting_profile_id)
    OR private.auth_can_access_profile(favorited_profile_id)
  );

DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual
    INTO v_qual
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'profile_favorites_new'
     AND policyname = 'profile_favorites_involved_profiles_read';

  IF v_qual IS NULL
     OR v_qual NOT ILIKE '%auth_can_access_profile%favoriting_profile_id%'
     OR v_qual NOT ILIKE '%auth_can_access_profile%favorited_profile_id%' THEN
    RAISE EXCEPTION 'profile favorites privacy postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'profile_favorites_new'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'profile favorites broad authenticated read still exists';
  END IF;
END
$$;
