-- Emergency contacts contain sensitive personal PII (name, email, phone).
-- The canonical Safety contract says the profile must belong to auth.uid().
-- Do not widen reads through profile_members/shared-profile access.

DROP POLICY IF EXISTS emergency_contacts_select_own
ON public.emergency_contacts;

CREATE POLICY emergency_contacts_select_own
ON public.emergency_contacts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = emergency_contacts.profile_id
      AND profile.user_id = (SELECT auth.uid())
  )
);

DO $verify$
DECLARE
  v_qual text;
BEGIN
  SELECT qual
  INTO v_qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'emergency_contacts'
    AND policyname = 'emergency_contacts_select_own'
    AND cmd = 'SELECT';

  IF v_qual IS NULL THEN
    RAISE EXCEPTION 'emergency_contacts owner-only SELECT policy missing';
  END IF;

  IF v_qual ILIKE '%auth_can_access_profile%'
     OR v_qual ILIKE '%profile_members%'
     OR v_qual NOT ILIKE '%profile.user_id%'
     OR v_qual NOT ILIKE '%auth.uid()%'
  THEN
    RAISE EXCEPTION 'emergency_contacts SELECT is not direct-owner-only: %', v_qual;
  END IF;

  IF has_table_privilege('anon', 'public.emergency_contacts', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not have SELECT on emergency_contacts';
  END IF;
END
$verify$;
