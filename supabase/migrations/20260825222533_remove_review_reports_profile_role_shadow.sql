-- review_reports contains moderation/reporting data and must not treat profile-local
-- membership roles as platform-global moderation authority. PostgreSQL permissive
-- policies are OR-combined, so the legacy policy below could shadow the canonical
-- own-or-platform-admin policy whenever a user's owned profile had any local
-- admin/moderator member.

DROP POLICY IF EXISTS "Admins view all reports" ON public.review_reports;

-- The canonical policy must remain the sole authenticated SELECT authority:
-- reporter owns the active profile OR the caller has platform admin authority.
DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'review_reports'
      AND policyname = 'review_reports_select_own_or_admin'
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'canonical review_reports_select_own_or_admin policy is missing';
  END IF;
END;
$block$;
