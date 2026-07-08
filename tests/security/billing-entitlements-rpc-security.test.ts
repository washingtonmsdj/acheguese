import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("billing entitlements rpc broker security", () => {
  it("routes p_user_id-sensitive billing entitlement RPCs through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/billing-entitlements-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/billing/services/BillingEntitlementsRpcService.ts");
    const subscriptionService = readProjectFile("src/core/billing/services/SubscriptionService.ts");

    expect(config).toContain("[functions.billing-entitlements-rpc]");
    expect(config).toMatch(/\[functions\.billing-entitlements-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("get_user_active_subscription"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("user_has_plan"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("user_has_feature"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("get_user_entitlement_limit"');
    expect(edgeFunction).toContain("p_user_id: userId");
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);

    expect(broker).toContain('const FUNCTION_NAME = "billing-entitlements-rpc"');
    expect(broker).not.toContain("p_user_id");

    expect(subscriptionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_user_active_subscription/);
    expect(subscriptionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']user_has_plan/);
    expect(subscriptionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']user_has_feature/);
    expect(subscriptionService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_user_entitlement_limit/);
  });

  it("revokes direct browser execution of the underlying SECURITY DEFINER RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707204323_route_billing_entitlements_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.get_user_active_subscription(uuid)",
      "public.user_has_plan(uuid, text)",
      "public.user_has_feature(uuid, text)",
      "public.get_user_entitlement_limit(uuid, text)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }
  });
});
