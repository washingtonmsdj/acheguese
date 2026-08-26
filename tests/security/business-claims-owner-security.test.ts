import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

const migration = read(
  "supabase/migrations/20260826011200_harden_business_claim_identity_rls.sql",
);
const service = read("src/core/business/services/business.admin.ts");

describe("Business Claim owner boundary", () => {
  it("uses the canonical Portuguese status contract", () => {
    expect(service).toContain('.update({ status, resolved_at: new Date().toISOString() })');
    expect(service).not.toContain('"approved"');
    expect(service).not.toContain('"rejected"');
  });

  it("binds client claim ownership to user_id and pending state", () => {
    expect(migration).toContain("business_claims_identity_consistent");
    expect(migration).toContain("user_id = (SELECT auth.uid())");
    expect(migration).toContain("status = 'pendente'");
    expect(migration).toContain("reviewed_by IS NULL");
    expect(migration).toContain("reviewed_at IS NULL");
    expect(migration).toContain("review_notes IS NULL");
    expect(migration).not.toContain("OR (claimer_id IS NULL))");
  });
});
