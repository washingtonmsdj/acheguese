-- user_follows is a relationship graph between profile identities. The table is
-- currently not used by active runtime code, so default to relationship privacy:
-- callers may read a follow edge only when they can access one of the involved
-- profiles (owner, active profile member, canonical admin).

DROP POLICY IF EXISTS "Follows viewable"
  ON public.user_follows;
DROP POLICY IF EXISTS user_follows_involved_profiles_read
  ON public.user_follows;

CREATE POLICY user_follows_involved_profiles_read
  ON public.user_follows
  FOR SELECT
  TO authenticated
  USING (
    private.auth_can_access_profile(follower_id)
    OR private.auth_can_access_profile(following_id)
  );

DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual
    INTO v_qual
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'user_follows'
     AND policyname = 'user_follows_involved_profiles_read';

  IF v_qual IS NULL
     OR v_qual NOT ILIKE '%auth_can_access_profile%follower_id%'
     OR v_qual NOT ILIKE '%auth_can_access_profile%following_id%' THEN
    RAISE EXCEPTION 'user follows privacy postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'user_follows'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'user follows broad authenticated read still exists';
  END IF;
END
$$;
