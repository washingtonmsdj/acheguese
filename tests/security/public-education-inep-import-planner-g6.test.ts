import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const migration = readFileSync(
  resolve(
    ROOT,
    "supabase/migrations/20260906163350_add_public_education_import_planner_g6.sql",
  ),
  "utf8",
);

describe("G6 public Education INEP import planner", () => {
  it("is a private read-only SECURITY INVOKER surface", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.plan_public_education_import_batch",
    );
    expect(migration).toContain("STABLE");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.plan_public_education_import_batch(uuid)",
    );
    expect(migration).toContain("TO service_role");

    expect(migration).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+(?:public\.|private\.)/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toContain(
      "private.profile_create_profile_with_extension",
    );
  });

  it("plans only batches that already passed the staging validator", () => {
    expect(migration).toContain("WHERE status = 'validated'");
    expect(migration).toContain("r.validation_status");
    expect(migration).toContain("r.candidate_action AS staging_action");
  });

  it("never treats private schools as insert candidates", () => {
    expect(migration).toContain(
      "WHEN base.validation_status = 'excluded'",
    );
    expect(migration).toContain("THEN 'excluded'");
    expect(migration).toContain("'source_row_excluded'");
    expect(migration).toContain(
      "WHEN base.staging_action = 'insert'",
    );
    expect(migration).toContain("THEN 'insert_candidate'");
  });

  it("requires review for existing changed records and address payloads", () => {
    expect(migration).toContain("base.name_changed");
    expect(migration).toContain("base.network_changed");
    expect(migration).toContain("base.has_address_payload");
    expect(migration).toContain("existing_review_required");
    expect(migration).toContain("existing_address_requires_review");
    expect(migration).toContain("name_diff");
    expect(migration).toContain("network_diff");
  });

  it("protects curated facts and evidence newer than the Censo source year", () => {
    expect(migration).toContain(
      "make_timestamptz(",
    );
    expect(migration).toContain("b.source_year + 1");
    for (const sourceKind of [
      "official_publication",
      "institution_declared",
      "community_correction",
      "admin_review",
    ]) {
      expect(migration).toContain(sourceKind);
    }
    expect(migration).toContain(
      "prov.verification_state <> 'superseded'",
    );
    expect(migration).toContain(
      "newer_or_curated_provenance_present",
    );
    expect(migration).toContain("protected_fact_codes");
  });
});
