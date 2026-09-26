-- Remove live-only duplicate triggers that execute the same trigger function for
-- the same event as the versioned canonical trigger.
--
-- This migration changes no trigger function body and no authorization. It is
-- fail-closed: each legacy/canonical pair must still be equivalent before the
-- legacy trigger is removed.

BEGIN;

DO $$
DECLARE
  v_pair RECORD;
  v_canonical RECORD;
  v_legacy RECORD;
BEGIN
  FOR v_pair IN
    SELECT * FROM (VALUES
      ('public.driver_data'::regclass, 'update_driver_data_updated_at', 'set_driver_data_updated_at'),
      ('public.question_answer_likes'::regclass, 'trg_sync_question_answer_likes_count', 'trigger_sync_question_answer_likes_count'),
      ('public.question_answers'::regclass, 'trg_sync_question_answers_count', 'trigger_sync_question_answers_count')
    ) AS pairs(table_oid, canonical_name, legacy_name)
  LOOP
    SELECT t.tgfoid, t.tgtype, t.tgenabled, t.tgargs
    INTO v_canonical
    FROM pg_trigger t
    WHERE t.tgrelid = v_pair.table_oid
      AND t.tgname = v_pair.canonical_name
      AND NOT t.tgisinternal;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'canonical trigger % is missing on %; review drift before applying',
        v_pair.canonical_name, v_pair.table_oid::regclass;
    END IF;

    SELECT t.tgfoid, t.tgtype, t.tgenabled, t.tgargs
    INTO v_legacy
    FROM pg_trigger t
    WHERE t.tgrelid = v_pair.table_oid
      AND t.tgname = v_pair.legacy_name
      AND NOT t.tgisinternal;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'legacy trigger % is missing on %; review drift before applying',
        v_pair.legacy_name, v_pair.table_oid::regclass;
    END IF;

    IF v_canonical.tgenabled = 'D' OR v_legacy.tgenabled = 'D' THEN
      RAISE EXCEPTION 'trigger pair %, % is not fully enabled on %; review before applying',
        v_pair.canonical_name, v_pair.legacy_name, v_pair.table_oid::regclass;
    END IF;

    IF v_canonical.tgfoid IS DISTINCT FROM v_legacy.tgfoid
       OR v_canonical.tgtype IS DISTINCT FROM v_legacy.tgtype
       OR v_canonical.tgargs IS DISTINCT FROM v_legacy.tgargs THEN
      RAISE EXCEPTION 'trigger pair %, % is no longer equivalent on %; review before applying',
        v_pair.canonical_name, v_pair.legacy_name, v_pair.table_oid::regclass;
    END IF;
  END LOOP;
END;
$$;

DROP TRIGGER set_driver_data_updated_at ON public.driver_data;
DROP TRIGGER trigger_sync_question_answer_likes_count ON public.question_answer_likes;
DROP TRIGGER trigger_sync_question_answers_count ON public.question_answers;

DO $$
DECLARE
  v_expected RECORD;
BEGIN
  FOR v_expected IN
    SELECT * FROM (VALUES
      ('public.driver_data'::regclass, 'update_driver_data_updated_at', 'set_driver_data_updated_at'),
      ('public.question_answer_likes'::regclass, 'trg_sync_question_answer_likes_count', 'trigger_sync_question_answer_likes_count'),
      ('public.question_answers'::regclass, 'trg_sync_question_answers_count', 'trigger_sync_question_answers_count')
    ) AS expected(table_oid, canonical_name, removed_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      WHERE t.tgrelid = v_expected.table_oid
        AND t.tgname = v_expected.canonical_name
        AND NOT t.tgisinternal
        AND t.tgenabled <> 'D'
    ) THEN
      RAISE EXCEPTION 'postcondition failed: canonical trigger % missing/disabled on %',
        v_expected.canonical_name, v_expected.table_oid::regclass;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_trigger t
      WHERE t.tgrelid = v_expected.table_oid
        AND t.tgname = v_expected.removed_name
        AND NOT t.tgisinternal
    ) THEN
      RAISE EXCEPTION 'postcondition failed: duplicate trigger % still exists on %',
        v_expected.removed_name, v_expected.table_oid::regclass;
    END IF;
  END LOOP;
END;
$$;

COMMIT;
