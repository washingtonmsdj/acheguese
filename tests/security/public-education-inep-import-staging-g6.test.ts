import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 public Education INEP import staging", () => {
  const migration = read(
    "supabase/migrations/20260906135247_add_public_education_inep_import_staging_g6.sql",
  );
  const hardening = read(
    "supabase/migrations/20260906162157_harden_public_education_import_identity_g6.sql",
  );
  const sourceBinding = read(
    "supabase/migrations/20260906162828_bind_public_education_staging_source_contract_g6.sql",
  );
  const archiveBinding = read(
    "supabase/migrations/20260906165010_require_inep_archive_entry_binding_g6.sql",
  );
  const optionalRawBinding = read(
    "supabase/migrations/20260906170324_bind_public_education_optional_fields_to_raw_g6.sql",
  );
  const landingTimestampBinding = read(
    "supabase/migrations/20260906170644_bind_inep_landing_updated_at_manifest_g6.sql",
  );
  const rawRecordHashBinding = read(
    "supabase/migrations/20260906174652_bind_inep_raw_record_sha256_g6.sql",
  );
  const completenessBinding = read(
    "supabase/migrations/20260906175025_require_complete_inep_staging_batch_g6.sql",
  );
  const normalizedOutputBinding = read(
    "supabase/migrations/20260906180209_bind_inep_normalized_output_artifact_g6.sql",
  );
  const archiveIdentityBinding = read(
    "supabase/migrations/20260907020136_pin_public_education_inep_2025_artifact_g6.sql",
  );

  it("promotes non-null INEP codes to the canonical natural key", () => {
    expect(migration).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS education_profiles_school_inep_code_uidx",
    );
    expect(migration).toContain("WHERE school_inep_code IS NOT NULL");
    expect(migration).toContain(
      "DROP INDEX IF EXISTS public.idx_education_profiles_school_inep_code",
    );
  });

  it("keeps source batches and rows in private staging", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS private.education_public_import_batches",
    );
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS private.education_public_import_rows",
    );
    expect(migration).toContain("source_archive_sha256");
    expect(migration).toContain("target_city_ibge_code");
    expect(migration).toContain("raw_record jsonb NOT NULL");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.education_public_import_batches",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.education_public_import_rows",
    );
  });

  it("derives Censo dependency/network server-side and excludes private or inactive schools", () => {
    expect(migration).toContain("WHEN '1' THEN 'federal'");
    expect(migration).toContain("WHEN '2' THEN 'state'");
    expect(migration).toContain("WHEN '3' THEN 'municipal'");
    expect(migration).toContain("WHEN '4' THEN 'private'");
    expect(migration).toContain(
      "WHEN calculated.derived_network = 'private' THEN 'excluded'",
    );
    expect(migration).toContain(
      "WHEN r.operation_status_code <> '1' THEN 'excluded'",
    );
  });

  it("validates municipality, duplicates and canonical conflicts before any publish step", () => {
    expect(migration).toContain("'wrong_municipality'");
    expect(migration).toContain("'duplicate_inep_in_batch'");
    expect(migration).toContain("'inep_network_mismatch_existing'");
    expect(migration).toContain("'inep_city_mismatch_existing'");
    expect(migration).toContain("'invalid_postal_code'");
    expect(migration).toContain("'incomplete_coordinates'");
  });

  it("exposes staging commands only to service_role and hardens definer search_path", () => {
    for (const fn of [
      "create_public_education_import_batch",
      "stage_public_education_import_rows",
      "validate_public_education_import_batch",
    ]) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION private.${fn}`,
      );
      expect(hardening).toContain(
        `CREATE OR REPLACE FUNCTION private.${fn}`,
      );
    }

    expect(migration).toContain("TO service_role;");
    expect(hardening.match(/SET search_path = ''/g)).toHaveLength(3);
    expect(hardening).not.toContain("auth.role()");
  });

  it("allows corrected parsers to reprocess the same immutable archive", () => {
    expect(hardening).toContain(
      "education_public_import_batches_source_identity_key",
    );
    expect(hardening).toMatch(
      /UNIQUE \([\s\S]*source_archive_sha256,[\s\S]*source_file_name,[\s\S]*target_city_id,[\s\S]*parser_version[\s\S]*\)/,
    );
    expect(hardening).toMatch(
      /ON CONFLICT \([\s\S]*source_archive_sha256,[\s\S]*source_file_name,[\s\S]*target_city_id,[\s\S]*parser_version[\s\S]*\) DO NOTHING/,
    );
    expect(hardening).toContain(
      "AND source_file_name = trim(p_source_file_name)",
    );
    expect(hardening).toContain(
      "AND parser_version = trim(p_parser_version)",
    );
  });

  it("binds the staged batch to the adapter manifest and raw Censo record", () => {
    expect(sourceBinding).toContain(
      "acheguese.public-education-inep-normalized/1",
    );
    expect(sourceBinding).toContain(
      "education_import_manifest_contract_mismatch",
    );
    expect(sourceBinding).toContain(
      "v_manifest#>>'{source,archive_sha256}'",
    );
    expect(sourceBinding).toContain(
      "v_manifest#>>'{source,extracted_file}'",
    );
    expect(sourceBinding).toContain(
      "v_manifest#>>'{source,file_role}'",
    );
    expect(sourceBinding).toContain(
      "v_manifest#>>'{target,municipality_ibge_code}'",
    );
    expect(sourceBinding).toContain(
      "v_manifest#>>'{safety,header_contract_verified}'",
    );

    for (const errorCode of [
      "raw_census_year_mismatch",
      "raw_inep_mismatch",
      "raw_school_name_mismatch",
      "raw_uf_mismatch",
      "raw_municipality_mismatch",
      "raw_dependency_mismatch",
      "raw_operation_status_mismatch",
    ]) {
      expect(sourceBinding).toContain(errorCode);
    }
  });

  it("binds each batch to the exact normalized JSONL artifact contract", () => {
    expect(normalizedOutputBinding).toContain(
      "education_public_import_batches_normalized_output_chk",
    );
    expect(normalizedOutputBinding).toContain(
      "acheguese.public-education-inep-jsonl/1",
    );
    expect(normalizedOutputBinding).toContain(
      "manifest#>>'{normalized_output,sha256}'",
    );
    expect(normalizedOutputBinding).toContain(
      "manifest#>>'{normalized_output,file}'",
    );
    expect(normalizedOutputBinding).toContain(
      "manifest#>>'{normalized_output,rows}'",
    );
    expect(normalizedOutputBinding).toContain(
      "manifest#>>'{counts,target_municipality_rows}'",
    );
    expect(normalizedOutputBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
  });

  it("does not validate a truncated staging batch", () => {
    expect(completenessBinding).toContain(
      "education_public_import_batches_target_row_count_chk",
    );
    expect(completenessBinding).toContain(
      "manifest#>>'{counts,target_municipality_rows}'",
    );
    expect(completenessBinding).toContain("v_expected_rows integer");
    expect(completenessBinding).toContain(
      "education_import_batch_row_count_mismatch",
    );
    expect(completenessBinding).toContain("v_total <> v_expected_rows");
    expect(completenessBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
  });

  it("recomputes canonical raw-record SHA-256 inside Postgres", () => {
    expect(rawRecordHashBinding).toContain(
      "CREATE OR REPLACE FUNCTION private.education_inep_raw_record_sha256",
    );
    expect(rawRecordHashBinding).toContain("extensions.digest");
    expect(rawRecordHashBinding).toContain("ORDER BY item.key COLLATE \"C\"");
    expect(rawRecordHashBinding).toContain(
      "education_public_import_batches_record_hash_contract_chk",
    );
    expect(rawRecordHashBinding).toContain(
      "acheguese.inep-raw-record-sha256/1",
    );

    for (const errorCode of [
      "missing_or_invalid_source_record_sha256",
      "raw_record_non_string_value",
      "raw_record_sha256_mismatch",
    ]) {
      expect(rawRecordHashBinding).toContain(errorCode);
    }

    expect(rawRecordHashBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
    expect(rawRecordHashBinding).not.toContain("INSERT INTO public.business_data");
  });

  it("keeps landing-page provenance identical between batch columns and manifest", () => {
    expect(landingTimestampBinding).toContain(
      "education_public_import_batches_landing_updated_at_chk",
    );
    expect(landingTimestampBinding).toContain("source_page_updated_at");
    expect(landingTimestampBinding).toContain(
      "manifest#>>'{source,landing_page_updated_at}'",
    );
    expect(landingTimestampBinding).toContain("::timestamptz = source_page_updated_at");
    expect(landingTimestampBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
  });

  it("binds optional location payloads back to the retained raw source", () => {
    for (const errorCode of [
      "raw_address_street_mismatch",
      "raw_address_number_mismatch",
      "raw_address_complement_mismatch",
      "raw_neighborhood_mismatch",
      "raw_postal_code_mismatch",
      "raw_latitude_mismatch",
      "raw_longitude_mismatch",
    ]) {
      expect(optionalRawBinding).toContain(errorCode);
    }

    expect(optionalRawBinding).toContain("r.raw_record ? 'DS_ENDERECO'");
    expect(optionalRawBinding).toContain("r.raw_record ? 'NO_ENDERECO'");
    expect(optionalRawBinding).toContain("r.raw_record ? 'NU_LATITUDE'");
    expect(optionalRawBinding).toContain("r.raw_record ? 'LATITUDE'");
    expect(optionalRawBinding).toContain("r.raw_record ? 'NU_LONGITUDE'");
    expect(optionalRawBinding).toContain("r.raw_record ? 'LONGITUDE'");
    expect(optionalRawBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
    expect(optionalRawBinding).not.toContain("INSERT INTO public.business_data");
  });

  it("requires cryptographic ZIP-to-CSV binding before a batch can exist", () => {
    expect(archiveBinding).toContain(
      "education_public_import_batches_archive_binding_chk",
    );
    expect(archiveBinding).toContain(
      "manifest#>>'{safety,archive_binding_verified}' = 'true'",
    );
    expect(archiveBinding).toContain(
      "manifest#>>'{source,archive_entry_sha256}'",
    );
    expect(archiveBinding).toContain(
      "manifest#>>'{source,extracted_file_sha256}'",
    );
    expect(archiveBinding).toMatch(
      /lower\(manifest#>>'\{source,archive_entry_sha256\}'\)[\s\S]*=[\s\S]*lower\(manifest#>>'\{source,extracted_file_sha256\}'\)/,
    );
    expect(archiveBinding).toContain(
      "= source_file_name",
    );
  });

  it("pins the exact official Censo Escolar 2025 archive in persisted staging", () => {
    expect(archiveIdentityBinding).toContain(
      "education_public_import_batches_2025_archive_identity_chk",
    );
    expect(archiveIdentityBinding).toContain(
      "https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip",
    );
    expect(archiveIdentityBinding).toContain(
      "manifest#>>'{safety,official_archive_identity_verified}' = 'true'",
    );
    expect(archiveIdentityBinding).toContain(
      "education_import_unpinned_archive_url",
    );
    expect(archiveIdentityBinding).not.toContain(
      "INSERT INTO public.education_profiles",
    );
    expect(archiveIdentityBinding).not.toContain(
      "INSERT INTO public.business_data",
    );
    expect(archiveIdentityBinding).not.toContain("INSERT INTO public.profiles");
  });

  it("does not introduce a second Profile/Business materialization authority", () => {
    expect(migration).not.toContain(
      "INSERT INTO public.education_profiles",
    );
    expect(migration).not.toContain("INSERT INTO public.business_data");
    expect(migration).not.toContain("INSERT INTO public.profiles");
    expect(migration).not.toContain(
      "private.profile_create_profile_with_extension(",
    );
    expect(migration).not.toMatch(
      /CREATE OR REPLACE FUNCTION private\.[^(]*material/i,
    );
    expect(hardening).not.toContain("INSERT INTO public.education_profiles");
    expect(hardening).not.toContain("INSERT INTO public.business_data");
    expect(hardening).not.toContain("INSERT INTO public.profiles");
    expect(hardening).not.toMatch(
      /CREATE OR REPLACE FUNCTION private\.[^(]*material/i,
    );
    expect(sourceBinding).not.toContain("INSERT INTO public.education_profiles");
    expect(sourceBinding).not.toContain("INSERT INTO public.business_data");
    expect(sourceBinding).not.toContain("INSERT INTO public.profiles");
    expect(sourceBinding).not.toMatch(
      /CREATE OR REPLACE FUNCTION private\.[^(]*material/i,
    );
    expect(archiveBinding).not.toContain("INSERT INTO public.education_profiles");
    expect(archiveBinding).not.toContain("INSERT INTO public.business_data");
    expect(archiveBinding).not.toContain("INSERT INTO public.profiles");
    expect(archiveBinding).not.toContain(
      "private.profile_create_profile_with_extension(",
    );
    expect(optionalRawBinding).not.toContain(
      "private.profile_create_profile_with_extension(",
    );
    expect(migration).toContain(
      "No materialization authority is defined here.",
    );
  });
});
