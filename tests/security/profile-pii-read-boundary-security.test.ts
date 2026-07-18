import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("profile PII read boundary", () => {
  const migration = read(
    "supabase/migrations/20260718100000_harden_profile_pii_read_boundaries.sql",
  );
  const tightening = read(
    "supabase/migrations/20260718110000_tighten_profile_private_broker_scope.sql",
  );
  const locationBoundary = read(
    "supabase/migrations/20260718120000_enforce_profile_location_visibility.sql",
  );
  const hiddenLocationBoundary = read(
    "supabase/migrations/20260718130000_enforce_hidden_profile_location_projection.sql",
  );
  const publicTerritoryBoundary = read(
    "supabase/migrations/20260718140000_add_public_profile_territory_boundary.sql",
  );

  it("restricts browser roles to an explicit PII-free profile projection", () => {
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated",
    );
    expect(migration).toContain('DROP POLICY IF EXISTS "Perfis ativos visíveis publicamente"');
    expect(migration).toContain('DROP POLICY IF EXISTS "Public can view active profiles"');
    expect(migration).toContain('CREATE POLICY "Public can view active public profiles"');
    expect(migration).toContain("COALESCE(is_public, true) = true");

    const grant = migration.match(
      /GRANT SELECT \(([\s\S]*?)\) ON TABLE public\.profiles TO anon, authenticated;/,
    )?.[1];
    expect(grant).toBeTruthy();
    for (const privateColumn of [
      "phone",
      "whatsapp",
      "telefone",
      "contact_email",
      "street",
      "active_ride_id",
    ]) {
      expect(grant).not.toMatch(new RegExp(`\\b${privateColumn}\\b`));
    }
  });

  it("brokers private profiles and consented contacts with a verified actor", () => {
    const edge = read("supabase/functions/profile-rpc/index.ts");
    const broker = read("src/core/profiles/services/ProfileRpcService.ts");

    for (const signature of [
      "public.profile_rpc_get_accessible_profiles(UUID, UUID[], UUID, TEXT)",
      "public.profile_rpc_get_visible_contact(UUID, UUID)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
    }
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("p_actor_user_id UUID");
    expect(migration).toContain("COALESCE(v_profile.show_phone, false)");
    expect(migration).toContain("COALESCE(v_profile.show_contact_email, false)");
    expect(edge).toContain('supabaseAdmin.rpc("profile_rpc_get_accessible_profiles"');
    expect(edge).toContain('supabaseAdmin.rpc("profile_rpc_get_visible_contact"');
    expect(edge).toContain("p_actor_user_id: auth.userId");
    expect(edge).not.toMatch(/p_actor_user_id:\s*params\./);
    expect(broker).toContain('"getAccessibleProfiles"');
    expect(broker).toContain('"getVisibleContact"');
    expect(tightening).toContain("p_profile_ids IS NULL AND p_target_user_id IS NULL");
    expect(tightening).toContain("pm.role IN ('owner', 'admin')");
    expect(edge).toContain("profileIds or targetUserId is required");
  });

  it("excludes suspended identities from every public profile projection", () => {
    expect(tightening).toContain("COALESCE(is_suspended, false) = false");
    expect(tightening).toContain("COALESCE(p.is_suspended, false) = false");
  });

  it("projects only the territorial level consented by the profile", () => {
    expect(locationBoundary).toContain(
      "REVOKE SELECT (location_id, main_territory_location_id)",
    );
    expect(locationBoundary).toContain(
      "WHEN p.public_location_visibility = 'district' THEN t.district_id",
    );
    expect(locationBoundary).toContain(
      "WHEN p.public_location_visibility = 'city_only' THEN t.city_id",
    );
    expect(locationBoundary).not.toContain("p.location_id,");
    expect(hiddenLocationBoundary).toContain(
      "WHEN p.public_location_visibility IN ('city_only', 'district') THEN t.city_name",
    );
    expect(hiddenLocationBoundary).toContain(
      "WHEN p.public_location_visibility IN ('city_only', 'district') THEN t.state_code",
    );
    expect(hiddenLocationBoundary).not.toContain("t.city_name AS public_city");
    expect(hiddenLocationBoundary).not.toContain("t.state_code AS state");
    expect(publicTerritoryBoundary).toContain(
      "-- security-authority: public-rpc public.profile_public_territory_projection",
    );
    expect(publicTerritoryBoundary).toContain("SECURITY DEFINER");
    expect(publicTerritoryBoundary).toContain("SET search_path = public, pg_temp");
    expect(publicTerritoryBoundary).toContain("COALESCE(p.is_suspended, false) = false");
    expect(publicTerritoryBoundary).toContain(
      "LEFT JOIN LATERAL public.profile_public_territory_projection(p.id)",
    );
    expect(publicTerritoryBoundary).toContain("WITH (security_invoker = true)");
    expect(publicTerritoryBoundary).toContain(
      "REVOKE ALL ON FUNCTION public.profile_public_territory_projection(UUID)",
    );
  });

  it("keeps contact data out of generic public classified read models", () => {
    const readModel = read("src/core/classifieds/services/classifieds.read-model.ts");
    const types = read("src/core/classifieds/services/types.ts");
    const mapper = read("src/core/classifieds/services/classifieds.mappers.ts");

    for (const source of [readModel, types, mapper]) {
      expect(source).not.toContain("seller_phone");
      expect(source).not.toContain("seller_whatsapp");
    }
    expect(readModel).not.toMatch(/seller:profiles![\s\S]*?\b(phone|whatsapp)\b/);
  });

  it("keeps private active-profile reads behind the authenticated broker", () => {
    const queries = read("src/core/profiles/services/profile.queries.ts");
    const adminQueries = read(
      "src/core/profiles/services/profile.admin-user-queries.ts",
    );

    expect(queries).not.toMatch(/\.from<Profile>\(TABLE\)[\s\S]*?\.select\(["']\*["']\)/);
    expect(queries).toContain("const profiles = await getProfilesByUserId(targetUserId)");
    expect(queries).toContain("PUBLIC_PROFILE_VIEW");
    expect(adminQueries).toContain("export async function getSuspendedUsers");
    expect(adminQueries).toContain("ProfileRpcService.getAccessibleProfiles<UserListRow[]>");
    expect(adminQueries).not.toMatch(
      /\.from\(TABLE\)[\s\S]{0,300}\.select\([\s\S]*?suspension_reason/,
    );

    const multiProfile = read(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const multiProfileRuntime = read(
      "src/core/profiles/services/multi-profile/runtimeProfileService.ts",
    );
    expect(multiProfile).not.toContain("selectLooseRows<Profile>('profiles'");
    expect(multiProfileRuntime).not.toContain('selectLooseRows<Profile>("profiles"');
    expect(multiProfile).toContain("ProfileRpcService.getAccessibleProfiles<Profile[]>");
    expect(multiProfileRuntime).toContain(
      "ProfileRpcService.getAccessibleProfiles<Profile[]>",
    );
  });
});
