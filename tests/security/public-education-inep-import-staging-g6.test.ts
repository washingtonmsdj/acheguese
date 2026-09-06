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
    expect(migration).toContain(
      "No materialization authority is defined here.",
    );
  });
});
