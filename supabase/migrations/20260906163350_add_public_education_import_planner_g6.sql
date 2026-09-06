CREATE OR REPLACE FUNCTION private.plan_public_education_import_batch(
  p_batch_id uuid
)
RETURNS TABLE (
  row_id uuid,
  source_row_number integer,
  inep_code text,
  staging_action text,
  plan_status text,
  existing_education_profile_id uuid,
  existing_business_data_id uuid,
  staged_school_name text,
  current_school_name text,
  name_changed boolean,
  staged_school_network text,
  current_school_network text,
  network_changed boolean,
  has_address_payload boolean,
  protected_fact_codes text[],
  reason_codes text[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH batch AS (
    SELECT
      b.id,
      b.source_year,
      b.status,
      make_timestamptz(
        b.source_year + 1, 1, 1, 0, 0, 0, 'UTC'
      ) AS next_year_start
    FROM private.education_public_import_batches b
    WHERE b.id = p_batch_id
  ),
  eligible_batch AS (
    SELECT *
    FROM batch
    WHERE status = 'validated'
  ),
  facts AS (
    SELECT
      r.id AS row_id,
      COALESCE(
        array_agg(DISTINCT prov.field_code ORDER BY prov.field_code)
          FILTER (
            WHERE prov.id IS NOT NULL
              AND prov.verification_state <> 'superseded'
              AND (
                prov.source_kind IN (
                  'official_publication',
                  'institution_declared',
                  'community_correction',
                  'admin_review'
                )
                OR GREATEST(
                  prov.observed_at,
                  COALESCE(prov.source_updated_at, prov.observed_at)
                ) >= b.next_year_start
              )
          ),
        '{}'::text[]
      ) AS protected_fact_codes
    FROM eligible_batch b
    JOIN private.education_public_import_rows r
      ON r.batch_id = b.id
    LEFT JOIN public.business_profile_fact_provenance prov
      ON prov.business_id = r.existing_business_data_id
    GROUP BY r.id
  ),
  base AS (
    SELECT
      r.id AS row_id,
      r.source_row_number,
      r.inep_code,
      r.candidate_action AS staging_action,
      r.validation_status,
      r.existing_education_profile_id,
      r.existing_business_data_id,
      r.school_name AS staged_school_name,
      bd.business_name AS current_school_name,
      CASE
        WHEN r.existing_business_data_id IS NULL THEN false
        ELSE btrim(COALESCE(r.school_name, ''))
          IS DISTINCT FROM btrim(COALESCE(bd.business_name, ''))
      END AS name_changed,
      r.normalized_school_network AS staged_school_network,
      ep.school_network::text AS current_school_network,
      CASE
        WHEN r.existing_education_profile_id IS NULL THEN false
        ELSE COALESCE(r.normalized_school_network, '')
          IS DISTINCT FROM COALESCE(ep.school_network::text, '')
      END AS network_changed,
      (
        r.address_street IS NOT NULL
        OR r.address_number IS NOT NULL
        OR r.address_complement IS NOT NULL
        OR r.neighborhood_name IS NOT NULL
        OR r.postal_code IS NOT NULL
        OR r.latitude_raw IS NOT NULL
        OR r.longitude_raw IS NOT NULL
      ) AS has_address_payload,
      COALESCE(f.protected_fact_codes, '{}'::text[])
        AS protected_fact_codes
    FROM eligible_batch b
    JOIN private.education_public_import_rows r
      ON r.batch_id = b.id
    LEFT JOIN public.education_profiles ep
      ON ep.id = r.existing_education_profile_id
    LEFT JOIN public.business_data bd
      ON bd.id = r.existing_business_data_id
    LEFT JOIN facts f
      ON f.row_id = r.id
  )
  SELECT
    base.row_id,
    base.source_row_number,
    base.inep_code,
    base.staging_action,
    CASE
      WHEN base.validation_status = 'excluded'
        THEN 'excluded'
      WHEN base.staging_action = 'insert'
        THEN 'insert_candidate'
      WHEN base.staging_action = 'update'
        AND NOT base.name_changed
        AND NOT base.network_changed
        AND NOT base.has_address_payload
        THEN 'existing_no_change'
      WHEN base.staging_action = 'update'
        THEN 'existing_review_required'
      ELSE 'not_materializable'
    END AS plan_status,
    base.existing_education_profile_id,
    base.existing_business_data_id,
    base.staged_school_name,
    base.current_school_name,
    base.name_changed,
    base.staged_school_network,
    base.current_school_network,
    base.network_changed,
    base.has_address_payload,
    base.protected_fact_codes,
    array_remove(
      ARRAY[
        CASE
          WHEN base.validation_status = 'excluded'
            THEN 'source_row_excluded'
        END,
        CASE
          WHEN base.staging_action = 'insert'
            THEN 'new_inep'
        END,
        CASE
          WHEN base.name_changed
            THEN 'name_diff'
        END,
        CASE
          WHEN base.network_changed
            THEN 'network_diff'
        END,
        CASE
          WHEN base.staging_action = 'update'
            AND base.has_address_payload
            THEN 'existing_address_requires_review'
        END,
        CASE
          WHEN cardinality(base.protected_fact_codes) > 0
            THEN 'newer_or_curated_provenance_present'
        END,
        CASE
          WHEN base.staging_action = 'none'
            AND base.validation_status <> 'excluded'
            THEN 'not_candidate'
        END
      ]::text[],
      NULL
    ) AS reason_codes
  FROM base
  ORDER BY base.source_row_number;
$function$;

REVOKE ALL ON FUNCTION private.plan_public_education_import_batch(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.plan_public_education_import_batch(uuid)
  TO service_role;

COMMENT ON FUNCTION private.plan_public_education_import_batch(uuid) IS
  'Read-only Education import planner. It never materializes rows and treats fresher or curated provenance as an automatic-overwrite blocker.';
