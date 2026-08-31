BEGIN;

DO $$
DECLARE
  r record;
  d record;
  k record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('public', 'qr_codes', 'idx_qr_codes_token', 'qr_codes_token_key'),
      ('public', 'analytics_sessions', 'idx_analytics_sessions_session_id', 'analytics_sessions_session_id_key')
    ) AS v(schema_name, table_name, drop_index, keep_index)
  LOOP
    IF to_regclass(format('%I.%I', r.schema_name, r.drop_index)) IS NULL THEN
      RAISE EXCEPTION 'Expected redundant index %.% is missing', r.schema_name, r.drop_index;
    END IF;

    IF to_regclass(format('%I.%I', r.schema_name, r.keep_index)) IS NULL THEN
      RAISE EXCEPTION 'Expected canonical UNIQUE index %.% is missing', r.schema_name, r.keep_index;
    END IF;

    SELECT ix.*, i.relam,
           EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid) AS constraint_owned,
           EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid AND c.contype = 'u') AS unique_constraint_owned,
           pg_get_expr(ix.indexprs, ix.indrelid) AS exprs,
           pg_get_expr(ix.indpred, ix.indrelid) AS pred
      INTO d
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
     WHERE ix.indexrelid = to_regclass(format('%I.%I', r.schema_name, r.drop_index));

    SELECT ix.*, i.relam,
           EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid) AS constraint_owned,
           EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid AND c.contype = 'u') AS unique_constraint_owned,
           pg_get_expr(ix.indexprs, ix.indrelid) AS exprs,
           pg_get_expr(ix.indpred, ix.indrelid) AS pred
      INTO k
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
     WHERE ix.indexrelid = to_regclass(format('%I.%I', r.schema_name, r.keep_index));

    IF d.constraint_owned THEN
      RAISE EXCEPTION 'Refusing to drop constraint-owned index %.%', r.schema_name, r.drop_index;
    END IF;

    IF NOT k.unique_constraint_owned THEN
      RAISE EXCEPTION 'Canonical index %.% is not owned by a UNIQUE constraint', r.schema_name, r.keep_index;
    END IF;

    IF d.indisunique OR NOT k.indisunique THEN
      RAISE EXCEPTION 'Unexpected uniqueness state for %.% -> %.%', r.schema_name, r.drop_index, r.schema_name, r.keep_index;
    END IF;

    IF NOT d.indisvalid OR NOT d.indisready OR NOT k.indisvalid OR NOT k.indisready THEN
      RAISE EXCEPTION 'Index pair is not fully valid/ready for %.% -> %.%', r.schema_name, r.drop_index, r.schema_name, r.keep_index;
    END IF;

    IF d.indrelid IS DISTINCT FROM k.indrelid
       OR d.indnatts IS DISTINCT FROM k.indnatts
       OR d.indnkeyatts IS DISTINCT FROM k.indnkeyatts
       OR d.indkey IS DISTINCT FROM k.indkey
       OR d.indclass IS DISTINCT FROM k.indclass
       OR d.indcollation IS DISTINCT FROM k.indcollation
       OR d.indoption IS DISTINCT FROM k.indoption
       OR d.exprs IS DISTINCT FROM k.exprs
       OR d.pred IS DISTINCT FROM k.pred
       OR d.relam IS DISTINCT FROM k.relam THEN
      RAISE EXCEPTION 'Index pair is not structurally equivalent for %.% -> %.%', r.schema_name, r.drop_index, r.schema_name, r.keep_index;
    END IF;
  END LOOP;
END
$$;

DROP INDEX public.idx_qr_codes_token;
DROP INDEX public.idx_analytics_sessions_session_id;

DO $$
DECLARE
  r record;
  k record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('public', 'idx_qr_codes_token', 'qr_codes_token_key'),
      ('public', 'idx_analytics_sessions_session_id', 'analytics_sessions_session_id_key')
    ) AS v(schema_name, drop_index, keep_index)
  LOOP
    IF to_regclass(format('%I.%I', r.schema_name, r.drop_index)) IS NOT NULL THEN
      RAISE EXCEPTION 'Redundant index %.% still exists after DROP', r.schema_name, r.drop_index;
    END IF;

    IF to_regclass(format('%I.%I', r.schema_name, r.keep_index)) IS NULL THEN
      RAISE EXCEPTION 'Canonical UNIQUE index %.% disappeared', r.schema_name, r.keep_index;
    END IF;

    SELECT ix.indisunique, ix.indisvalid, ix.indisready,
           EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid AND c.contype = 'u') AS unique_constraint_owned
      INTO k
      FROM pg_index ix
     WHERE ix.indexrelid = to_regclass(format('%I.%I', r.schema_name, r.keep_index));

    IF NOT k.indisunique OR NOT k.indisvalid OR NOT k.indisready OR NOT k.unique_constraint_owned THEN
      RAISE EXCEPTION 'Canonical UNIQUE index %.% failed postcondition', r.schema_name, r.keep_index;
    END IF;
  END LOOP;
END
$$;

COMMIT;
