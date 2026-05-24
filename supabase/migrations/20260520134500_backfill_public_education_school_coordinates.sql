-- Backfill canonical addresses and map coordinates for seeded public schools.
-- Goal:
-- 1) ensure every seeded school has address_id
-- 2) ensure business_data.latitude/longitude is populated for map markers
-- 3) keep coordinate provenance in metadata (exact geocoded vs territorial fallback)

DO $$
DECLARE
  school record;
  v_address_id uuid;
  v_street text;
  v_number text;
  v_lat numeric;
  v_lng numeric;
  v_source text;
  v_confidence numeric;
  v_kind text;
  v_hash bytea;
  v_offset_lat numeric;
  v_offset_lng numeric;
BEGIN
  FOR school IN
    WITH school_seed AS (
      SELECT *
      FROM (VALUES
        ('cmei-dalia-de-menezes', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('colegio-estadual-professor-carlos-sant-anna-tempo-integral', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-maria-amalia-paiva', -13.0121129::numeric, -38.4742171::numeric, 'nominatim_osm'::text, 0.78::numeric),
        ('escola-municipal-professora-anita-barbuda', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('cmei-vale-das-pedrinhas', -13.0074353::numeric, -38.4771239::numeric, 'nominatim_osm'::text, 0.76::numeric),
        ('colegio-estadual-general-dionisio-cerqueira-tempo-integral', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-artur-de-sales', -13.0042637::numeric, -38.4779116::numeric, 'nominatim_osm'::text, 0.74::numeric),
        ('escola-municipal-centro-social-neusa-nery', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-comunitaria-cristo-redentor', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-cristo-e-vida', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-jose-calazans-brandao-da-silva', -13.0002823::numeric, -38.4766071::numeric, 'nominatim_osm'::text, 0.73::numeric),
        ('escola-municipal-santo-andre', -13.0073864::numeric, -38.4738626::numeric, 'nominatim_osm'::text, 0.72::numeric),
        ('escola-municipal-sao-pedro-nolasco', -13.0046577::numeric, -38.4733073::numeric, 'nominatim_osm'::text, 0.72::numeric),
        ('escola-municipal-teodoro-sampaio', NULL::numeric, NULL::numeric, NULL::text, NULL::numeric),
        ('escola-municipal-vale-das-pedrinhas', -13.0055480::numeric, -38.4826497::numeric, 'nominatim_osm'::text, 0.66::numeric)
      ) AS s(slug, curated_lat, curated_lng, curated_source, curated_confidence)
    )
    SELECT
      bd.id AS business_id,
      bd.slug,
      bd.location_id,
      bd.address_id,
      bd.business_address,
      (l.metadata->>'center_latitude')::numeric AS center_lat,
      (l.metadata->>'center_longitude')::numeric AS center_lng,
      ss.curated_lat,
      ss.curated_lng,
      ss.curated_source,
      ss.curated_confidence
    FROM public.business_data bd
    JOIN public.locations l ON l.id = bd.location_id
    LEFT JOIN school_seed ss ON ss.slug = bd.slug
    WHERE bd.category = 'educacao'
      AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
  LOOP
    IF school.center_lat IS NULL OR school.center_lng IS NULL THEN
      RAISE NOTICE 'Skipping school % (no center coordinates on location)', school.slug;
      CONTINUE;
    END IF;

    v_hash := decode(md5(school.slug), 'hex');
    v_offset_lat := ((get_byte(v_hash, 0)::numeric / 255.0) - 0.5) * 0.003;
    v_offset_lng := ((get_byte(v_hash, 1)::numeric / 255.0) - 0.5) * 0.003;

    IF school.curated_lat IS NOT NULL AND school.curated_lng IS NOT NULL THEN
      v_lat := school.curated_lat;
      v_lng := school.curated_lng;
      v_source := COALESCE(school.curated_source, 'nominatim_osm');
      v_confidence := COALESCE(school.curated_confidence, 0.70);
      v_kind := 'geocoded';
    ELSE
      v_lat := school.center_lat + v_offset_lat;
      v_lng := school.center_lng + v_offset_lng;
      v_source := 'location_center_fallback';
      v_confidence := 0.45;
      v_kind := 'approximate';
    END IF;

    v_street := NULLIF(btrim(split_part(COALESCE(school.business_address, ''), ',', 1)), '');
    v_number := NULLIF(btrim(split_part(COALESCE(school.business_address, ''), ',', 2)), '');

    v_address_id := COALESCE(school.address_id, gen_random_uuid());

    INSERT INTO public.addresses (
      id,
      location_id,
      street,
      number,
      address_type,
      latitude,
      longitude,
      geocoded_at,
      geocoding_source,
      geocoding_confidence,
      is_verified,
      created_at,
      updated_at
    )
    VALUES (
      v_address_id,
      school.location_id,
      v_street,
      v_number,
      CASE WHEN v_kind = 'geocoded' THEN 'exact' ELSE 'approximate' END,
      v_lat,
      v_lng,
      now(),
      v_source,
      v_confidence,
      false,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      location_id = EXCLUDED.location_id,
      street = EXCLUDED.street,
      number = EXCLUDED.number,
      address_type = EXCLUDED.address_type,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      geocoded_at = EXCLUDED.geocoded_at,
      geocoding_source = EXCLUDED.geocoding_source,
      geocoding_confidence = EXCLUDED.geocoding_confidence,
      updated_at = now();

    UPDATE public.business_data
    SET
      address_id = v_address_id,
      latitude = v_lat,
      longitude = v_lng,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'coordinate_source', v_kind,
        'coordinate_geocoding_source', v_source,
        'coordinate_confidence', v_confidence,
        'coordinate_backfilled_at', now()::text
      ),
      updated_at = now()
    WHERE id = school.business_id;
  END LOOP;
END $$;
