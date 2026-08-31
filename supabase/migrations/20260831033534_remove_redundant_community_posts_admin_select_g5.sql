BEGIN;
DO $pre$
DECLARE v_all record; v_select record;
BEGIN
  SELECT cmd,roles,permissive,qual,with_check INTO v_all FROM pg_policies WHERE schemaname='public' AND tablename='community_posts' AND policyname='Admins can manage community posts';
  IF NOT FOUND THEN RAISE EXCEPTION 'G5 precondition failed: canonical community_posts admin ALL policy missing'; END IF;
  SELECT cmd,roles,permissive,qual,with_check INTO v_select FROM pg_policies WHERE schemaname='public' AND tablename='community_posts' AND policyname='Admins can view all community posts';
  IF NOT FOUND THEN RAISE EXCEPTION 'G5 precondition failed: redundant community_posts admin SELECT policy missing'; END IF;
  IF v_all.cmd <> 'ALL' OR v_select.cmd <> 'SELECT' OR v_all.roles <> ARRAY['authenticated']::name[] OR v_select.roles IS DISTINCT FROM v_all.roles OR v_all.permissive <> 'PERMISSIVE' OR v_select.permissive IS DISTINCT FROM v_all.permissive OR v_select.qual IS DISTINCT FROM v_all.qual THEN RAISE EXCEPTION 'G5 precondition failed: community_posts admin SELECT is no longer a shadow of ALL'; END IF;
END
$pre$;
DROP POLICY "Admins can view all community posts" ON public.community_posts;
DO $post$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM pg_policies WHERE schemaname='public' AND tablename='community_posts' AND policyname='Admins can view all community posts';
  IF v_count <> 0 THEN RAISE EXCEPTION 'G5 postcondition failed: redundant community_posts admin SELECT still exists'; END IF;
  SELECT count(*) INTO v_count FROM pg_policies WHERE schemaname='public' AND tablename='community_posts' AND policyname='Admins can manage community posts' AND cmd='ALL' AND roles=ARRAY['authenticated']::name[] AND permissive='PERMISSIVE';
  IF v_count <> 1 THEN RAISE EXCEPTION 'G5 postcondition failed: canonical community_posts admin ALL policy changed'; END IF;
END
$post$;
COMMIT;
