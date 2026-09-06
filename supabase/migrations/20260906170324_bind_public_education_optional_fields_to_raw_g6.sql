CREATE OR REPLACE FUNCTION private.validate_public_education_import_batch(
  p_batch_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_target_city_id uuid;
  v_target_city_ibge_code text;
  v_target_city_path text;
  v_source_year integer;
  v_batch_status text;
  v_candidates integer;
  v_excluded integer;
  v_invalid integer;
  v_total integer;
  v_final_status text;
BEGIN
  SELECT b.target_city_id,
         b.target_city_ibge_code,
         b.source_year,
         b.status,
         l.geographic_path
  INTO v_target_city_id,
       v_target_city_ibge_code,
       v_source_year,
       v_batch_status,
       v_target_city_path
  FROM private.education_public_import_batches b
  JOIN public.locations l ON l.id = b.target_city_id
  WHERE b.id = p_batch_id
  FOR UPDATE OF b;

  IF v_batch_status IS NULL THEN
    RAISE EXCEPTION 'education_import_batch_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_batch_status <> 'staging' THEN
    RAISE EXCEPTION 'education_import_batch_not_staging'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*)
  INTO v_total
  FROM private.education_public_import_rows
  WHERE batch_id = p_batch_id;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'education_import_batch_empty'
      USING ERRCODE = '23514';
  END IF;

  WITH duplicate_inep AS (
    SELECT r.inep_code, count(*) AS duplicate_count
    FROM private.education_public_import_rows r
    WHERE r.batch_id = p_batch_id
      AND r.inep_code IS NOT NULL
    GROUP BY r.inep_code
  ),
  calculated AS (
    SELECT
      r.id,
      CASE r.administrative_dependency_code
        WHEN '1' THEN 'federal'
        WHEN '2' THEN 'state'
        WHEN '3' THEN 'municipal'
        WHEN '4' THEN 'private'
        ELSE NULL
      END AS derived_network,
      ep.id AS existing_education_profile_id,
      bd.id AS existing_business_data_id,
      array_remove(ARRAY[
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'NU_ANO_CENSO', ''))
            IS DISTINCT FROM v_source_year::text
          THEN 'raw_census_year_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'CO_ENTIDADE', ''))
            IS DISTINCT FROM COALESCE(r.inep_code, '')
          THEN 'raw_inep_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'NO_ENTIDADE', ''))
            IS DISTINCT FROM COALESCE(r.school_name, '')
          THEN 'raw_school_name_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'CO_UF', ''))
            IS DISTINCT FROM COALESCE(r.uf_ibge_code, '')
          THEN 'raw_uf_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'CO_MUNICIPIO', ''))
            IS DISTINCT FROM COALESCE(r.municipality_ibge_code, '')
          THEN 'raw_municipality_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'TP_DEPENDENCIA', ''))
            IS DISTINCT FROM COALESCE(r.administrative_dependency_code, '')
          THEN 'raw_dependency_mismatch'
        END,
        CASE
          WHEN btrim(COALESCE(r.raw_record->>'TP_SITUACAO_FUNCIONAMENTO', ''))
            IS DISTINCT FROM COALESCE(r.operation_status_code, '')
          THEN 'raw_operation_status_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'DS_ENDERECO'
                THEN NULLIF(btrim(r.raw_record->>'DS_ENDERECO'), '')
              WHEN r.raw_record ? 'NO_ENDERECO'
                THEN NULLIF(btrim(r.raw_record->>'NO_ENDERECO'), '')
              ELSE NULL
            END
          ) IS DISTINCT FROM r.address_street
          THEN 'raw_address_street_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'NU_ENDERECO'
                THEN NULLIF(btrim(r.raw_record->>'NU_ENDERECO'), '')
              ELSE NULL
            END
          ) IS DISTINCT FROM r.address_number
          THEN 'raw_address_number_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'DS_COMPLEMENTO'
                THEN NULLIF(btrim(r.raw_record->>'DS_COMPLEMENTO'), '')
              ELSE NULL
            END
          ) IS DISTINCT FROM r.address_complement
          THEN 'raw_address_complement_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'NO_BAIRRO'
                THEN NULLIF(btrim(r.raw_record->>'NO_BAIRRO'), '')
              ELSE NULL
            END
          ) IS DISTINCT FROM r.neighborhood_name
          THEN 'raw_neighborhood_mismatch'
        END,
        CASE
          WHEN NULLIF(
            regexp_replace(
              COALESCE(NULLIF(btrim(r.raw_record->>'CO_CEP'), ''), ''),
              '[^0-9]',
              '',
              'g'
            ),
            ''
          ) IS DISTINCT FROM r.postal_code
          THEN 'raw_postal_code_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'NU_LATITUDE'
                THEN NULLIF(
                  replace(
                    btrim(COALESCE(r.raw_record->>'NU_LATITUDE', '')),
                    ',',
                    '.'
                  ),
                  ''
                )
              WHEN r.raw_record ? 'LATITUDE'
                THEN NULLIF(
                  replace(
                    btrim(COALESCE(r.raw_record->>'LATITUDE', '')),
                    ',',
                    '.'
                  ),
                  ''
                )
              ELSE NULL
            END
          ) IS DISTINCT FROM r.latitude_raw
          THEN 'raw_latitude_mismatch'
        END,
        CASE
          WHEN (
            CASE
              WHEN r.raw_record ? 'NU_LONGITUDE'
                THEN NULLIF(
                  replace(
                    btrim(COALESCE(r.raw_record->>'NU_LONGITUDE', '')),
                    ',',
                    '.'
                  ),
                  ''
                )
              WHEN r.raw_record ? 'LONGITUDE'
                THEN NULLIF(
                  replace(
                    btrim(COALESCE(r.raw_record->>'LONGITUDE', '')),
                    ',',
                    '.'
                  ),
                  ''
                )
              ELSE NULL
            END
          ) IS DISTINCT FROM r.longitude_raw
          THEN 'raw_longitude_mismatch'
        END,
        CASE
          WHEN r.inep_code IS NULL OR r.inep_code !~ '^[0-9]{8}$'
          THEN 'invalid_inep_code'
        END,
        CASE
          WHEN r.school_name IS NULL
            OR char_length(r.school_name) NOT BETWEEN 2 AND 220
          THEN 'invalid_school_name'
        END,
        CASE
          WHEN r.uf_ibge_code IS NULL
            OR r.uf_ibge_code <> left(v_target_city_ibge_code, 2)
          THEN 'wrong_uf'
        END,
        CASE
          WHEN r.municipality_ibge_code IS NULL
            OR r.municipality_ibge_code <> v_target_city_ibge_code
          THEN 'wrong_municipality'
        END,
        CASE
          WHEN r.administrative_dependency_code
            NOT IN ('1','2','3','4')
            OR r.administrative_dependency_code IS NULL
          THEN 'invalid_administrative_dependency_code'
        END,
        CASE
          WHEN r.operation_status_code IS NULL
            OR r.operation_status_code !~ '^[0-9]{1,3}$'
          THEN 'invalid_operation_status_code'
        END,
        CASE
          WHEN COALESCE(d.duplicate_count, 0) > 1
          THEN 'duplicate_inep_in_batch'
        END,
        CASE
          WHEN r.postal_code IS NOT NULL
            AND r.postal_code !~ '^[0-9]{8}$'
          THEN 'invalid_postal_code'
        END,
        CASE
          WHEN (r.latitude_raw IS NULL) <> (r.longitude_raw IS NULL)
          THEN 'incomplete_coordinates'
        END,
        CASE
          WHEN r.latitude_raw IS NOT NULL
            AND r.latitude_raw !~ '^-?[0-9]+(\.[0-9]+)?$'
          THEN 'invalid_latitude'
        END,
        CASE
          WHEN r.longitude_raw IS NOT NULL
            AND r.longitude_raw !~ '^-?[0-9]+(\.[0-9]+)?$'
          THEN 'invalid_longitude'
        END,
        CASE
          WHEN r.latitude_raw ~ '^-?[0-9]+(\.[0-9]+)?$'
            AND r.latitude_raw::numeric NOT BETWEEN -90 AND 90
          THEN 'latitude_out_of_range'
        END,
        CASE
          WHEN r.longitude_raw ~ '^-?[0-9]+(\.[0-9]+)?$'
            AND r.longitude_raw::numeric NOT BETWEEN -180 AND 180
          THEN 'longitude_out_of_range'
        END,
        CASE
          WHEN ep.id IS NOT NULL
            AND COALESCE(ep.school_type, 'public') <> 'public'
          THEN 'inep_conflicts_non_public_profile'
        END,
        CASE
          WHEN ep.id IS NOT NULL
            AND ep.school_network IS NOT NULL
            AND CASE r.administrative_dependency_code
              WHEN '1' THEN 'federal'
              WHEN '2' THEN 'state'
              WHEN '3' THEN 'municipal'
              WHEN '4' THEN 'private'
              ELSE NULL
            END IS DISTINCT FROM ep.school_network
          THEN 'inep_network_mismatch_existing'
        END,
        CASE
          WHEN ep.id IS NOT NULL
            AND existing_location.geographic_path IS NOT NULL
            AND existing_location.geographic_path <> v_target_city_path
            AND existing_location.geographic_path
              NOT LIKE v_target_city_path || '/%'
          THEN 'inep_city_mismatch_existing'
        END
      ]::text[], NULL) AS errors
    FROM private.education_public_import_rows r
    LEFT JOIN duplicate_inep d
      ON d.inep_code = r.inep_code
    LEFT JOIN public.education_profiles ep
      ON ep.school_inep_code = r.inep_code
    LEFT JOIN public.business_data bd
      ON bd.profile_id = ep.business_id
    LEFT JOIN public.locations existing_location
      ON existing_location.id = bd.location_id
    WHERE r.batch_id = p_batch_id
  )
  UPDATE private.education_public_import_rows r
  SET
    normalized_school_network = calculated.derived_network,
    validation_errors = calculated.errors,
    validation_status = CASE
      WHEN cardinality(calculated.errors) > 0 THEN 'invalid'
      WHEN calculated.derived_network = 'private' THEN 'excluded'
      WHEN r.operation_status_code <> '1' THEN 'excluded'
      ELSE 'valid'
    END,
    candidate_action = CASE
      WHEN cardinality(calculated.errors) > 0 THEN 'none'
      WHEN calculated.derived_network = 'private' THEN 'none'
      WHEN r.operation_status_code <> '1' THEN 'none'
      WHEN calculated.existing_education_profile_id IS NULL THEN 'insert'
      ELSE 'update'
    END,
    existing_education_profile_id =
      calculated.existing_education_profile_id,
    existing_business_data_id =
      calculated.existing_business_data_id,
    validated_at = now()
  FROM calculated
  WHERE r.id = calculated.id;

  SELECT
    count(*) FILTER (WHERE validation_status = 'valid'),
    count(*) FILTER (WHERE validation_status = 'excluded'),
    count(*) FILTER (WHERE validation_status = 'invalid')
  INTO v_candidates, v_excluded, v_invalid
  FROM private.education_public_import_rows
  WHERE batch_id = p_batch_id;

  v_final_status := CASE
    WHEN v_invalid > 0 THEN 'rejected'
    ELSE 'validated'
  END;

  UPDATE private.education_public_import_batches
  SET
    status = v_final_status,
    staged_rows = v_total,
    candidate_rows = v_candidates,
    excluded_rows = v_excluded,
    invalid_rows = v_invalid,
    validated_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', v_invalid = 0,
    'batch_id', p_batch_id,
    'status', v_final_status,
    'staged_rows', v_total,
    'candidate_rows', v_candidates,
    'excluded_rows', v_excluded,
    'invalid_rows', v_invalid
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.validate_public_education_import_batch(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.validate_public_education_import_batch(uuid)
  TO service_role;

COMMENT ON FUNCTION private.validate_public_education_import_batch(uuid) IS
  'Validates INEP natural key, target municipality, dependency/network, active status, normalized-to-raw source binding for identity and optional location fields, and existing canonical conflicts. Never mutates public Education/Profile/Business data.';
