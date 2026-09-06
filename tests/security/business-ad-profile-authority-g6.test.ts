import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 advertisement Business Profile authority", () => {
  it("routes self-service advertisement RLS through the Profile management SSOT", () => {
    const migration = read(
      "supabase/migrations/20260906100520_route_ad_rls_through_business_profile_ssot_g6.sql",
    );

    expect(migration).toContain("private.can_operate_business_profile(bd.profile_id)");
    expect(migration).toContain("ad_campaigns_owner_insert");
    expect(migration).toContain("ad_campaigns_owner_update_unapproved");
    expect(migration).toContain("ad_targets_owner_insert");
    expect(migration).toContain("ad_targets_owner_update");
    expect(migration).not.toContain("'manager'");
    expect(migration).not.toContain("'moderator'");
  });

  it("keeps the self-service request RPC on the same canonical authority", () => {
    const migration = read(
      "supabase/migrations/20260906093759_route_business_management_authority_to_ssot_g6.sql",
    );

    expect(migration).toContain("private.user_can_manage_profile");
    expect(migration).not.toContain("'manager', 'moderator'");
  });
});
