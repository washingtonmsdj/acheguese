-- Fix vagas location to Salvador.
-- Updates legacy job rows so territorial filters resolve against Salvador.

DO $$
DECLARE
  salvador_id UUID;
  vagas_count INTEGER;
BEGIN
  SELECT id INTO salvador_id
  FROM locations
  WHERE name ILIKE '%salvador%'
  LIMIT 1;

  IF salvador_id IS NULL THEN
    RAISE NOTICE 'Salvador not found in locations';
    RETURN;
  END IF;

  RAISE NOTICE 'Salvador found: %', salvador_id;

  UPDATE vagas
  SET location_id = salvador_id
  WHERE location_id != salvador_id;

  GET DIAGNOSTICS vagas_count = ROW_COUNT;

  RAISE NOTICE '% vagas updated to Salvador', vagas_count;
END $$;
