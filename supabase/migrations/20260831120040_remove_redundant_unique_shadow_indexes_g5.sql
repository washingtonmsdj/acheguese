BEGIN;

DO $$
DECLARE
  r record;
  drop_oid oid;
  keep_oid oid;
  structurally_equal boolean;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('communication_channels', 'idx_communication_channels_slug', 'communication_channels_slug_key'),
      ('stripe_webhook_events', 'idx_stripe_webhook_events_stripe_id', 'stripe_webhook_events_stripe_event_id_key'),
      ('subscription_plans', 'idx_subscription_plans_code', 'subscription_plans_plan_code_key')
    ) AS v(table_name, drop_index, keep_index)
  LOOP
    SELECT c.oid
      INTO drop_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'i'
      AND c.relname = r.drop_index;

    SELECT c.oid
      INTO keep_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'i'
      AND c.relname = r.keep_index;

    IF drop_oid IS NULL OR keep_oid IS NULL THEN
      RAISE EXCEPTION 'G5 redundant-index precondition failed for %.%: drop_oid=%, keep_oid=%',
        r.table_name, r.drop_index, drop_oid, keep_oid;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class t ON t.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = r.table_name
        AND con.conindid = keep_oid
        AND con.contype = 'u'
    ) THEN
      RAISE EXCEPTION 'G5 redundant-index precondition failed: % is not owned by a UNIQUE constraint', r.keep_index;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = drop_oid) THEN
      RAISE EXCEPTION 'G5 redundant-index precondition failed: drop candidate % is constraint-owned', r.drop_index;
    END IF;

    SELECT
      d.indrelid = k.indrelid
      AND d.indisunique = false
      AND k.indisunique = true
      AND d.indisvalid AND d.indisready
      AND k.indisvalid AND k.indisready
      AND d.indnatts = k.indnatts
      AND d.indnkeyatts = k.indnkeyatts
      AND d.indkey = k.indkey
      AND d.indclass = k.indclass
      AND d.indcollation = k.indcollation
      AND d.indoption = k.indoption
      AND d.indexprs IS NOT DISTINCT FROM k.indexprs
      AND d.indpred IS NOT DISTINCT FROM k.indpred
      AND dc.relam = kc.relam
    INTO structurally_equal
    FROM pg_index d
    JOIN pg_index k ON k.indexrelid = keep_oid
    JOIN pg_class dc ON dc.oid = d.indexrelid
    JOIN pg_class kc ON kc.oid = k.indexrelid
    WHERE d.indexrelid = drop_oid;

    IF structurally_equal IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'G5 redundant-index precondition failed: % is not an exact non-unique shadow of %',
        r.drop_index, r.keep_index;
    END IF;

    EXECUTE format('DROP INDEX public.%I', r.drop_index);
  END LOOP;
END
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('idx_communication_channels_slug', 'communication_channels_slug_key'),
      ('idx_stripe_webhook_events_stripe_id', 'stripe_webhook_events_stripe_event_id_key'),
      ('idx_subscription_plans_code', 'subscription_plans_plan_code_key')
    ) AS v(drop_index, keep_index)
  LOOP
    IF to_regclass(format('public.%I', r.drop_index)) IS NOT NULL THEN
      RAISE EXCEPTION 'G5 redundant-index postcondition failed: % still exists', r.drop_index;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_index i ON i.indexrelid = c.oid
      JOIN pg_constraint con ON con.conindid = c.oid AND con.contype = 'u'
      WHERE n.nspname = 'public'
        AND c.relname = r.keep_index
        AND i.indisunique
        AND i.indisvalid
        AND i.indisready
    ) THEN
      RAISE EXCEPTION 'G5 redundant-index postcondition failed: canonical UNIQUE index % is not healthy', r.keep_index;
    END IF;
  END LOOP;
END
$$;

COMMIT;
