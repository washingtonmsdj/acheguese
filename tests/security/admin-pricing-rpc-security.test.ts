import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin pricing RPC security", () => {
  it("routes privileged pricing RPCs through an admin-only Edge Function", () => {
    const service = readProjectFile("src/core/pricing/services/PricingService.ts");
    const edgeFunction = readProjectFile("supabase/functions/admin-pricing-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707140908_route_admin_pricing_rpcs_through_edge_function.sql",
    );

    expect(service).toContain('"admin-pricing-rpc"');
    expect(service).toContain("invokeAdminPricingRpc");
    expect(service).not.toMatch(/this\.db\.rpc<[^>]+>\(\s*["']activate_pricing_rule/);
    expect(service).not.toMatch(/this\.db\.rpc<[^>]+>\(\s*["']create_active_pricing_rule/);

    expect(edgeFunction).toContain("requireAdmin(req)");
    expect(edgeFunction).toContain("ACTION_TO_RPC");
    expect(edgeFunction).toContain("activate_pricing_rule");
    expect(edgeFunction).toContain("create_active_pricing_rule");
    expect(edgeFunction).toContain("assertProfileBelongsToUser");
    expect(edgeFunction).toContain("normalized.performedBy");
    expect(edgeFunction).toContain("p_is_active: true");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 60, 60_000)");

    expect(config).toContain("[functions.admin-pricing-rpc]");
    expect(config).toContain("verify_jwt = true");

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.activate_pricing_rule(UUID, UUID)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.create_active_pricing_rule(");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
