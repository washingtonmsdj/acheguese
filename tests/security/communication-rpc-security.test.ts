import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("communication RPC security", () => {
  it("routes communication mutation RPCs through an authenticated Edge Function", () => {
    const service = readProjectFile(
      "src/core/communication-territorial/services/CommunicationTerritorialService.ts",
    );
    const edgeFunction = readProjectFile("supabase/functions/communication-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707145342_route_communication_mutation_rpcs_through_edge_function.sql",
    );

    expect(service).toContain('"communication-rpc"');
    expect(service).toContain("invokeCommunicationRpc");
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']request_communication_channel/);
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']create_communication_publication/);
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']update_communication_publication_draft/);
    expect(service).not.toMatch(/supabase\.rpc\(\s*["']publish_communication_publication/);

    expect(edgeFunction).toContain("requireUser");
    expect(edgeFunction).toContain("ACTION_TO_RPC");
    expect(edgeFunction).toContain("request_communication_channel");
    expect(edgeFunction).toContain("create_communication_publication");
    expect(edgeFunction).toContain("update_communication_publication_draft");
    expect(edgeFunction).toContain("publish_communication_publication");
    expect(edgeFunction).toContain("actor_user_id");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 100, 60_000)");

    expect(config).toContain("[functions.communication-rpc]");
    expect(config).toContain("verify_jwt = true");

    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("communication_user_can_manage_channel");
    expect(migration).toContain("actor_user_id_required");
    expect(migration).toContain("DROP FUNCTION IF EXISTS public.publish_communication_publication(uuid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.request_communication_channel(jsonb)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.create_communication_publication(jsonb)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.update_communication_publication_draft(uuid, jsonb)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.publish_communication_publication(uuid, uuid)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
