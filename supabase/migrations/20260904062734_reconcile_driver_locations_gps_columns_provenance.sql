-- G6_DRIVER_LOCATIONS_GPS_PROVENANCE
-- Formaliza no historico de migrations as colunas GPS que ja existem no remoto.
-- Nao altera grants, policies ou RLS.

ALTER TABLE public.driver_locations
  ADD COLUMN IF NOT EXISTS accuracy NUMERIC,
  ADD COLUMN IF NOT EXISTS heading NUMERIC,
  ADD COLUMN IF NOT EXISTS speed NUMERIC,
  ADD COLUMN IF NOT EXISTS altitude NUMERIC;

DO $verify$
DECLARE
  v_missing TEXT[];
BEGIN
  SELECT array_agg(required.column_name ORDER BY required.column_name)
  INTO v_missing
  FROM (
    VALUES
      ('accuracy'),
      ('altitude'),
      ('heading'),
      ('speed')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'driver_locations'
      AND c.column_name = required.column_name
      AND c.data_type = 'numeric'
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION
      'driver_locations GPS provenance reconciliation incomplete: %',
      array_to_string(v_missing, ', ');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'driver_locations'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'driver_locations RLS must remain enabled';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
