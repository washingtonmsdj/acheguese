DROP FUNCTION IF EXISTS public.list_public_education_profiles(
  text, text, text, text, text[], text[], text[], text[], boolean, text, integer, integer
);
DROP FUNCTION IF EXISTS public.list_public_education_districts(text, text);

CREATE OR REPLACE FUNCTION public.list_public_education_profiles(
  p_state text,
  p_city text,
  p_district text DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_niches text[] DEFAULT '{}'::text[],
  p_school_networks text[] DEFAULT '{}'::text[],
  p_institution_types text[] DEFAULT '{}'::text[],
  p_infrastructure text[] DEFAULT '{}'::text[],
  p_only_available boolean DEFAULT false,
  p_sort text DEFAULT 'relevance',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_location_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  business_data_id uuid,
  business_name text,
  slug text,
  is_claimable boolean,
  geographic_path text,
  institution_type text,
  niche_key text,
  support_level text,
  summary text,
  whatsapp_number text,
  status text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  school_type text,
  school_network text,
  school_inep_code text,
  school_source_url text,
  school_source_updated_at timestamptz,
  education_levels text[],
  shifts text[],
  age_range_min integer,
  age_range_max integer,
  enrollment_open boolean,
  school_basic_resources jsonb,
  school_accessibility_features jsonb,
  school_equipment_features jsonb,
  school_facility_features jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_state text := lower(trim(coalesce(p_state, '')));
  v_city text := lower(trim(coalesce(p_city, '')));
  v_district text := nullif(lower(trim(coalesce(p_district, ''))), '');
  v_query text := lower(trim(coalesce(p_query, '')));
  v_city_path text;
  v_district_path text;
  v_niches text[] := coalesce(p_niches, '{}'::text[]);
  v_school_networks text[] := coalesce(p_school_networks, '{}'::text[]);
  v_institution_types text[] := coalesce(p_institution_types, '{}'::text[]);
  v_infrastructure text[] := coalesce(p_infrastructure, '{}'::text[]);
  v_sort text := lower(trim(coalesce(p_sort, 'relevance')));
  v_page integer := coalesce(p_page, 1);
  v_page_size integer := coalesce(p_page_size, 20);
  v_location_ids uuid[] := coalesce(p_location_ids, '{}'::uuid[]);
BEGIN
  IF v_state !~ '^[a-z0-9-]{2,40}$'
     OR v_city !~ '^[a-z0-9-]{2,80}$'
     OR (v_district IS NOT NULL AND v_district !~ '^[a-z0-9-]{1,100}$') THEN
    RAISE EXCEPTION 'invalid_public_education_territory'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_query) > 120 THEN
    RAISE EXCEPTION 'public_education_query_too_long'
      USING ERRCODE = '22023';
  END IF;

  IF v_page NOT BETWEEN 1 AND 10000
     OR v_page_size NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'invalid_public_education_pagination'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_location_ids) > 250
     OR array_position(v_location_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_public_education_location_scope'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_niches) > 20
     OR EXISTS (
       SELECT 1
       FROM unnest(v_niches) AS niche(value)
       WHERE niche.value !~ '^[a-z0-9_]{1,80}$'
     ) THEN
    RAISE EXCEPTION 'invalid_public_education_niches'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_school_networks) > 4
     OR NOT (
       v_school_networks <@ ARRAY['municipal','state','federal','private']::text[]
     ) THEN
    RAISE EXCEPTION 'invalid_public_education_school_networks'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_institution_types) > 5
     OR NOT (
       v_institution_types <@ ARRAY['cmei','creche','escola','colegio','curso']::text[]
     ) THEN
    RAISE EXCEPTION 'invalid_public_education_institution_types'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_infrastructure) > 7
     OR NOT (
       v_infrastructure <@ ARRAY[
         'library',
         'laboratory',
         'sports_court',
         'pool',
         'parking',
         'accessibility',
         'internet'
       ]::text[]
     ) THEN
    RAISE EXCEPTION 'invalid_public_education_infrastructure'
      USING ERRCODE = '22023';
  END IF;

  IF v_sort NOT IN ('relevance', 'name_asc', 'newest') THEN
    RAISE EXCEPTION 'invalid_public_education_sort'
      USING ERRCODE = '22023';
  END IF;

  v_city_path := '/br/' || v_state || '/' || v_city;
  v_district_path := CASE
    WHEN v_district IS NULL THEN NULL
    ELSE v_city_path || '/' || v_district
  END;

  RETURN QUERY
  WITH base AS (
    SELECT
      ep.id,
      ep.business_id,
      pbs.id AS business_data_id,
      pbs.business_name,
      pbs.slug,
      pbs.is_claimable,
      location.geographic_path,
      ep.institution_type::text AS institution_type,
      ep.niche_key::text AS niche_key,
      ep.support_level::text AS support_level,
      ep.summary,
      ep.whatsapp_number::text AS whatsapp_number,
      ep.status::text AS status,
      ep.published_at,
      ep.created_at,
      ep.updated_at,
      ep.school_type::text AS school_type,
      ep.school_network::text AS school_network,
      ep.school_inep_code::text AS school_inep_code,
      ep.school_source_url,
      ep.school_source_updated_at,
      ep.education_levels,
      ep.shifts,
      ep.age_range_min,
      ep.age_range_max,
      ep.enrollment_open,
      ep.school_basic_resources,
      ep.school_accessibility_features,
      ep.school_equipment_features,
      ep.school_facility_features,
      CASE
        WHEN lower(ep.institution_type::text) LIKE '%centro municipal de educacao infantil%'
          OR lower(ep.institution_type::text) LIKE '%cmei%'
          THEN 'cmei'
        WHEN ep.niche_key = 'daycare'
          OR lower(ep.institution_type::text) LIKE '%creche%'
          THEN 'creche'
        WHEN lower(ep.institution_type::text) LIKE '%colegio%'
          OR lower(ep.institution_type::text) LIKE '%colégio%'
          THEN 'colegio'
        WHEN lower(ep.institution_type::text) LIKE '%curso%'
          OR ep.niche_key IN ('prep_course', 'language_school')
          THEN 'curso'
        ELSE 'escola'
      END AS institution_type_key
    FROM public.public_business_search pbs
    JOIN public.education_profiles ep
      ON ep.business_id = pbs.profile_id
    JOIN public.locations location
      ON location.id = pbs.location_id
    WHERE pbs.status = 'active'
      AND pbs.category = 'educacao'
      AND pbs.business_role IN ('standalone', 'branch')
      AND ep.status = 'published'
      AND location.status = 'active'
      AND (
        location.geographic_path = v_city_path
        OR location.geographic_path LIKE v_city_path || '/%'
      )
      AND (
        cardinality(v_location_ids) = 0
        OR pbs.location_id = ANY(v_location_ids)
      )
      AND (
        v_district_path IS NULL
        OR location.geographic_path = v_district_path
        OR location.geographic_path LIKE v_district_path || '/%'
      )
      AND (
        v_query = ''
        OR strpos(lower(coalesce(pbs.business_name, '')), v_query) > 0
        OR strpos(lower(ep.institution_type::text), v_query) > 0
        OR strpos(lower(coalesce(ep.summary, '')), v_query) > 0
      )
      AND (
        cardinality(v_niches) = 0
        OR ep.niche_key = ANY(v_niches)
      )
      AND (
        cardinality(v_school_networks) = 0
        OR ep.school_network = ANY(v_school_networks)
      )
      AND (
        NOT coalesce(p_only_available, false)
        OR ep.enrollment_open IS TRUE
      )
      AND (
        cardinality(v_infrastructure) = 0
        OR NOT EXISTS (
          SELECT 1
          FROM unnest(v_infrastructure) AS infra(value)
          WHERE NOT (
            CASE infra.value
              WHEN 'library' THEN
                coalesce(ep.school_facility_features, '[]'::jsonb)
                  ?| ARRAY['library', 'reading_room']
              WHEN 'laboratory' THEN
                coalesce(ep.school_facility_features, '[]'::jsonb)
                  ?| ARRAY['science_lab', 'computer_lab']
              WHEN 'sports_court' THEN
                coalesce(ep.school_facility_features, '[]'::jsonb)
                  ?| ARRAY[
                    'sports_court',
                    'covered_sports_court',
                    'open_sports_court'
                  ]
              WHEN 'pool' THEN
                coalesce(ep.school_facility_features, '[]'::jsonb) ? 'pool'
              WHEN 'parking' THEN
                coalesce(ep.school_facility_features, '[]'::jsonb)
                  ?| ARRAY['parking', 'accessible_parking']
              WHEN 'accessibility' THEN
                CASE
                  WHEN jsonb_typeof(
                    coalesce(ep.school_accessibility_features, '[]'::jsonb)
                  ) = 'array'
                  THEN jsonb_array_length(
                    coalesce(ep.school_accessibility_features, '[]'::jsonb)
                  ) > 0
                  ELSE false
                END
              WHEN 'internet' THEN
                coalesce(ep.school_equipment_features, '[]'::jsonb) ? 'internet'
              ELSE false
            END
          )
        )
      )
  ),
  filtered AS (
    SELECT *
    FROM base
    WHERE
      cardinality(v_institution_types) = 0
      OR institution_type_key = ANY(v_institution_types)
  )
  SELECT
    filtered.id,
    filtered.business_id,
    filtered.business_data_id,
    filtered.business_name,
    filtered.slug,
    filtered.is_claimable,
    filtered.geographic_path,
    filtered.institution_type,
    filtered.niche_key,
    filtered.support_level,
    filtered.summary,
    filtered.whatsapp_number,
    filtered.status,
    filtered.published_at,
    filtered.created_at,
    filtered.updated_at,
    filtered.school_type,
    filtered.school_network,
    filtered.school_inep_code,
    filtered.school_source_url,
    filtered.school_source_updated_at,
    filtered.education_levels,
    filtered.shifts,
    filtered.age_range_min,
    filtered.age_range_max,
    filtered.enrollment_open,
    filtered.school_basic_resources,
    filtered.school_accessibility_features,
    filtered.school_equipment_features,
    filtered.school_facility_features,
    count(*) OVER () AS total_count
  FROM filtered
  ORDER BY
    CASE
      WHEN v_sort = 'name_asc'
      THEN lower(coalesce(filtered.business_name, filtered.institution_type))
    END ASC NULLS LAST,
    CASE
      WHEN v_sort = 'newest'
      THEN filtered.created_at
    END DESC NULLS LAST,
    CASE
      WHEN v_sort = 'relevance' AND v_query <> ''
      THEN CASE
        WHEN lower(coalesce(filtered.business_name, '')) = v_query THEN 0
        WHEN strpos(lower(coalesce(filtered.business_name, '')), v_query) = 1 THEN 1
        ELSE 2
      END
    END ASC NULLS LAST,
    CASE
      WHEN v_sort = 'relevance'
      THEN filtered.published_at
    END DESC NULLS LAST,
    filtered.id ASC
  LIMIT v_page_size
  OFFSET (v_page - 1) * v_page_size;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_public_education_profiles(
  text, text, text, text, text[], text[], text[], text[], boolean, text, integer, integer, uuid[]
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_education_profiles(
  text, text, text, text, text[], text[], text[], text[], boolean, text, integer, integer, uuid[]
) TO anon, authenticated;

COMMENT ON FUNCTION public.list_public_education_profiles(
  text, text, text, text, text[], text[], text[], text[], boolean, text, integer, integer, uuid[]
) IS
  'Public bounded Education listing over already-public RLS projections. Applies territory/search/filter/sort before pagination and returns an exact filtered total_count.';

CREATE OR REPLACE FUNCTION public.list_public_education_districts(
  p_state text,
  p_city text,
  p_location_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE (
  district_slug text,
  geographic_path text,
  profile_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_state text := lower(trim(coalesce(p_state, '')));
  v_city text := lower(trim(coalesce(p_city, '')));
  v_city_path text;
  v_location_ids uuid[] := coalesce(p_location_ids, '{}'::uuid[]);
BEGIN
  IF v_state !~ '^[a-z0-9-]{2,40}$'
     OR v_city !~ '^[a-z0-9-]{2,80}$' THEN
    RAISE EXCEPTION 'invalid_public_education_territory'
      USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_location_ids) > 250
     OR array_position(v_location_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_public_education_location_scope'
      USING ERRCODE = '22023';
  END IF;

  v_city_path := '/br/' || v_state || '/' || v_city;

  RETURN QUERY
  WITH matches AS (
    SELECT
      split_part(
        substring(
          location.geographic_path
          FROM char_length(v_city_path) + 2
        ),
        '/',
        1
      ) AS district_slug,
      v_city_path || '/' || split_part(
        substring(
          location.geographic_path
          FROM char_length(v_city_path) + 2
        ),
        '/',
        1
      ) AS geographic_path,
      ep.id
    FROM public.public_business_search pbs
    JOIN public.education_profiles ep
      ON ep.business_id = pbs.profile_id
    JOIN public.locations location
      ON location.id = pbs.location_id
    WHERE pbs.status = 'active'
      AND pbs.category = 'educacao'
      AND pbs.business_role IN ('standalone', 'branch')
      AND ep.status = 'published'
      AND location.status = 'active'
      AND location.geographic_path LIKE v_city_path || '/%'
      AND (
        cardinality(v_location_ids) = 0
        OR pbs.location_id = ANY(v_location_ids)
      )
  )
  SELECT
    matches.district_slug,
    matches.geographic_path,
    count(DISTINCT matches.id)::bigint AS profile_count
  FROM matches
  WHERE matches.district_slug <> ''
  GROUP BY matches.district_slug, matches.geographic_path
  ORDER BY matches.district_slug ASC
  LIMIT 500;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_public_education_districts(text, text, uuid[])
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_education_districts(text, text, uuid[])
TO anon, authenticated;

COMMENT ON FUNCTION public.list_public_education_districts(text, text, uuid[]) IS
  'Public bounded Education district facet for a canonical city. Returns only districts that currently contain active published Education profiles.';
