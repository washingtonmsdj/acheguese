import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 Business factual provenance", () => {
  const migration = read(
    "supabase/migrations/20260906104918_add_business_fact_provenance_g6.sql",
  );

  it("uses one transversal Business aggregate instead of an Education-only source table", () => {
    expect(migration).toContain(
      "create table public.business_profile_fact_provenance",
    );
    expect(migration).toContain("business_id uuid not null");
    expect(migration).toContain("field_code text not null");
    expect(migration).toContain("value_jsonb jsonb not null");
    expect(migration).toContain("observed_at timestamptz not null");
    expect(migration).not.toContain("create table public.education_fact");
  });

  it("distinguishes third-party observations from official verification", () => {
    expect(migration).toContain("'third_party_directory'");
    expect(migration).toContain("'official_publication'");
    expect(migration).toContain("'superseded'");
    expect(migration).toContain("'verified'");
    expect(migration).toContain(
      "Third-party observation; not promoted to official verification.",
    );
    expect(migration).toContain(
      "Official Bahia source corrected an address identifier",
    );
  });

  it("preserves the two superseded state-school addresses as history", () => {
    expect(migration).toContain(
      "Rua Alto dos Coqueiros, 372, Nordeste de Amaralina",
    );
    expect(migration).toContain(
      "Rua do Futuro Alto Santa Cruz, 475, Santa Cruz",
    );
    expect(migration).toContain("29191084");
    expect(migration).toContain("29192617");
  });

  it("does not expose provenance writes to browser roles", () => {
    expect(migration).toContain(
      "alter table public.business_profile_fact_provenance enable row level security",
    );
    expect(migration).toContain(
      "private.can_operate_business_profile(bd.profile_id)",
    );
    expect(migration).toContain(
      "revoke all on public.business_profile_fact_provenance",
    );
    expect(migration).toContain(
      "grant select on public.business_profile_fact_provenance to authenticated",
    );
    expect(migration).toContain(
      "grant all on public.business_profile_fact_provenance to service_role",
    );
    expect(migration).toContain(
      "from public, anon, authenticated",
    );
  });

  it("records provenance atomically when an admin applies a factual correction", () => {
    expect(migration).toContain(
      "private.record_business_profile_fact_provenance",
    );
    expect(migration).toContain("v_correction.business_id");
    expect(migration).toContain("v_correction.source_url");
    expect(migration).toContain("v_correction.id");
    expect(migration).toContain(
      "Aplicada automaticamente ao SSOT com provenance factual.",
    );
  });

  it("marks the profile-level Education source fields as legacy pointers", () => {
    expect(migration).toContain(
      "Legacy/latest profile-level source pointer",
    );
    expect(migration).toContain(
      "must not be treated as evidence for every Education field",
    );
  });

  it("indexes verifier and correction foreign-key access paths", () => {
    const indexMigration = read(
      "supabase/migrations/20260906105102_index_business_fact_provenance_verifier_g6.sql",
    );
    expect(migration).toContain(
      "idx_business_profile_fact_provenance_correction",
    );
    expect(indexMigration).toContain(
      "idx_business_profile_fact_provenance_verified_by_profile",
    );
  });
});
