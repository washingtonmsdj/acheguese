-- Remove the empty, unused Profile-to-Profile business favorites contract.

DO $$
DECLARE
  legacy_row_count BIGINT;
BEGIN
  IF to_regclass('public.business_favorites') IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*)
  INTO legacy_row_count
  FROM public.business_favorites;

  IF legacy_row_count <> 0 THEN
    RAISE EXCEPTION 'legacy_business_favorites_contains_%_rows', legacy_row_count;
  END IF;

  DROP TABLE public.business_favorites;
END;
$$;

DROP FUNCTION IF EXISTS public.get_business_favorites_count(UUID);
