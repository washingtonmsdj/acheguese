import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("MVP persistent fixture quarantine", () => {
  const migration = read(
    "supabase/migrations/20260921103540_quarantine_synthetic_public_business_professional_fixtures.sql",
  );
  const launchScope = read("src/app/config/launchScope.ts");
  const probe = read(
    "tests/security/synthetic-public-fixture-quarantine-remote-probe.sql",
  );

  it("quarantines current synthetic Business and Professional rows without generated IDs", () => {
    expect(migration).toContain("COALESCE(category, '') NOT IN ('educacao', 'education')");
    expect(migration).toContain("SET status = 'inactive'");
    expect(migration).toContain("visibility = 'private'::public.professional_profile_visibility");
    expect(migration).toContain("is_accepting_clients = false");
    expect(migration).toContain("SET is_public = false");
    expect(migration).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{27,}/i);
  });

  it("does not turn school provenance into a public launch exception", () => {
    expect(launchScope).toMatch(/education:\s*false/);
    expect(launchScope).toContain('educacao: "education"');
  });

  it("keeps the remote proof data-agnostic and rollback-only", () => {
    expect(probe).toContain("BEGIN;");
    expect(probe).toContain("SET LOCAL ROLE anon;");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{27,}/i);
  });
});
