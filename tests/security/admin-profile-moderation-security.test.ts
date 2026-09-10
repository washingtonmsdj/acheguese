import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin profile moderation authority", () => {
  it("routes suspend and unsuspend through the authenticated admin broker", () => {
    const edge = read("supabase/functions/admin-suspend-profile/index.ts");
    const service = read("src/core/admin/services/AdminUserService.ts");
    const multiProfileAdmin = read(
      "src/core/profiles/services/multi-profile/adminService.ts",
    );

    expect(edge).toContain("requireAdmin(req)");
    expect(edge).toContain("admin_profile_rpc_set_suspension");
    expect(edge).toContain("p_actor_user_id: authResult.userId");
    expect(edge).toContain('body.action === "suspend"');
    expect(edge).toContain('target_kind');
    expect(edge).toContain('suspended_until');

    expect(service).toContain('"admin-suspend-profile"');
    expect(service).toContain('action: params.suspended ? "suspend" : "unsuspend"');
    expect(service).toContain('targetKind: "profile"');
    expect(service).toContain('targetKind: "user"');
    expect(service).not.toMatch(
      /\.from\(\s*["']profiles["']\s*\)[\s\S]{0,220}\.update\(/,
    );

    expect(multiProfileAdmin).toContain('"admin-suspend-profile"');
    expect(multiProfileAdmin).toContain('target_kind: "profile"');
    expect(multiProfileAdmin).not.toContain("buildSupabaseFunctionUrl");
  });

  it("revalidates admin authority and audits every affected profile in Postgres", () => {
    const migration = read(
      "supabase/migrations/20260910001000_broker_admin_profile_suspension_g36.sql",
    );

    expect(migration).toContain("private.admin_set_profile_suspension");
    expect(migration).toContain("private.is_admin_from_roles(p_actor_user_id)");
    expect(migration).toContain("p_target_kind NOT IN ('profile', 'user')");
    expect(migration).toContain("Suspension reason is required");
    expect(migration).toContain("Suspension expiry must be in the future");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("INSERT INTO public.profile_audit_log");
    expect(migration).toContain("CASE WHEN p_suspended THEN 'suspended' ELSE 'unsuspended' END");
    expect(migration).toContain("public.admin_profile_rpc_set_suspension");

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.admin_profile_rpc_set_suspension",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");

    // Expand/contract: legacy RPC remains until the new Edge is proven live.
    expect(migration).not.toContain("DROP FUNCTION public.suspend_profile");

    const contract = read(
      "supabase/migrations/20260910002000_retire_legacy_suspend_profile_g36.sql",
    );
    expect(contract).toContain(
      "DROP FUNCTION IF EXISTS public.suspend_profile(uuid, uuid, text)",
    );
  });
});
