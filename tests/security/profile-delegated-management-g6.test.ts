import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 delegated profile management authority", () => {
  it("keeps platform admin separate from profile-local manager access", () => {
    const migration = read(
      "supabase/migrations/20260906085824_harden_profile_delegated_management_g6.sql",
    );
    const ui = read(
      "src/core/profiles/components/ProfileMembersManagerImproved.tsx",
    );

    expect(migration).toContain("Only the profile owner can manage people and access");
    expect(migration).not.toContain("role IN ('owner', 'admin')");
    expect(migration).toContain(
      "Storage role admin is surfaced as Gestor/Manager, never platform admin",
    );
    expect(ui).toContain("case 'admin': return 'Gestor'");
    expect(ui).toContain("Somente o proprietario pode convidar");
  });

  it("transfers structural ownership through profiles.user_id", () => {
    const migration = read(
      "supabase/migrations/20260906085824_harden_profile_delegated_management_g6.sql",
    );

    expect(migration).toContain("UPDATE public.profiles");
    expect(migration).toContain("SET user_id = p_new_owner_user_id");
    expect(migration).toContain("p_actor_user_id, 'admin'");
    expect(migration).toContain("p_new_owner_user_id, 'owner'");
    expect(migration).toContain("'claimed_user_id', p_new_owner_user_id");
  });

  it("prevents normal membership CRUD from creating another structural owner", () => {
    const migration = read(
      "supabase/migrations/20260906090130_enforce_structural_profile_owner_membership_g6.sql",
    );

    expect(migration).toContain(
      "owner_role_requires_structural_ownership_transfer",
    );
    expect(migration).toContain(
      "structural_owner_membership_must_remain_active_owner",
    );
    expect(migration).toContain(
      "structural_owner_membership_cannot_be_deleted",
    );
  });

  it("uses a bounded people/access reader instead of exposing auth.users", () => {
    const migration = read(
      "supabase/migrations/20260906090846_add_profile_people_access_reader_g6.sql",
    );
    const service = read(
      "src/core/profiles/services/multi-profile/profileMembersService.ts",
    );

    expect(migration).toContain("list_profile_access_members");
    expect(migration).toContain(
      "private.user_can_manage_profile(auth.uid(), p_profile_id)",
    );
    expect(migration).toContain("JOIN auth.users");
    expect(migration).toContain("FROM PUBLIC, anon");
    expect(service).toContain("'list_profile_access_members'");
  });

  it("exposes people/access inside canonical Business settings", () => {
    const page = read(
      "src/modules/business/dashboard/pages/BusinessSettingsPage.tsx",
    );
    expect(page).toContain("Pessoas e acesso");
    expect(page).toContain("profileId={business.profile_id}");
    expect(page).toContain("ProfileMembersManagerImproved");
  });
});
