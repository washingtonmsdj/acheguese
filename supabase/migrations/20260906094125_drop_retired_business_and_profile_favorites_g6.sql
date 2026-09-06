-- G6 retired Business/Profile favorite aggregates.
-- Guards ensure only known technical fixtures/empty legacy tables can disappear.

DO $$
DECLARE
  v_businesses integer;
  v_non_fixture_businesses integer;
  v_profile_favorites integer;
  v_profile_favorites_new integer;
BEGIN
  SELECT count(*)::integer INTO v_businesses
  FROM public.businesses;

  SELECT count(*)::integer INTO v_non_fixture_businesses
  FROM public.businesses
  WHERE slug IS NULL OR slug NOT LIKE '%-test';

  SELECT count(*)::integer INTO v_profile_favorites
  FROM public.profile_favorites;

  SELECT count(*)::integer INTO v_profile_favorites_new
  FROM public.profile_favorites_new;

  IF v_businesses <> 3 OR v_non_fixture_businesses <> 0 THEN
    RAISE EXCEPTION
      'legacy businesses guard failed: rows=%, non_fixture=%',
      v_businesses, v_non_fixture_businesses;
  END IF;

  IF v_profile_favorites <> 0 OR v_profile_favorites_new <> 0 THEN
    RAISE EXCEPTION
      'profile favorites guard failed: old=%, new=%',
      v_profile_favorites, v_profile_favorites_new;
  END IF;
END;
$$;

DROP TABLE public.businesses RESTRICT;
DROP TABLE public.profile_favorites RESTRICT;
DROP TABLE public.profile_favorites_new RESTRICT;

DROP FUNCTION IF EXISTS public.sync_business_verified() RESTRICT;

COMMENT ON TABLE public.business_data IS
  'Canonical Business extension of Profile. One row per profile_id; legacy public.businesses is retired.';
