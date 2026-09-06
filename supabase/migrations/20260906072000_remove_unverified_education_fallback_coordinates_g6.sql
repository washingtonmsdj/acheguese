-- G6 Education truthfulness: remove fabricated school map coordinates.
-- The 20260520134500 backfill intentionally used deterministic offsets from the
-- territory center when an exact/geocoded point was unavailable. Those points
-- are not precise enough to be presented as school locations in the public MVP.
--
-- Preserve:
-- - the school entity;
-- - its textual address;
-- - truly geocoded coordinates.
--
-- Remove only rows whose provenance explicitly says location_center_fallback.

DO $$
DECLARE
  v_business_count integer;
  v_address_count integer;
BEGIN
  SELECT count(*)
  INTO v_business_count
  FROM public.business_data bd
  WHERE bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
    AND bd.metadata->>'coordinate_source' = 'approximate'
    AND bd.metadata->>'coordinate_geocoding_source' = 'location_center_fallback'
    AND bd.latitude IS NOT NULL
    AND bd.longitude IS NOT NULL;

  SELECT count(*)
  INTO v_address_count
  FROM public.business_data bd
  JOIN public.addresses a ON a.id = bd.address_id
  WHERE bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
    AND bd.metadata->>'coordinate_source' = 'approximate'
    AND bd.metadata->>'coordinate_geocoding_source' = 'location_center_fallback'
    AND a.latitude IS NOT NULL
    AND a.longitude IS NOT NULL;

  IF v_business_count <> 8 OR v_address_count <> 8 THEN
    RAISE EXCEPTION
      'education_fallback_coordinate_guard_failed business=% address=% expected=8/8',
      v_business_count,
      v_address_count;
  END IF;

  UPDATE public.addresses a
  SET
    latitude = NULL,
    longitude = NULL,
    geocoded_at = NULL,
    geocoding_source = NULL,
    geocoding_confidence = NULL,
    is_verified = false,
    updated_at = now()
  FROM public.business_data bd
  WHERE bd.address_id = a.id
    AND bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
    AND bd.metadata->>'coordinate_source' = 'approximate'
    AND bd.metadata->>'coordinate_geocoding_source' = 'location_center_fallback';

  UPDATE public.business_data bd
  SET
    latitude = NULL,
    longitude = NULL,
    metadata = COALESCE(bd.metadata, '{}'::jsonb) || jsonb_build_object(
      'coordinate_source', 'unverified',
      'coordinate_geocoding_source', 'removed_location_center_fallback',
      'coordinate_confidence', 0,
      'coordinate_removed_reason', 'no_verified_school_point',
      'coordinate_removed_at', now()::text
    ),
    updated_at = now()
  WHERE bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
    AND bd.metadata->>'coordinate_source' = 'approximate'
    AND bd.metadata->>'coordinate_geocoding_source' = 'location_center_fallback';
END $$;
