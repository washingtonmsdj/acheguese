import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("profile rpc broker security", () => {
  it("routes privileged profile mutations through authenticated domain brokers", () => {
    const edgeFunction = readProjectFile("supabase/functions/profile-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/profiles/services/ProfileRpcService.ts");
    const profileService = readProjectFile(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const membersService = readProjectFile(
      "src/core/profiles/services/multi-profile/profileMembersService.ts",
    );

    expect(config).toContain("[functions.profile-rpc]");
    expect(config).toMatch(/\[functions\.profile-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain("[89ab][0-9a-f]{3}-[0-9a-f]{12}");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('"createPersonal"');
    expect(edgeFunction).toContain('"profile_rpc_create_personal"');
    expect(edgeFunction).not.toContain('createProfile: true');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_create_business"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_update_business"');
    expect(edgeFunction).toContain('"profile_rpc_deactivate_business"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_create_professional"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_update_professional_data"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_deactivate_professional"');
    expect(edgeFunction).toContain("sanitizeProfessionalPatch");
    expect(edgeFunction).toContain("location_id cannot be cleared");
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_update_profile_handle"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_delete_profile"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_transfer_profile_ownership"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_invite_profile_member_by_email"');
    expect(edgeFunction).toContain("p_actor_user_id: auth.userId");
    expect(edgeFunction).not.toMatch(/p_actor_user_id:\s*params\./);

    expect(broker).toContain('const FUNCTION_NAME = "profile-rpc"');
    expect(broker).toContain('this.invoke<TResult>("createPersonal"');
    expect(broker).toContain('this.invoke<TResult>("createBusiness"');
    expect(broker).toContain('this.invoke<TResult>("updateBusiness"');
    expect(broker).toContain('this.invoke<TResult>("deactivateBusiness"');
    expect(broker).toContain('this.invoke<TResult>("createProfessional"');
    expect(broker).toContain('this.invoke<TResult>("updateProfessionalData"');
    expect(broker).toContain('this.invoke<TResult>("deactivateProfessional"');
    expect(profileService).not.toContain("ProfileRpcService.createProfile");
    expect(profileService).toContain("ProfileRpcService.updateHandle");
    expect(profileService).toContain("ProfileRpcService.deleteProfile");
    expect(profileService).toContain("ProfileRpcService.transferOwnership");
    expect(membersService).toContain("ProfileRpcService.inviteMemberByEmail");

    const professionalLifecycle = readProjectFile(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );
    const professionalExtension = readProjectFile(
      "src/core/profiles/services/multi-profile/professionalService.ts",
    );

    expect(professionalLifecycle).toContain("ProfileRpcService.createProfessional");
    expect(professionalLifecycle).toContain("ProfileRpcService.updateProfessionalData");
    expect(professionalLifecycle).toContain("ProfileRpcService.deactivateProfessional");
    expect(professionalExtension).toContain("ProfileRpcService.updateProfessionalData");

    for (const source of [professionalLifecycle, professionalExtension]) {
      expect(source).not.toMatch(
        /\.from(?:<[^>]+>)?\(\s*["']professional_data["']\s*\)[\s\S]{0,260}\.(?:insert|update|delete)\(/,
      );
    }

    for (const source of [profileService, membersService]) {
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']create_profile_with_extension/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']update_profile_handle/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']delete_profile/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']transfer_profile_ownership/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']invite_profile_member_by_email/);
    }
  });

  it("revokes direct browser execution of backing profile RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707232826_route_profile_mutation_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.create_profile_with_extension(text, text, text, text, text, jsonb)",
      "public.update_profile_handle(uuid, text)",
      "public.delete_profile(uuid)",
      "public.transfer_profile_ownership(uuid, uuid)",
      "public.invite_profile_member_by_email(uuid, text, text)",
      "public.profile_rpc_create_profile_with_extension(uuid, text, text, text, text, text, jsonb)",
      "public.profile_rpc_update_profile_handle(uuid, uuid, text)",
      "public.profile_rpc_delete_profile(uuid, uuid)",
      "public.profile_rpc_transfer_profile_ownership(uuid, uuid, uuid)",
      "public.profile_rpc_invite_profile_member_by_email(uuid, uuid, text, text)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    expect(migration).toContain("p_actor_user_id uuid");
    expect(migration).toContain("private.profile_create_profile_with_extension");
    expect(migration).toContain("private.profile_invite_member_by_email");
  });

  it("server-owns professional_data mutations without premature table-grant cutover", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909214000_server_own_professional_data_mutations_g35.sql",
    );

    for (const signature of [
      "public.profile_rpc_create_professional",
      "public.profile_rpc_update_professional_data",
      "public.profile_rpc_deactivate_professional",
    ]) {
      expect(migration).toContain(signature);
    }

    expect(migration).toContain("private.profile_patch_professional_data");
    expect(migration).toContain("aa_enforce_professional_slug_policy");
    expect(migration).toContain("professional_slug_cooldown_active");
    expect(migration).toContain("reserved_professional_slug");
    expect(migration).toContain("professional_data_ensure_stats");
    expect(migration).toContain("ON CONFLICT (profile_id) DO NOTHING");
    expect(migration).toContain("Unsupported professional field:");
    expect(migration).toContain("location_id cannot be cleared");
    expect(migration).toContain("Compatibility window");

    expect(migration).not.toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_data",
    );
    expect(migration).not.toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats",
    );
  });

  it("enforces exactly one professional extension per Profile", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909215500_enforce_unique_professional_profile_extension_g35.sql",
    );

    expect(migration).toContain("tmp_professional_dedupe");
    expect(migration).toContain("professional_duplicate_has_operational_references");
    expect(migration).toContain("professional_duplicate_contact_conflict");
    expect(migration).toContain("UPDATE private.entity_contact_channels");
    expect(migration).toContain("DELETE FROM public.professional_data");
    expect(migration).toContain("professional_data_profile_id_uidx");
    expect(migration).toContain("professional_data_profile_id_key");
    expect(migration).toContain("UNIQUE USING INDEX");
    expect(migration).not.toContain("9299019a-0af0-4892-8226-7d1e3d9f0c36");
    expect(migration).not.toContain("d4fcd570-ba34-4624-ba90-4190767c6784");
  });

  it("brokers owner profile edits and separates admin/mobility authorities", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909222500_broker_owned_profile_self_service_g36.sql",
    );
    const edge = readProjectFile("supabase/functions/profile-rpc/index.ts");
    const broker = readProjectFile("src/core/profiles/services/ProfileRpcService.ts");
    const profileService = readProjectFile("src/core/profiles/services/ProfileService.ts");
    const identityCommand = readProjectFile(
      "src/core/profiles/services/profile.identity.commands.ts",
    );
    const profileMutations = readProjectFile(
      "src/core/profiles/services/profile.mutations.ts",
    );
    const multiProfile = readProjectFile(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const profileTypes = readProjectFile("src/core/profiles/services/types.ts");
    const adminActions = readProjectFile(
      "src/modules/admin/components/user-detail/UserActionsCard.tsx",
    );
    const adminSuspend = readProjectFile(
      "src/modules/admin/components/user-detail/SuspendUserDialog.tsx",
    );
    const adminDetail = readProjectFile(
      "src/modules/admin/hooks/useAdminUserDetail.ts",
    );
    const mobilityMutation = readProjectFile(
      "src/core/mobility/services/mobility.mutations.ts",
    );
    const mobilityRuntime = readProjectFile(
      "src/core/mobility/services/MobilityRuntimeService.ts",
    );

    expect(edge).toContain('"updateOwnedProfile"');
    expect(edge).toContain('"clearExpiredSuspension"');
    expect(edge).toContain("sanitizeOwnedProfilePatch");
    expect(edge).toContain('supabaseAdmin.rpc("profile_rpc_update_owned_profile"');
    expect(edge).toContain('"profile_rpc_clear_expired_suspension"');
    expect(broker).toContain('this.invoke<TResult>("updateOwnedProfile"');
    expect(broker).toContain('this.invoke<TResult>("clearExpiredSuspension"');

    expect(profileService).toContain("ProfileRpcService.updateOwnedProfile");
    expect(profileService).toContain("ProfileRpcService.clearExpiredSuspension");
    expect(profileService).not.toContain("updateProfileDirect");
    expect(profileService).not.toContain("updatePrivacySettingsDirect");
    expect(profileService).not.toContain("suspendUserMutation");
    expect(identityCommand).toContain("updateOwnedProfile");
    expect(identityCommand).not.toContain("updateProfileDirect");

    expect(profileMutations).toContain("ProfileRpcService.updateOwnedProfile");
    expect(profileMutations).toContain("ProfileRpcService.deleteProfile");
    expect(profileMutations).toContain("SessionRpcService.switchActiveProfile");
    expect(profileMutations).not.toContain("export async function updateProfileDirect");
    expect(profileMutations).not.toContain("export async function suspendUser");
    expect(profileMutations).not.toContain("setActiveRideId");
    expect(profileMutations).not.toContain("clearActiveRideId");
    expect(profileService).not.toContain("setActiveRideId");
    expect(profileService).not.toContain("clearActiveRideId");

    expect(multiProfile).toContain("ProfileRpcService.updateOwnedProfile");
    expect(multiProfile).not.toContain("updateLooseRows");

    const ownedType = profileTypes.match(
      /export interface OwnedProfileUpdatePayload \{[\s\S]*?\n\}/,
    )?.[0] ?? "";
    expect(ownedType).toContain("username?: string");
    expect(ownedType).toContain("share_activity_default?: boolean");
    for (const forbidden of [
      "suspended",
      "suspension_reason",
      "is_verified",
      "verified?:",
      "active_ride_id",
      "metadata",
      "community_reputation_score",
    ]) {
      expect(ownedType).not.toContain(forbidden);
    }

    expect(adminActions).toContain("AdminUserService.verifyUser");
    expect(adminActions).toContain("AdminUserService.unsuspendProfile");
    expect(adminActions).not.toContain("profileService.updateProfile");
    expect(adminSuspend).toContain("AdminUserService.suspendProfile");
    expect(adminSuspend).not.toContain("profileService.updateProfile");
    expect(adminDetail).toContain("verified: profileData.verified");
    expect(adminDetail).not.toContain("profileData.is_verified_resident");

    for (const source of [mobilityMutation, mobilityRuntime]) {
      expect(source).toContain("profileService.clearExpiredSuspension(profileId)");
      expect(source).not.toMatch(
        /profileService\.updateProfile\(profileId,[\s\S]{0,180}suspended/,
      );
    }

    expect(migration).toContain("private.profile_patch_owned");
    expect(migration).toContain("profile_rpc_update_owned_profile");
    expect(migration).toContain("profile_rpc_clear_expired_suspension");
    expect(migration).toContain("Unsupported profile field:");
    expect(migration).toContain("Username changes are personal-profile only");
    expect(migration).toContain("Username cooldown active");
    expect(migration).toContain("app.profile_actor_user_id");
    expect(migration).toContain("user_requested");
    expect(migration).toContain("suspended_until <= now()");
    expect(migration).toContain("Compatibility window");

    expect(migration).not.toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles",
    );
  });

  it("server-owns the general Business lifecycle without duplicating Network authority", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909234000_broker_owned_business_lifecycle_g36.sql",
    );
    const edge = readProjectFile("supabase/functions/profile-rpc/index.ts");
    const broker = readProjectFile("src/core/profiles/services/ProfileRpcService.ts");
    const business = readProjectFile("src/core/business/services/business.mutations.ts");
    const multiProfile = readProjectFile(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const profileMutations = readProjectFile(
      "src/core/profiles/services/profile.mutations.ts",
    );

    for (const signature of [
      "public.profile_rpc_create_business",
      "public.profile_rpc_update_business",
      "public.profile_rpc_deactivate_business",
    ]) {
      expect(migration).toContain(signature);
    }

    expect(migration).toContain("business_data_profile_id_uidx");
    expect(migration).toContain("business_data_profile_id_key");
    expect(migration).toContain("business_data_ensure_stats");
    expect(migration).toContain("ON CONFLICT (profile_id) DO UPDATE");
    expect(migration).toContain("private.business_slug_is_reserved");
    expect(migration).toContain("Reserved business slug");
    expect(migration).toContain("Address is not owned by actor");
    expect(migration).toContain("Address territory mismatch");
    expect(migration).toContain("Unsupported business field:");
    expect(migration).toContain("public.contact_rpc_patch_owned_channels");
    expect(migration).toContain("DELETE FROM public.business_hours");
    expect(migration).toContain("private.profile_patch_owned");
    expect(migration).toContain("Compatibility window");

    expect(edge).toContain('"createBusiness"');
    expect(edge).toContain('"updateBusiness"');
    expect(edge).toContain('"deactivateBusiness"');
    expect(edge).toContain("sanitizeBusinessPatch");
    expect(edge).toContain("sanitizeContactChannels");
    expect(edge).toContain("sanitizeBusinessHours");

    expect(broker).toContain('this.invoke<TResult>("createBusiness"');
    expect(broker).toContain('this.invoke<TResult>("updateBusiness"');
    expect(broker).toContain('this.invoke<TResult>("deactivateBusiness"');

    expect(business).toContain("ProfileRpcService.createBusiness");
    expect(business).toContain("ProfileRpcService.updateBusiness");
    expect(business).toContain("ProfileRpcService.deactivateBusiness");
    expect(business).toContain("owner_user_id: actorUserId");
    expect(business).toContain("pertence ao NetworkService");
    expect(business).not.toContain("BusinessHoursService");
    expect(business).not.toContain("ProfileMembersService");
    expect(business).not.toContain("profileService.createProfile");
    expect(business).not.toContain("profileService.updateProfile");
    expect(business).not.toContain("profileService.deleteProfile");
    expect(business).not.toContain("EntityContactService.patchOwnedChannels");
    expect(business).not.toMatch(
      /\.from(?:<[^>]+>)?\(\s*["']business_data["']\s*\)[\s\S]{0,260}\.(?:insert|update|delete)\(/,
    );
    expect(business).not.toMatch(
      /\.from(?:<[^>]+>)?\(\s*["']business_stats["']\s*\)[\s\S]{0,260}\.(?:insert|update|delete)\(/,
    );

    expect(profileMutations).toContain(
      "Use BusinessService.createBusiness para criar empresas",
    );
    expect(multiProfile).not.toContain("ProfileRpcService.createProfile");
  });

  it("separates Personal and Driver creation by domain authority", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260910003000_domain_owned_profile_creation_g36.sql",
    );
    const profileEdge = readProjectFile("supabase/functions/profile-rpc/index.ts");
    const profileBroker = readProjectFile("src/core/profiles/services/ProfileRpcService.ts");
    const profileMutations = readProjectFile(
      "src/core/profiles/services/profile.mutations.ts",
    );
    const multiProfile = readProjectFile(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const mobilityEdge = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const mobilityBroker = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const driverCreate = readProjectFile(
      "src/modules/mobility/hooks/useDriverCreateMultiProfile.ts",
    );
    const driverRegistration = readProjectFile(
      "src/modules/mobility/utils/driverRegistration.ts",
    );
    const driverIdentity = readProjectFile(
      "src/core/mobility/hooks/useDriverProfileIdentity.ts",
    );

    expect(migration).toContain("private.profile_create_personal");
    expect(migration).toContain("public.profile_rpc_create_personal");
    expect(migration).toContain("public.mobility_rpc_create_driver_profile");
    expect(migration).toContain("private.mobility_ensure_admin_driver_profile");
    expect(migration).toContain("public.mobility_rpc_ensure_admin_driver_profile");
    expect(migration).toContain("private.is_admin_from_roles(p_actor_user_id)");
    expect(migration).toContain("ON CONFLICT (profile_id) DO NOTHING");
    expect(migration).toContain("Compatibility window");

    for (const signature of [
      "public.profile_rpc_create_personal",
      "public.mobility_rpc_create_driver_profile",
      "public.mobility_rpc_ensure_admin_driver_profile",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain("TO service_role");
    }

    expect(profileEdge).toContain('createPersonal: true');
    expect(profileEdge).toContain('"profile_rpc_create_personal"');
    expect(profileEdge).not.toContain('createProfile: true');
    expect(profileBroker).toContain('this.invoke<TResult>("createPersonal"');
    expect(profileBroker).not.toContain('"createProfile"');
    expect(profileMutations).toContain("ProfileRpcService.createPersonal");
    expect(profileMutations).not.toMatch(
      /\.from(?:<[^>]+>)?\(\s*["']profiles["']\s*\)[\s\S]{0,260}\.insert\(/,
    );
    expect(multiProfile).not.toContain("ProfileRpcService.createProfile");

    expect(mobilityEdge).toContain("createDriverProfile: true");
    expect(mobilityEdge).toContain("ensureAdminDriverProfile: true");
    expect(mobilityEdge).toContain("sanitizeDriverRegistrationExtension");
    expect(mobilityEdge).toContain('"mobility_rpc_create_driver_profile"');
    expect(mobilityEdge).toContain('"mobility_rpc_ensure_admin_driver_profile"');
    expect(mobilityBroker).toContain('"createDriverProfile"');
    expect(mobilityBroker).toContain('"ensureAdminDriverProfile"');
    expect(driverCreate).toContain("MobilityRpcService.createDriverProfile");
    expect(driverCreate).not.toContain("MultiProfileService.createProfile");
    expect(driverRegistration).not.toContain("documents_verified: false");
    expect(driverRegistration).not.toContain('background_check_status: "pending"');
    expect(driverRegistration).toContain("can_do_delivery: input.capabilities?.can_do_delivery ?? false");
    expect(driverRegistration).toContain("can_do_rides: input.capabilities?.can_do_rides ?? true");
    expect(driverIdentity).toContain("MobilityRpcService.ensureAdminDriverProfile");
    expect(driverIdentity).not.toContain("createAdminDriverProfile");
  });
});
