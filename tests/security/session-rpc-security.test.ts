import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("session rpc broker security", () => {
  it("routes p_user_id-sensitive session/profile RPCs through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/session-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/session/services/SessionRpcService.ts");
    const sessionService = readProjectFile("src/core/session/services/SessionService.ts");
    const profileQueries = readProjectFile("src/core/profiles/services/profile.queries.ts");
    const profileService = readProjectFile("src/core/profiles/services/ProfileService.ts");
    const mfaService = readProjectFile("src/core/auth/services/MFAService.ts");
    const sessionSecurityService = readProjectFile(
      "src/core/session/services/SessionSecurityService.ts",
    );

    expect(config).toContain("[functions.session-rpc]");
    expect(config).toMatch(/\[functions\.session-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("get_active_profile"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("switch_active_profile"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("check_user_mfa_required"');
    expect(edgeFunction).not.toContain('.from("user_sessions")');
    expect(edgeFunction).toContain('const scope = exceptCurrent ? "others" : "global"');
    expect(edgeFunction).toContain("supabaseAdmin.auth.admin.signOut(token, scope)");
    expect(edgeFunction).toContain("p_user_id: userId");
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("revoke_user_session"');
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("revoke_all_user_sessions"');
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("update_session_activity"');

    expect(broker).toContain('const FUNCTION_NAME = "session-rpc"');
    expect(broker).not.toContain("p_user_id");

    expect(sessionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_active_profile/);
    expect(sessionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']switch_active_profile/);
    expect(profileQueries).not.toMatch(/callRPC\(\s*["']get_active_profile/);
    expect(profileService).not.toMatch(/callRPC\(\s*["']switch_active_profile/);
    expect(mfaService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']check_user_mfa_required/);
    expect(sessionSecurityService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']revoke_user_session/);
    expect(sessionSecurityService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']revoke_all_user_sessions/);
    expect(sessionSecurityService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']update_session_activity/);
  });

  it("revokes direct browser execution of the underlying SECURITY DEFINER RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707201023_route_session_profile_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.get_active_profile(uuid)",
      "public.switch_active_profile(uuid, uuid)",
      "public.check_user_mfa_required(uuid)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    const revocationMigration = readProjectFile(
      "supabase/migrations/20260707205315_route_session_revocation_through_session_rpc.sql",
    );

    for (const signature of [
      "public.revoke_user_session(uuid, text)",
      "public.revoke_all_user_sessions(uuid, boolean, text)",
    ]) {
      expect(revocationMigration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(revocationMigration).toContain("FROM PUBLIC, anon, authenticated");
      expect(revocationMigration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(revocationMigration).toContain("TO service_role");
    }

    const privacySessionMigration = readProjectFile(
      "supabase/migrations/20260707212504_route_privacy_session_rpcs_through_edge_functions.sql",
    );

    expect(privacySessionMigration).toContain(
      "REVOKE ALL ON FUNCTION public.update_session_activity(text)",
    );
    expect(privacySessionMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(privacySessionMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.update_session_activity(text)",
    );
    expect(privacySessionMigration).toContain("TO service_role");
  });
});
