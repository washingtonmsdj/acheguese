import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin communication RPC security", () => {
  it("routes privileged communication territorial RPCs through an admin-only Edge Function", () => {
    const service = readProjectFile(
      "src/core/communication-territorial/services/AdminCommunicationTerritorialService.ts",
    );
    const edgeFunction = readProjectFile("supabase/functions/admin-communication-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707143712_route_admin_communication_rpcs_through_edge_function.sql",
    );

    expect(service).toContain('"admin-communication-rpc"');
    expect(service).toContain("invokeAdminCommunicationRpc");
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']admin_approve_communication_channel/);
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']admin_reject_communication_channel_request/);

    expect(edgeFunction).toContain("requireAdmin(req)");
    expect(edgeFunction).toContain("ACTION_TO_RPC");
    expect(edgeFunction).toContain("admin_approve_communication_channel");
    expect(edgeFunction).toContain("admin_reject_communication_channel_request");
    expect(edgeFunction).toContain("admin_user_id: adminUserId");
    expect(edgeFunction).toContain("cleanApprovePayload");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 60, 60_000)");

    expect(config).toContain("[functions.admin-communication-rpc]");
    expect(config).toContain("verify_jwt = true");

    expect(migration).toContain("current_setting('request.jwt.claim.role', true)");
    expect(migration).toContain("admin_user_id_required");
    expect(migration).toContain("DROP FUNCTION IF EXISTS public.admin_reject_communication_channel_request(uuid, text)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.admin_approve_communication_channel(uuid, jsonb)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.admin_reject_communication_channel_request(uuid, text, uuid)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
