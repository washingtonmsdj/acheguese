-- Ephemeral PostgreSQL test only. Executed AFTER #658 and #657 SQL.
-- No production credentials, data, or mutations.
BEGIN TRANSACTION READ ONLY;
SET LOCAL ROLE anon;

DO $public_projection_assert$
DECLARE
  v_count integer;
  v_public_row record;
BEGIN
  SELECT count(*) INTO v_count FROM public.addresses;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'anon can read detailed private address rows';
  END IF;

  SELECT count(*) INTO v_count FROM public.addresses_public;
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'public verified projection cardinality drift: %',v_count;
  END IF;

  SELECT count(*) INTO v_count
    FROM public.addresses_public
   WHERE is_verified IS DISTINCT FROM TRUE
      OR verification_status IS DISTINCT FROM 'verified'::public.address_verification_status;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'ambiguous trusted state escaped to the public projection';
  END IF;

  SELECT count(*) INTO v_count
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='addresses_public';
  IF v_count <> 9 THEN
    RAISE EXCEPTION 'address projection has % columns instead of nine',v_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='addresses_public'
       AND column_name IN ('street','postal_code','number','complement','owner_user_id','metadata')
  ) THEN
    RAISE EXCEPTION 'private address field exposed in public projection';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.public_business_search b
  LEFT JOIN public.addresses address_private ON address_private.id = b.address_id
  WHERE address_private.id IS NULL;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Business FK embedding fails or leaks detailed address';
  END IF;

  SELECT latitude, longitude INTO v_public_row
  FROM public.public_professional_search
  WHERE slug='fixture-valid';
  IF v_public_row.latitude IS DISTINCT FROM -12.98::numeric
     OR v_public_row.longitude IS DISTINCT FROM -38.51::numeric
  THEN
    RAISE EXCEPTION 'verified professional no longer gets public coordinates';
  END IF;

  SELECT latitude, longitude INTO v_public_row
  FROM public.public_professional_search
  WHERE slug='fixture-ambiguous';
  IF v_public_row.latitude IS NOT NULL OR v_public_row.longitude IS NOT NULL THEN
    RAISE EXCEPTION 'ambiguous professional address leaked coordinates';
  END IF;
END
$public_projection_assert$;

ROLLBACK;

-- The versioned read-only probe is part of the same validation.
\ir ../address-private-projection-postapply-probe.sql
