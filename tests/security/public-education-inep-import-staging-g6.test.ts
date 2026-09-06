import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 public Education INEP import staging", () => {
  const migration = read(
    "supabase/migrations/20260906135247_add_public_education_inep_import_staging_g6.sql",
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

  it("exposes staging commands only to service_role", () => {
    for (const fn of [
      "create_public_education_import_batch",
      "stage_public_education_import_rows",
      "validate_public_education_import_batch",
    ]) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION private.${fn}`,
      );
    }

    expect(migration).toContain("TO service_role;");
    expect(migration).toContain(
      "COALESCE(auth.role(), '') <> 'service_role'",
    );
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
    expect(migration).toContain(
      "No materialization authority is defined here.",
    );
  });
});
