import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("profile rpc broker security", () => {
  it("routes privileged profile mutations through an authenticated broker", () => {
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
    expect(edgeFunction).toContain('supabaseAdmin.rpc("profile_rpc_create_profile_with_extension"');
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
    expect(broker).toContain('this.invoke<TResult>("createProfessional"');
    expect(broker).toContain('this.invoke<TResult>("updateProfessionalData"');
    expect(broker).toContain('this.invoke<TResult>("deactivateProfessional"');
    expect(profileService).toContain("ProfileRpcService.createProfile");
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
});
