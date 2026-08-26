import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260826004400_restrict_safety_private_reads_to_direct_owner.sql",
  ),
  "utf8",
);

describe("Safety private read privacy", () => {
  it("keeps sensitive Safety SELECT policies owner-only", () => {
    for (const policy of [
      "emergency_alerts_select_authorized",
      "safety_incidents_select_authorized",
      "safety_evidence_select_authorized",
      "ride_shares_select_own",
      "safety_audit_log_select_authorized",
    ]) {
      expect(migration).toContain(`CREATE POLICY ${policy}`);
    }

    expect(migration).toContain("profile.user_id = (SELECT auth.uid())");
    expect(migration).not.toContain("private.auth_can_access_profile(");
    expect(migration).not.toContain("profile_members");
    expect(migration).toContain("shared-profile Safety SELECT policies remain");
  });
});
