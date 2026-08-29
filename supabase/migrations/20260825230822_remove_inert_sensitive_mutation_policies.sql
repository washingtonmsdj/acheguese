-- Align sensitive RLS with the actual command architecture.
--
-- Classified report creation/moderation and profile-verification writes are
-- server-authoritative RPC flows. Browser roles intentionally do not hold the
-- corresponding table mutation grants. Keeping mutation policies behind absent
-- grants is latent authority: a future broad GRANT could silently reactivate
-- direct writes. Remove those inert policy paths and keep only required reads.

-- classified_reports: authenticated creation/moderation goes through
-- create_classified_report / moderate_classified_report RPCs. Preserve the
-- intentional anonymous report INSERT policy separately.
DROP POLICY IF EXISTS "classified_reports_insert_own" ON public.classified_reports;
DROP POLICY IF EXISTS "classified_reports_moderation_update" ON public.classified_reports;
DROP POLICY IF EXISTS "classified_reports_admin_delete" ON public.classified_reports;

-- verification: direct writes are also rejected by
-- private.guard_profile_verification_write(); requests and decisions use RPCs.
DROP POLICY IF EXISTS "Users insert own verification" ON public.verification;
DROP POLICY IF EXISTS "Admins manage verifications" ON public.verification;

-- Moderators/admins may inspect the verification queue, but table mutation stays
-- unavailable to browser roles. Admin decisions continue through the service-role
-- backed review command.
CREATE POLICY "verification_moderation_select"
ON public.verification
FOR SELECT TO authenticated
USING (
  COALESCE(
    private.is_admin_or_moderator_from_roles((SELECT auth.uid())),
    false
  )
);

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'public.classified_reports', 'INSERT')
     OR has_table_privilege('authenticated', 'public.classified_reports', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.classified_reports', 'DELETE') THEN
    RAISE EXCEPTION 'classified_reports browser mutation grant unexpectedly present';
  END IF;

  IF has_table_privilege('authenticated', 'public.verification', 'INSERT')
     OR has_table_privilege('authenticated', 'public.verification', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.verification', 'DELETE') THEN
    RAISE EXCEPTION 'verification browser mutation grant unexpectedly present';
  END IF;
END
$$;
