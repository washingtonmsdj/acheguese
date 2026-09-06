CREATE OR REPLACE FUNCTION private.create_public_education_import_batch(
  p_source_year integer,
  p_source_landing_url text,
  p_source_archive_url text,
  p_source_archive_sha256 text,
  p_source_file_name text,
  p_source_page_updated_at timestamptz,
  p_target_city_id uuid,
  p_parser_version text,
  p_manifest jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_city_ibge_code text;
  v_batch_id uuid;
  v_status text;
  v_idempotent boolean := false;
  v_manifest jsonb := COALESCE(p_manifest, '{}'::jsonb);
BEGIN
  IF p_source_year NOT BETWEEN 2007 AND 2100 THEN
    RAISE EXCEPTION 'education_import_invalid_source_year'
      USING ERRCODE = '22023';
  END IF;

  IF p_source_landing_url IS NULL
     OR p_source_landing_url !~* '^https://www\.gov\.br/inep/'
     OR char_length(p_source_landing_url) > 2000 THEN
    RAISE EXCEPTION 'education_import_invalid_landing_url'
      USING ERRCODE = '22023';
  END IF;

  IF p_source_archive_url IS NULL
     OR p_source_archive_url !~* '^https://download\.inep\.gov\.br/'
     OR char_length(p_source_archive_url) > 2000 THEN
    RAISE EXCEPTION 'education_import_invalid_archive_url'
      USING ERRCODE = '22023';
  END IF;

  IF lower(trim(COALESCE(p_source_archive_sha256, '')))
     !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'education_import_invalid_archive_sha256'
      USING ERRCODE = '22023';
  END IF;

  IF p_source_file_name IS NULL
     OR char_length(trim(p_source_file_name)) NOT BETWEEN 1 AND 255 THEN
    RAISE EXCEPTION 'education_import_invalid_source_file_name'
      USING ERRCODE = '22023';
  END IF;

  IF p_parser_version IS NULL
     OR trim(p_parser_version) !~ '^[A-Za-z0-9._/-]{1,100}$' THEN
    RAISE EXCEPTION 'education_import_invalid_parser_version'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(v_manifest) <> 'object'
     OR octet_length(v_manifest::text) > 65536 THEN
    RAISE EXCEPTION 'education_import_invalid_manifest'
      USING ERRCODE = '22023';
  END IF;

  SELECT l.metadata->>'ibge_code'
  INTO v_city_ibge_code
  FROM public.locations l
  WHERE l.id = p_target_city_id
    AND l.type = 'city'
    AND l.status = 'active'
  FOR SHARE;

  IF v_city_ibge_code IS NULL
     OR v_city_ibge_code !~ '^[0-9]{7}$' THEN
    RAISE EXCEPTION 'education_import_target_city_not_canonical'
      USING ERRCODE = '23514';
  END IF;

  IF v_manifest->>'contract'
       IS DISTINCT FROM 'acheguese.public-education-inep-normalized/1'
     OR v_manifest->>'parser_version'
       IS DISTINCT FROM trim(p_parser_version)
     OR v_manifest#>>'{source,landing_url}'
       IS DISTINCT FROM trim(p_source_landing_url)
     OR v_manifest#>>'{source,archive_url}'
       IS DISTINCT FROM trim(p_source_archive_url)
     OR lower(COALESCE(v_manifest#>>'{source,archive_sha256}', ''))
       IS DISTINCT FROM lower(trim(p_source_archive_sha256))
     OR v_manifest#>>'{source,source_year}'
       IS DISTINCT FROM p_source_year::text
     OR v_manifest#>>'{source,extracted_file}'
       IS DISTINCT FROM trim(p_source_file_name)
     OR v_manifest#>>'{source,file_role}'
       IS DISTINCT FROM 'school_table'
     OR v_manifest#>>'{target,municipality_ibge_code}'
       IS DISTINCT FROM v_city_ibge_code
     OR v_manifest#>>'{target,uf_ibge_code}'
       IS DISTINCT FROM left(v_city_ibge_code, 2)
     OR v_manifest#>>'{safety,calls_supabase}'
       IS DISTINCT FROM 'false'
     OR v_manifest#>>'{safety,publishes_records}'
       IS DISTINCT FROM 'false'
     OR v_manifest#>>'{safety,staging_quality_gate_required}'
       IS DISTINCT FROM 'true'
     OR v_manifest#>>'{safety,official_archive_host_required}'
       IS DISTINCT FROM 'true'
     OR v_manifest#>>'{safety,header_contract_verified}'
       IS DISTINCT FROM 'true'
     OR v_manifest#>>'{source,encoding}'
       NOT IN ('utf8', 'latin1')
     OR v_manifest#>>'{source,delimiter}'
       NOT IN (';', ',', 'tab', '|')
     OR jsonb_typeof(v_manifest#>'{columns,required}') <> 'array'
     OR NOT (
       v_manifest#>'{columns,required}' @>
       '[
         "NU_ANO_CENSO",
         "CO_ENTIDADE",
         "NO_ENTIDADE",
         "TP_SITUACAO_FUNCIONAMENTO",
         "CO_UF",
         "CO_MUNICIPIO",
         "TP_DEPENDENCIA"
       ]'::jsonb
     ) THEN
    RAISE EXCEPTION 'education_import_manifest_contract_mismatch'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO private.education_public_import_batches (
    source_year,
    source_landing_url,
    source_archive_url,
    source_archive_sha256,
    source_file_name,
    source_page_updated_at,
    target_city_id,
    target_city_ibge_code,
    parser_version,
    manifest
  )
  VALUES (
    p_source_year,
    trim(p_source_landing_url),
    trim(p_source_archive_url),
    lower(trim(p_source_archive_sha256)),
    trim(p_source_file_name),
    p_source_page_updated_at,
    p_target_city_id,
    v_city_ibge_code,
    trim(p_parser_version),
    v_manifest
  )
  ON CONFLICT (
    source_family,
    source_year,
    source_archive_sha256,
    source_file_name,
    target_city_id,
    parser_version
  ) DO NOTHING
  RETURNING id, status INTO v_batch_id, v_status;

  IF v_batch_id IS NULL THEN
    SELECT id, status
    INTO v_batch_id, v_status
    FROM private.education_public_import_batches
    WHERE source_family = 'inep_censo_escolar'
      AND source_year = p_source_year
      AND source_archive_sha256 = lower(trim(p_source_archive_sha256))
      AND source_file_name = trim(p_source_file_name)
      AND target_city_id = p_target_city_id
      AND parser_version = trim(p_parser_version);

    v_idempotent := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'status', v_status,
    'idempotent', v_idempotent,
    'target_city_ibge_code', v_city_ibge_code
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.stage_public_education_import_rows(
  p_batch_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_batch_status text;
  v_input_count integer;
  v_inserted integer;
  v_total integer;
BEGIN
  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'education_import_rows_must_be_array'
      USING ERRCODE = '22023';
  END IF;

  v_input_count := jsonb_array_length(p_rows);

  IF v_input_count NOT BETWEEN 1 AND 500
     OR octet_length(p_rows::text) > 5242880 THEN
    RAISE EXCEPTION 'education_import_rows_payload_out_of_bounds'
      USING ERRCODE = '22023';
  END IF;

  SELECT status
  INTO v_batch_status
  FROM private.education_public_import_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF v_batch_status IS NULL THEN
    RAISE EXCEPTION 'education_import_batch_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_batch_status <> 'staging' THEN
    RAISE EXCEPTION 'education_import_batch_not_staging'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_rows) AS item(value)
    WHERE jsonb_typeof(item.value) <> 'object'
       OR COALESCE(item.value->>'source_row_number', '')
          !~ '^[1-9][0-9]{0,8}$'
       OR jsonb_typeof(item.value->'raw_record') <> 'object'
       OR octet_length((item.value->'raw_record')::text) > 131072
       OR (
         NULLIF(lower(trim(item.value->>'source_record_sha256')), '') IS NOT NULL
         AND lower(trim(item.value->>'source_record_sha256'))
             !~ '^[0-9a-f]{64}$'
       )
  ) THEN
    RAISE EXCEPTION 'education_import_invalid_row_envelope'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT (item.value->>'source_row_number')::integer AS row_number,
             count(*) AS row_count
      FROM jsonb_array_elements(p_rows) AS item(value)
      GROUP BY 1
      HAVING count(*) > 1
    ) duplicates
  ) THEN
    RAISE EXCEPTION 'education_import_duplicate_source_row_number_in_payload'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_rows) AS item(value)
    JOIN private.education_public_import_rows existing
      ON existing.batch_id = p_batch_id
     AND existing.source_row_number =
       (item.value->>'source_row_number')::integer
  ) THEN
    RAISE EXCEPTION 'education_import_source_row_already_staged'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO private.education_public_import_rows (
    batch_id,
    source_row_number,
    inep_code,
    school_name,
    uf_ibge_code,
    municipality_ibge_code,
    administrative_dependency_code,
    operation_status_code,
    address_street,
    address_number,
    address_complement,
    neighborhood_name,
    postal_code,
    latitude_raw,
    longitude_raw,
    source_record_sha256,
    raw_record
  )
  SELECT
    p_batch_id,
    (item.value->>'source_row_number')::integer,
    NULLIF(trim(item.value->>'inep_code'), ''),
    NULLIF(trim(item.value->>'school_name'), ''),
    NULLIF(trim(item.value->>'uf_ibge_code'), ''),
    NULLIF(trim(item.value->>'municipality_ibge_code'), ''),
    NULLIF(trim(item.value->>'administrative_dependency_code'), ''),
    NULLIF(trim(item.value->>'operation_status_code'), ''),
    NULLIF(trim(item.value->>'address_street'), ''),
    NULLIF(trim(item.value->>'address_number'), ''),
    NULLIF(trim(item.value->>'address_complement'), ''),
    NULLIF(trim(item.value->>'neighborhood_name'), ''),
    NULLIF(regexp_replace(COALESCE(item.value->>'postal_code', ''), '[^0-9]', '', 'g'), ''),
    NULLIF(replace(trim(COALESCE(item.value->>'latitude', '')), ',', '.'), ''),
    NULLIF(replace(trim(COALESCE(item.value->>'longitude', '')), ',', '.'), ''),
    NULLIF(lower(trim(item.value->>'source_record_sha256')), ''),
    item.value->'raw_record'
  FROM jsonb_array_elements(p_rows) AS item(value);

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  SELECT count(*)
  INTO v_total
  FROM private.education_public_import_rows
  WHERE batch_id = p_batch_id;

  UPDATE private.education_public_import_batches
  SET staged_rows = v_total
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', p_batch_id,
    'inserted_rows', v_inserted,
    'staged_rows', v_total
  );
END;
$function$;

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

REVOKE ALL ON FUNCTION private.create_public_education_import_batch(
  integer, text, text, text, text, timestamptz, uuid, text, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.stage_public_education_import_rows(
  uuid, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_public_education_import_batch(
  uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.create_public_education_import_batch(
  integer, text, text, text, text, timestamptz, uuid, text, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION private.stage_public_education_import_rows(
  uuid, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION private.validate_public_education_import_batch(
  uuid
) TO service_role;

COMMENT ON TABLE private.education_public_import_batches IS
  'Private immutable-source staging batches for public Education imports. No materialization authority is defined here.';
COMMENT ON TABLE private.education_public_import_rows IS
  'Normalized source rows staged for validation before any canonical Profile/Business mutation. Raw source row is retained for audit.';
COMMENT ON FUNCTION private.validate_public_education_import_batch(uuid) IS
  'Validates INEP natural key, target municipality, dependency/network, active status and existing canonical conflicts. Never mutates public Education/Profile/Business data.';
