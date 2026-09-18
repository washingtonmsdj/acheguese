import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin site settings RPC security", () => {
  it("routes privileged site settings RPCs through an admin-only Edge Function", () => {
    const service = readProjectFile("src/core/admin/services/SiteSettingsService.ts");
    const edgeFunction = readProjectFile("supabase/functions/admin-site-settings-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707141904_route_admin_site_settings_rpcs_through_edge_function.sql",
    );
    const tableReadRetirement = readProjectFile(
      "supabase/migrations/20260918122231_retire_public_site_settings_table_read.sql",
    );
    const publicRpcRetirement = readProjectFile(
      "supabase/migrations/20260918122241_retire_public_get_site_setting_rpc.sql",
    );

    expect(service).toContain('"admin-site-settings-rpc"');
    expect(service).toContain("invokeAdminSiteSettingsRpc");
    expect(service).not.toContain("siteSettingsRpc");
    expect(service).not.toContain('"get_site_setting"');

    expect(edgeFunction).toContain("requireAdmin(req)");
    expect(edgeFunction).toContain("ACTIONS");
    expect(edgeFunction).toContain('.from("site_settings")');
    expect(edgeFunction).toContain("updated_by: updatedByUserId");
    expect(edgeFunction).toContain("ALLOWED_SETTING_KEYS");
    expect(edgeFunction).toContain("cleanSettingValue");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 80, 60_000)");

    expect(config).toContain("[functions.admin-site-settings-rpc]");
    expect(config).toContain("verify_jwt = true");

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_all_site_settings()");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.upsert_site_setting(TEXT, JSONB, TEXT)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");

    expect(tableReadRetirement).toContain(
      'DROP POLICY IF EXISTS "site_settings_select_public"',
    );
    expect(tableReadRetirement).toContain(
      "REVOKE SELECT (",
    );
    expect(tableReadRetirement).toContain("FROM anon, authenticated");

    expect(publicRpcRetirement).toContain(
      "REVOKE ALL ON FUNCTION public.get_site_setting(text)",
    );
    expect(publicRpcRetirement).toContain("FROM PUBLIC, anon, authenticated");
    expect(publicRpcRetirement).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_site_setting(text)",
    );
    expect(publicRpcRetirement).toContain("TO service_role");
  });
});
