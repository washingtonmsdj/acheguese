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

    expect(service).toContain('"admin-site-settings-rpc"');
    expect(service).toContain("invokeAdminSiteSettingsRpc");
    expect(service).not.toMatch(/siteSettingsRpc\.rpc<[^>]+>\(\s*["']get_all_site_settings/);
    expect(service).not.toMatch(/siteSettingsRpc\.rpc<[^>]+>\(\s*["']upsert_site_setting/);
    expect(service).toContain('"get_site_setting"');

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
  });
});
