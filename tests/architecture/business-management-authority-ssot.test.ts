import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (filePath: string) => readFileSync(resolve(repoRoot, filePath), "utf8");

describe("Business management authority SSOT", () => {
  it("preserves direct profile owner and active manager semantics through canonical authorities", () => {
    const service = read("src/core/business/services/BusinessOwnershipService.ts");
    const membershipService = read(
      "src/core/profiles/services/multi-profile/profileMembersService.ts",
    );

    expect(service).toContain("profileService.getProfileById(ownerProfileId)");
    expect(service).toContain("profile?.user_id === userId");
    expect(service).toContain("ProfileMembersService.isManager(ownerProfileId, userId)");
    expect(service).not.toContain(".from('profiles')");

    expect(membershipService).toContain(".eq('is_active', true)");
    expect(membershipService).toContain("return role === 'owner' || role === 'admin'");
  });

  it("keeps Business admin reads on generated schema and Profile authority", () => {
    const admin = read("src/core/business/services/business.admin.ts");

    expect(admin).toContain(
      'import { profileService } from "@/core/profiles/services/ProfileService";',
    );
    expect(admin).toContain(
      "profileService.getProfileById(business.profile_id)",
    );
    expect(admin).not.toContain("AdminSupabaseClient");
    expect(admin).not.toContain('.from("profiles")');
  });

  it("keeps Business queries on the generated Supabase schema", () => {
    const queries = read("src/core/business/services/business.queries.ts");

    expect(queries).not.toContain("AdminSupabaseClient");
    expect(queries).not.toContain("supabaseTyped");
    expect(queries).toContain('.from("business_data")');
    expect(queries).toContain('.from("public_business_search")');
    expect(queries).toContain('.from("business_gallery")');
  });

  it("keeps Business slug reads on the generated Supabase schema", () => {
    const slugs = read("src/core/business/services/business.slug-queries.ts");

    expect(slugs).toContain('.from("business_data")');
    expect(slugs).not.toContain("BusinessSlugQueriesDbClient");
    expect(slugs).not.toContain("SlugRow");
    expect(slugs).not.toContain("supabase as unknown as");
  });

  it("delegates the compatibility RLS helper to the canonical profile manager authority", () => {
    const migration = read(
      "supabase/migrations/20260826095937_unify_business_profile_management_authority.sql",
    );

    expect(migration).toContain("SELECT private.can_manage_profile(p_profile_id)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION private.can_operate_business_profile(uuid) FROM PUBLIC");
    expect(migration).not.toContain("'manager'");
    expect(migration).not.toContain("'moderator'");
    expect(migration).toContain("WITH CHECK (private.can_manage_profile(profile_id))");
  });
});
