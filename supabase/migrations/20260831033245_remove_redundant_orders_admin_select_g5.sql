BEGIN;

DO $pre$
DECLARE
  v_all record;
  v_select record;
BEGIN
  SELECT cmd, roles, permissive, qual, with_check
    INTO v_all
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='orders'
    AND policyname='Admins can manage orders';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'G5 precondition failed: canonical orders admin ALL policy missing';
  END IF;

  SELECT cmd, roles, permissive, qual, with_check
    INTO v_select
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='orders'
    AND policyname='Admins can view all orders';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'G5 precondition failed: redundant orders admin SELECT policy missing';
  END IF;

  IF v_all.cmd <> 'ALL'
     OR v_select.cmd <> 'SELECT'
     OR v_all.roles <> ARRAY['authenticated']::name[]
     OR v_select.roles IS DISTINCT FROM v_all.roles
     OR v_all.permissive <> 'PERMISSIVE'
     OR v_select.permissive IS DISTINCT FROM v_all.permissive
     OR v_select.qual IS DISTINCT FROM v_all.qual THEN
    RAISE EXCEPTION 'G5 precondition failed: orders admin SELECT is no longer a shadow of ALL';
  END IF;
END
$pre$;

DROP POLICY "Admins can view all orders" ON public.orders;

DO $post$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='orders'
    AND policyname='Admins can view all orders';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'G5 postcondition failed: redundant orders admin SELECT still exists';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename='orders'
    AND policyname='Admins can manage orders'
    AND cmd='ALL'
    AND roles=ARRAY['authenticated']::name[]
    AND permissive='PERMISSIVE';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'G5 postcondition failed: canonical orders admin ALL policy changed';
  END IF;
END
$post$;

COMMIT;
