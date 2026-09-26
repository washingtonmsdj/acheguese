-- Consolidate two remaining permissive RLS redundancies proven against the live
-- production catalog on 2026-09-26.
--
-- 1) work_opportunities: the SELECT-only owner policy has the exact same USING
--    predicate as the canonical FOR ALL owner policy.
-- 2) profiles: the legacy owner UPDATE policy cannot authorize anything beyond
--    the canonical owner UPDATE policy. Structural identity, score and moderation
--    fields are enforced by trg_guard_profile_server_owned_fields. Browser DELETE
--    remains revoked and the deny-delete policy is intentionally preserved.

BEGIN;

DO $$
DECLARE
  v_manage_qual text;
  v_view_qual text;
BEGIN
  IF NOT COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid='public.work_opportunities'::regclass), FALSE)
     OR NOT COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass), FALSE) THEN
    RAISE EXCEPTION 'target table RLS state changed; review before applying';
  END IF;

  SELECT qual INTO v_manage_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='work_opportunities'
    AND policyname='Owners manage own work opportunities'
    AND permissive='PERMISSIVE' AND cmd='ALL'
    AND roles=ARRAY['authenticated']::name[];

  SELECT qual INTO v_view_qual
  FROM pg_policies
  WHERE schemaname='public' AND tablename='work_opportunities'
    AND policyname='Owners view own work opportunities'
    AND permissive='PERMISSIVE' AND cmd='SELECT'
    AND roles=ARRAY['authenticated']::name[];

  IF v_manage_qual IS NULL OR v_view_qual IS NULL OR v_manage_qual IS DISTINCT FROM v_view_qual THEN
    RAISE EXCEPTION 'work_opportunities owner policies are no longer exact SELECT duplicates';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Account owners can update their profiles'
      AND permissive='PERMISSIVE' AND cmd='UPDATE'
      AND roles=ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'canonical profile owner UPDATE policy missing or changed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Usuários atualizam seus próprios perfis'
      AND permissive='PERMISSIVE' AND cmd='UPDATE'
      AND roles=ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'legacy profile owner UPDATE policy missing or changed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.profiles'::regclass
      AND tgname='trg_guard_profile_server_owned_fields'
      AND NOT tgisinternal AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'profile server-owned field guard trigger missing or disabled';
  END IF;

  IF has_table_privilege('authenticated','public.profiles','DELETE') THEN
    RAISE EXCEPTION 'authenticated profile DELETE privilege unexpectedly exists';
  END IF;
END;
$$;

DROP POLICY "Owners view own work opportunities" ON public.work_opportunities;
DROP POLICY "Usuários atualizam seus próprios perfis" ON public.profiles;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='work_opportunities'
      AND policyname='Owners manage own work opportunities' AND cmd='ALL'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Account owners can update their profiles' AND cmd='UPDATE'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Perfis não podem ser deletados' AND cmd='DELETE'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: canonical authorization path missing';
  END IF;
END;
$$;

COMMIT;
