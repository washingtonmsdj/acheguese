-- G6 Education: pin the official Censo Escolar 2025 artifact identity.
--
-- Host-only provenance is insufficient: another official INEP ZIP must not be
-- accepted for a 2025 batch. The table constraint protects persisted state and
-- the creator fails early with an explicit error.

ALTER TABLE private.education_public_import_batches
  DROP CONSTRAINT IF EXISTS education_public_import_batches_2025_archive_identity_chk;

ALTER TABLE private.education_public_import_batches
  ADD CONSTRAINT education_public_import_batches_2025_archive_identity_chk
  CHECK (
    source_year <> 2025
    OR (
      source_archive_url =
        'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip'
      AND manifest#>>'{safety,official_archive_identity_verified}' = 'true'
    )
  );

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

  IF p_source_year = 2025
     AND trim(p_source_archive_url) IS DISTINCT FROM
       'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip' THEN
    RAISE EXCEPTION 'education_import_unpinned_archive_url'
      USING ERRCODE = '23514';
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
     OR (
       p_source_year = 2025
       AND v_manifest#>>'{safety,official_archive_identity_verified}'
         IS DISTINCT FROM 'true'
     )
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
