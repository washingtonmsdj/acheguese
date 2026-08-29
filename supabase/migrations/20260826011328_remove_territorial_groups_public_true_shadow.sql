-- Public Territorial Group discovery is intentionally limited to active groups.
-- Remove the legacy SELECT true policy that OR-shadowed the status='active'
-- public policy. Canonical admins retain their separate authenticated read path.

DROP POLICY IF EXISTS public_read_territorial_groups
ON public.territorial_groups;

DO $verify$
DECLARE
  v_broad_public integer;
  v_active_policy integer;
BEGIN
  SELECT count(*)
  INTO v_broad_public
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'territorial_groups'
    AND p.cmd = 'SELECT'
    AND p.roles && ARRAY['public', 'anon', 'authenticated']::name[]
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_public <> 0 THEN
    RAISE EXCEPTION 'broad territorial_groups SELECT true policy remains';
  END IF;

  SELECT count(*)
  INTO v_active_policy
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'territorial_groups'
    AND p.cmd = 'SELECT'
    AND p.policyname = 'Territorial groups viewable by all'
    AND COALESCE(p.qual, '') ILIKE '%status%active%';

  IF v_active_policy <> 1 THEN
    RAISE EXCEPTION 'active-only public territorial group policy missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
