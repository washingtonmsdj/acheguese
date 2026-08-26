import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (filePath: string) => readFileSync(resolve(repoRoot, filePath), "utf8");

describe("Business management authority SSOT", () => {
  it("keeps application ownership checks aligned to active owner/admin memberships", () => {
    const service = read("src/core/business/services/BusinessOwnershipService.ts");

    expect(service).toContain("profile?.user_id === userId");
    expect(service).toContain(".eq('is_active', true)");
    expect(service).toContain(".in('role', ['owner', 'admin'])");
    expect(service).not.toContain("['owner', 'admin'].includes(data.role)");
  });

  it("delegates the compatibility RLS helper to the canonical profile manager authority", () => {
    const migration = read(
      "supabase/migrations/20260826100000_unify_business_profile_management_authority.sql",
    );

    expect(migration).toContain("SELECT private.can_manage_profile(p_profile_id)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION private.can_operate_business_profile(uuid) FROM PUBLIC");
    expect(migration).not.toContain("'manager'");
    expect(migration).not.toContain("'moderator'");
    expect(migration).toContain("WITH CHECK (private.can_manage_profile(profile_id))");
  });
});
