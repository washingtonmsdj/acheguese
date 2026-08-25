-- Restrict operational statistics to profile managers and canonical platform admins.
--
-- business_stats and professional_stats previously exposed every row to any
-- authenticated user. These tables contain operational engagement metrics and,
-- for professionals, completion/response metrics that should not be globally
-- enumerable from the Data API.

DROP POLICY IF EXISTS "Business stats viewable" ON public.business_stats;
CREATE POLICY "business_stats_manager_or_admin_read"
ON public.business_stats
FOR SELECT TO authenticated
USING (
  private.can_manage_profile(profile_id)
  OR COALESCE(private.is_admin_user((SELECT auth.uid())), FALSE)
);

DROP POLICY IF EXISTS "Professional stats viewable" ON public.professional_stats;
CREATE POLICY "professional_stats_manager_or_admin_read"
ON public.professional_stats
FOR SELECT TO authenticated
USING (
  private.can_manage_profile(profile_id)
  OR COALESCE(private.is_admin_user((SELECT auth.uid())), FALSE)
);

-- Fail closed if a future edit recreates an unrestricted authenticated SELECT
-- policy on either operational statistics table.
DO $verify$
DECLARE
  v_broad_selects integer;
BEGIN
  SELECT count(*)
  INTO v_broad_selects
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('business_stats', 'professional_stats')
    AND p.cmd = 'SELECT'
    AND p.roles @> ARRAY['authenticated']::name[]
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_selects <> 0 THEN
    RAISE EXCEPTION 'unrestricted authenticated statistics read policies remain: %', v_broad_selects;
  END IF;
END
$verify$;
