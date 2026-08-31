BEGIN;

DO $$
DECLARE
  r record;
  v_table_oid oid;
  v_drop_oid oid;
  v_keep_oid oid;
  v_equivalent boolean;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('categories'::text, 'idx_categories_slug'::text, 'categories_slug_key'::text),
      ('business_operation_config'::text, 'idx_business_operation_config_business'::text, 'business_operation_config_business_id_key'::text)
    ) AS candidates(table_name, drop_index, keep_constraint)
  LOOP
    SELECT c.oid
      INTO v_table_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = r.table_name
      AND c.relkind IN ('r', 'p');

    IF v_table_oid IS NULL THEN
      RAISE EXCEPTION 'G5 precondition failed: table public.% is missing', r.table_name;
    END IF;

    SELECT c.oid
      INTO v_drop_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname = r.drop_index
      AND i.indrelid = v_table_oid;

    IF v_drop_oid IS NULL THEN
      RAISE EXCEPTION 'G5 precondition failed: candidate index public.% is missing', r.drop_index;
    END IF;

    SELECT con.conindid
      INTO v_keep_oid
    FROM pg_constraint con
    WHERE con.conrelid = v_table_oid
      AND con.conname = r.keep_constraint
      AND con.contype = 'u';

    IF v_keep_oid IS NULL THEN
      RAISE EXCEPTION 'G5 precondition failed: UNIQUE constraint % on public.% is missing', r.keep_constraint, r.table_name;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = v_drop_oid) THEN
      RAISE EXCEPTION 'G5 precondition failed: candidate index public.% is constraint-owned', r.drop_index;
    END IF;

    SELECT
      (NOT d.indisunique)
      AND k.indisunique
      AND d.indisvalid
      AND k.indisvalid
      AND d.indisready
      AND k.indisready
      AND d.indrelid = k.indrelid
      AND d.indnatts = k.indnatts
      AND d.indnkeyatts = k.indnkeyatts
      AND d.indkey = k.indkey
      AND d.indclass = k.indclass
      AND d.indcollation = k.indcollation
      AND d.indoption = k.indoption
      AND d.indexprs IS NOT DISTINCT FROM k.indexprs
      AND d.indpred IS NOT DISTINCT FROM k.indpred
      AND am_d.amname = am_k.amname
      INTO v_equivalent
    FROM pg_index d
    JOIN pg_class dc ON dc.oid = d.indexrelid
    JOIN pg_am am_d ON am_d.oid = dc.relam
    JOIN pg_index k ON k.indexrelid = v_keep_oid
    JOIN pg_class kc ON kc.oid = k.indexrelid
    JOIN pg_am am_k ON am_k.oid = kc.relam
    WHERE d.indexrelid = v_drop_oid;

    IF v_equivalent IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'G5 precondition failed: public.% is not a healthy structural shadow of UNIQUE constraint %', r.drop_index, r.keep_constraint;
    END IF;

    EXECUTE format('DROP INDEX %I.%I', 'public', r.drop_index);

    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = r.drop_index
    ) THEN
      RAISE EXCEPTION 'G5 postcondition failed: public.% still exists', r.drop_index;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_index i ON i.indexrelid = con.conindid
      WHERE con.conrelid = v_table_oid
        AND con.conname = r.keep_constraint
        AND con.contype = 'u'
        AND i.indisunique
        AND i.indisvalid
        AND i.indisready
    ) THEN
      RAISE EXCEPTION 'G5 postcondition failed: retained UNIQUE constraint % is not healthy', r.keep_constraint;
    END IF;
  END LOOP;
END
$$;

COMMIT;
