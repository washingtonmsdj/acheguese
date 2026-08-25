-- MFA enforcement configuration is administrative security metadata.
-- Do not expose it to every signed-in account; keep it available only to
-- currently-valid canonical admins. Existing super-admin mutation policy is
-- preserved unchanged.

DROP POLICY IF EXISTS admin_mfa_enforcement_read_all
  ON public.admin_mfa_enforcement;
DROP POLICY IF EXISTS admin_mfa_enforcement_admin_read
  ON public.admin_mfa_enforcement;

CREATE POLICY admin_mfa_enforcement_admin_read
  ON public.admin_mfa_enforcement
  FOR SELECT
  TO authenticated
  USING (
    private.is_admin_user((SELECT auth.uid()))
  );

DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual
    INTO v_qual
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'admin_mfa_enforcement'
     AND policyname = 'admin_mfa_enforcement_admin_read';

  IF v_qual IS NULL OR v_qual NOT ILIKE '%is_admin_user%' THEN
    RAISE EXCEPTION 'admin MFA enforcement read postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'admin_mfa_enforcement'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'broad authenticated MFA enforcement read still exists';
  END IF;
END
$$;
