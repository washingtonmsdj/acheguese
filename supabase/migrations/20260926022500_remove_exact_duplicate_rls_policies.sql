-- Remove the only exact duplicate permissive SELECT paths currently present in
-- the public schema. This migration does not broaden authorization.
--
-- profile_links/work_opportunities keep their canonical FOR ALL owner policies,
-- which already provide the exact same SELECT predicate plus required writes.
-- question_answer_likes keeps the canonical SELECT-only policy; authenticated
-- currently has no direct INSERT/UPDATE/DELETE table privileges, so removing the
-- legacy FOR ALL policy strengthens fail-closed behavior for future privilege drift.

BEGIN;

DO $$
DECLARE
  v_manage_qual TEXT;
  v_read_qual TEXT;
BEGIN
  IF NOT COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid='public.profile_links'::regclass), FALSE)
     OR NOT COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid='public.question_answer_likes'::regclass), FALSE)
     OR NOT COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid='public.work_opportunities'::regclass), FALSE) THEN
    RAISE EXCEPTION 'one or more target tables no longer have RLS enabled; review before applying';
  END IF;

  -- profile_links: FOR ALL policy must subsume the SELECT-only duplicate exactly.
  SELECT qual INTO v_manage_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='profile_links'
    AND policyname='Manage profile links'
    AND permissive='PERMISSIVE' AND cmd='ALL'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND THEN
    RAISE EXCEPTION 'canonical Manage profile links policy is missing or changed';
  END IF;

  SELECT qual INTO v_read_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='profile_links'
    AND policyname='View profile links'
    AND permissive='PERMISSIVE' AND cmd='SELECT'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND OR v_manage_qual IS DISTINCT FROM v_read_qual THEN
    RAISE EXCEPTION 'profile_links SELECT policies are no longer exact duplicates';
  END IF;

  -- work_opportunities: FOR ALL policy must subsume SELECT-only duplicate exactly.
  SELECT qual INTO v_manage_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='work_opportunities'
    AND policyname='Owners manage own work opportunities'
    AND permissive='PERMISSIVE' AND cmd='ALL'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND THEN
    RAISE EXCEPTION 'canonical work-opportunity manage policy is missing or changed';
  END IF;

  SELECT qual INTO v_read_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='work_opportunities'
    AND policyname='Owners view own work opportunities'
    AND permissive='PERMISSIVE' AND cmd='SELECT'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND OR v_manage_qual IS DISTINCT FROM v_read_qual THEN
    RAISE EXCEPTION 'work_opportunities SELECT policies are no longer exact duplicates';
  END IF;

  -- question_answer_likes: keep read-only policy and remove old FOR ALL policy.
  SELECT qual INTO v_manage_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='question_answer_likes'
    AND policyname='Users manage own answer likes'
    AND permissive='PERMISSIVE' AND cmd='ALL'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND THEN
    RAISE EXCEPTION 'legacy question_answer_likes manage policy is missing or changed';
  END IF;

  SELECT qual INTO v_read_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='question_answer_likes'
    AND policyname='question_answer_likes_own_read'
    AND permissive='PERMISSIVE' AND cmd='SELECT'
    AND roles = ARRAY['authenticated']::name[];
  IF NOT FOUND OR v_manage_qual IS DISTINCT FROM v_read_qual THEN
    RAISE EXCEPTION 'question_answer_likes SELECT predicates are no longer exact duplicates';
  END IF;

  IF has_table_privilege('authenticated','public.question_answer_likes','INSERT')
     OR has_table_privilege('authenticated','public.question_answer_likes','UPDATE')
     OR has_table_privilege('authenticated','public.question_answer_likes','DELETE') THEN
    RAISE EXCEPTION 'authenticated gained direct question_answer_likes write privileges; review before applying';
  END IF;
END;
$$;

DROP POLICY "View profile links" ON public.profile_links;
DROP POLICY "Owners view own work opportunities" ON public.work_opportunities;
DROP POLICY "Users manage own answer likes" ON public.question_answer_likes;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profile_links'
      AND policyname='Manage profile links' AND cmd='ALL'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: Manage profile links missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='work_opportunities'
      AND policyname='Owners manage own work opportunities' AND cmd='ALL'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: Owners manage own work opportunities missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='question_answer_likes'
      AND policyname='question_answer_likes_own_read' AND cmd='SELECT'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: question_answer_likes_own_read missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND (
        (tablename='profile_links' AND policyname='View profile links')
        OR (tablename='work_opportunities' AND policyname='Owners view own work opportunities')
        OR (tablename='question_answer_likes' AND policyname='Users manage own answer likes')
      )
  ) THEN
    RAISE EXCEPTION 'postcondition failed: one or more redundant policies still exist';
  END IF;

  IF has_table_privilege('authenticated','public.question_answer_likes','INSERT')
     OR has_table_privilege('authenticated','public.question_answer_likes','UPDATE')
     OR has_table_privilege('authenticated','public.question_answer_likes','DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: direct question_answer_likes write privilege exists';
  END IF;
END;
$$;

COMMIT;
