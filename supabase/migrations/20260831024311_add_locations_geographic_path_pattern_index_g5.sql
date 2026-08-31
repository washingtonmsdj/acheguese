BEGIN;

DO $$
BEGIN
  IF to_regclass('public.idx_locations_geographic_path_pattern') IS NOT NULL THEN
    RAISE EXCEPTION 'idx_locations_geographic_path_pattern already exists';
  END IF;
END
$$;

CREATE INDEX idx_locations_geographic_path_pattern
  ON public.locations (geographic_path text_pattern_ops);

DO $$
DECLARE
  v_valid boolean;
  v_definition text;
BEGIN
  SELECT i.indisvalid AND i.indisready,
         pg_get_indexdef(i.indexrelid)
    INTO v_valid, v_definition
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relname = 'idx_locations_geographic_path_pattern';

  IF COALESCE(v_valid, false) IS NOT TRUE
     OR v_definition IS NULL
     OR position('text_pattern_ops' in v_definition) = 0 THEN
    RAISE EXCEPTION 'idx_locations_geographic_path_pattern failed postcondition: valid=%, definition=%',
      v_valid, v_definition;
  END IF;
END
$$;

COMMIT;
