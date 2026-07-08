import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin notifications RPC security", () => {
  it("routes admin notification RPCs through an admin-only Edge Function", () => {
    const service = readProjectFile("src/core/admin/services/AdminNotificationsService.ts");
    const edgeFunction = readProjectFile("supabase/functions/admin-notifications-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707134943_route_admin_notifications_rpcs_through_edge_function.sql",
    );

    expect(service).toContain('"admin-notifications-rpc"');
    expect(service).toContain("invokeAdminNotificationsRpc");
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']admin_notifications_/);

    expect(edgeFunction).toContain("requireAdmin(req)");
    expect(edgeFunction).toContain("ACTION_TO_RPC");
    expect(edgeFunction).toContain("admin_notifications_get_settings_stats");
    expect(edgeFunction).toContain("admin_notifications_get_settings_user_ids");
    expect(edgeFunction).toContain("admin_notifications_get_user_settings");
    expect(edgeFunction).toContain("admin_notifications_get_channel_stats");
    expect(edgeFunction).toContain("admin_notifications_get_template_stats");
    expect(edgeFunction).toContain("admin_notifications_get_delivery_audit");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 100, 60_000)");

    expect(config).toContain("[functions.admin-notifications-rpc]");
    expect(config).toContain("verify_jwt = true");

    for (const functionName of [
      "admin_notifications_get_channel_stats",
      "admin_notifications_get_delivery_audit",
      "admin_notifications_get_settings_stats",
      "admin_notifications_get_settings_user_ids",
      "admin_notifications_get_template_stats",
      "admin_notifications_get_user_settings",
    ]) {
      expect(migration).toContain(`'${functionName}'`);
    }

    expect(migration).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role");
  });
});
