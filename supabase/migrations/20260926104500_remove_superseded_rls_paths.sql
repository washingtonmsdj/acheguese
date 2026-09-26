-- Remove only RLS paths proven superseded by stricter/canonical policies.
-- Fail closed if the live catalog no longer matches the audited shape.

BEGIN;

DO $$
DECLARE
  v_policy record;
BEGIN
  SELECT * INTO v_policy
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'question_answers'
    AND policyname = 'Authors manage own answers';

  IF NOT FOUND
    OR v_policy.cmd <> 'ALL'
    OR v_policy.roles <> ARRAY['authenticated']::name[]
    OR v_policy.qual NOT LIKE '%profiles.user_id = ( SELECT auth.uid()%'
  THEN
    RAISE EXCEPTION 'question_answers legacy policy drifted; review before dropping';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_answers'
      AND policyname = 'question_answers_verified_insert'
      AND cmd = 'INSERT'
      AND with_check LIKE '%private.current_active_profile_id()%'
      AND with_check LIKE '%private.auth_has_verified_residence%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_answers'
      AND policyname = 'question_answers_owner_or_admin_update'
      AND cmd = 'UPDATE'
      AND qual LIKE '%private.auth_owns_active_profile%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_answers'
      AND policyname = 'question_answers_owner_or_admin_delete'
      AND cmd = 'DELETE'
      AND qual LIKE '%private.auth_owns_active_profile%'
  ) THEN
    RAISE EXCEPTION 'question_answers canonical write policies are missing or drifted';
  END IF;

  FOR v_policy IN
    SELECT *
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'delivery_occurrences' AND policyname = 'delivery_occurrences_participants_select')
        OR (tablename = 'order_items' AND policyname = 'order_items_participants_select')
        OR (tablename = 'order_timeline_events' AND policyname = 'order_timeline_events_participants_select')
      )
  LOOP
    IF v_policy.cmd <> 'SELECT'
      OR v_policy.roles <> ARRAY['authenticated']::name[]
      OR v_policy.qual NOT LIKE '%profiles.user_id = ( SELECT auth.uid()%'
    THEN
      RAISE EXCEPTION 'legacy participant policy % on % drifted; review before dropping',
        v_policy.policyname, v_policy.tablename;
    END IF;
  END LOOP;

  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'delivery_occurrences' AND policyname = 'delivery_occurrences_participants_select')
        OR (tablename = 'order_items' AND policyname = 'order_items_participants_select')
        OR (tablename = 'order_timeline_events' AND policyname = 'order_timeline_events_participants_select')
      )
  ) <> 3 THEN
    RAISE EXCEPTION 'expected three legacy participant policies';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'delivery_occurrences'
      AND policyname = 'delivery_occurrences_select' AND cmd = 'SELECT'
      AND qual LIKE '%private.auth_can_access_profile%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items'
      AND policyname = 'order_items_select' AND cmd = 'SELECT'
      AND qual LIKE '%private.auth_can_access_profile%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_timeline_events'
      AND policyname = 'order_timeline_events_select' AND cmd = 'SELECT'
      AND qual LIKE '%private.auth_can_access_profile%'
  ) THEN
    RAISE EXCEPTION 'canonical participant policies are missing or drifted';
  END IF;
END;
$$;

DROP POLICY "Authors manage own answers" ON public.question_answers;
DROP POLICY delivery_occurrences_participants_select ON public.delivery_occurrences;
DROP POLICY order_items_participants_select ON public.order_items;
DROP POLICY order_timeline_events_participants_select ON public.order_timeline_events;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'question_answers' AND policyname = 'Authors manage own answers')
        OR (tablename = 'delivery_occurrences' AND policyname = 'delivery_occurrences_participants_select')
        OR (tablename = 'order_items' AND policyname = 'order_items_participants_select')
        OR (tablename = 'order_timeline_events' AND policyname = 'order_timeline_events_participants_select')
      )
  ) THEN
    RAISE EXCEPTION 'postcondition failed: superseded RLS path remains';
  END IF;
END;
$$;

COMMIT;
