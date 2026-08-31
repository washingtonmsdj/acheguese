BEGIN;

DO $pre$
DECLARE
  v_all record;
  v_select record;
  v_public_count integer;
BEGIN
  SELECT cmd, roles, permissive, qual, with_check
    INTO v_all
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Admins can manage locations';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'G5 precondition failed: canonical ALL admin locations policy is missing';
  END IF;

  SELECT cmd, roles, permissive, qual, with_check
    INTO v_select
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Admins can view all locations';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'G5 precondition failed: redundant admin SELECT locations policy is missing';
  END IF;

  IF v_all.cmd <> 'ALL'
     OR v_select.cmd <> 'SELECT'
     OR v_all.roles IS DISTINCT FROM v_select.roles
     OR v_all.permissive IS DISTINCT FROM v_select.permissive
     OR v_all.qual IS DISTINCT FROM v_select.qual THEN
    RAISE EXCEPTION 'G5 precondition failed: locations admin policies are no longer semantically overlapping';
  END IF;

  IF v_all.roles <> ARRAY['authenticated']::name[]
     OR v_all.permissive <> 'PERMISSIVE'
     OR v_all.with_check IS NULL THEN
    RAISE EXCEPTION 'G5 precondition failed: canonical locations admin ALL policy contract changed';
  END IF;

  SELECT count(*) INTO v_public_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Locations ativas visíveis publicamente'
    AND cmd='SELECT'
    AND roles=ARRAY['public']::name[]
    AND qual='(status = ''active''::text)';

  IF v_public_count <> 1 THEN
    RAISE EXCEPTION 'G5 precondition failed: canonical public active-locations policy changed';
  END IF;
END
$pre$;

DROP POLICY "Admins can view all locations" ON public.locations;

DO $post$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Admins can view all locations';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 postcondition failed: redundant locations admin SELECT policy still exists';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Admins can manage locations'
    AND cmd='ALL'
    AND roles=ARRAY['authenticated']::name[]
    AND permissive='PERMISSIVE'
    AND qual='private.is_admin(( SELECT auth.uid() AS uid))'
    AND with_check='private.is_admin(( SELECT auth.uid() AS uid))';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 postcondition failed: canonical locations admin ALL policy changed';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='locations'
    AND policyname='Locations ativas visíveis publicamente'
    AND cmd='SELECT'
    AND roles=ARRAY['public']::name[]
    AND qual='(status = ''active''::text)';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 postcondition failed: public active-locations policy changed';
  END IF;
END
$post$;

COMMIT;
