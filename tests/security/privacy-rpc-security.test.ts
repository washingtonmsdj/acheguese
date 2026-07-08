import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("privacy rpc broker security", () => {
  it("routes consent writes through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/privacy-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/privacy/services/PrivacyRpcService.ts");
    const consentService = readProjectFile("src/core/privacy/services/ConsentService.ts");
    const settingsService = readProjectFile("src/core/privacy/services/PrivacySettingsService.ts");

    expect(config).toContain("[functions.privacy-rpc]");
    expect(config).toMatch(/\[functions\.privacy-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("record_consent"');
    expect(edgeFunction).toContain("p_user_id: userId");
    expect(edgeFunction).toContain("CONSENT_TYPES");
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);

    expect(broker).toContain('const FUNCTION_NAME = "privacy-rpc"');
    expect(broker).not.toContain("p_user_id");

    expect(consentService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']record_consent/);
    expect(settingsService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']record_consent/);
  });

  it("revokes direct browser execution of the consent RPC and fixes active consent uniqueness", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707212504_route_privacy_session_rpcs_through_edge_functions.sql",
    );

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)",
    );
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS unique_active_consent");
    expect(migration).toContain("WHERE revoked_at IS NULL");
  });
});
