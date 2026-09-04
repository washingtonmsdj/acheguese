import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260826004108_restrict_safety_private_reads_to_direct_owner.sql",
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

    const policySql = migration.slice(
      migration.indexOf("CREATE POLICY emergency_alerts_select_authorized"),
      migration.indexOf("DO $verify$"),
    );
    expect(policySql).toContain("profile.user_id = (SELECT auth.uid())");
    expect(policySql).not.toContain("private.auth_can_access_profile(");
    expect(policySql).not.toContain("profile_members");
    expect(migration).toContain("shared-profile Safety SELECT policies remain");
  });
});
