BEGIN;

DO $$
DECLARE
  v_business record;
  v_snapshot jsonb;
  v_segments text[];
  v_expected_canonical text;
BEGIN
  SELECT
    b.id,
    b.profile_id,
    b.business_name,
    b.slug,
    b.category,
    l.geographic_path
  INTO v_business
  FROM public.public_business_search AS b
  JOIN public.locations AS l
    ON l.id = b.location_id
  JOIN public.territorial_group_members AS gm
    ON gm.location_id = b.location_id
  JOIN public.territorial_groups AS g
    ON g.id = gm.group_id
  WHERE g.slug = 'complexo-do-nordeste-de-amaralina'
    AND b.status = 'active'
    AND b.business_role IN ('standalone', 'branch')
    AND NULLIF(btrim(b.slug), '') IS NOT NULL
    AND NULLIF(btrim(l.geographic_path), '') IS NOT NULL
  ORDER BY b.business_name, b.id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mvp_business_probe_no_launch_visible_business';
  END IF;

  v_segments := regexp_split_to_array(trim(both '/' from v_business.geographic_path), '/');
  IF array_length(v_segments, 1) < 4 THEN
    RAISE EXCEPTION
      'mvp_business_probe_invalid_geographic_path:%',
      v_business.geographic_path;
  END IF;

  SELECT public.get_public_business_snapshot_by_slug(
    p_state => v_segments[2],
    p_city => v_segments[3],
    p_district => v_segments[4],
    p_slug => v_business.slug
  )
  INTO v_snapshot;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION
      'mvp_business_probe_snapshot_missing:%',
      v_business.slug;
  END IF;

  IF v_snapshot #>> '{identity,businessId}' IS DISTINCT FROM v_business.id::text THEN
    RAISE EXCEPTION
      'mvp_business_probe_identity_mismatch:%',
      v_business.slug;
  END IF;

  v_expected_canonical := format(
    '/empresas/%s/%s/%s/%s',
    v_segments[2],
    v_segments[3],
    v_segments[4],
    v_business.slug
  );

  IF v_snapshot #>> '{seo,canonical}' IS DISTINCT FROM v_expected_canonical THEN
    RAISE EXCEPTION
      'mvp_business_probe_canonical_mismatch:%:%',
      v_business.slug,
      v_snapshot #>> '{seo,canonical}';
  END IF;

  RAISE NOTICE
    'MVP_BUSINESS_PUBLIC_FLOW_OK business=% category=% canonical=%',
    v_business.business_name,
    v_business.category,
    v_expected_canonical;
END
$$;

ROLLBACK;
