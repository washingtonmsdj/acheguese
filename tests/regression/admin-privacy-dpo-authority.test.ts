import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const migration = read(
  "supabase/migrations/20260916103200_add_admin_privacy_request_authority.sql",
);
const broker = read("supabase/functions/admin-privacy-rpc/index.ts");
const config = read("supabase/config.toml");
const authPolicy = read(
  "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
);

describe("admin privacy request authority", () => {
  it("keeps all privileged database functions service-role only", () => {
    for (const fn of [
      "admin_list_privacy_subject_requests",
      "admin_get_privacy_subject_request",
      "admin_transition_privacy_subject_request",
    ]) {
      expect(migration).toContain(`FUNCTION public.${fn}`);
    }
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("private.is_admin(p_actor_user_id)");
  });

  it("does not expose the message body in bounded list responses", () => {
    const listStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.admin_list_privacy_subject_requests",
    );
    const detailStart = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.admin_get_privacy_subject_request",
    );
    const listBlock = migration.slice(listStart, detailStart);

    expect(listBlock).toContain("p_limit < 1 OR p_limit > 100");
    expect(listBlock).toContain("count(*) OVER() AS total_count");
    expect(listBlock).not.toContain("request.message");
    expect(listBlock).not.toContain("request.subject");
  });

  it("enforces the request lifecycle atomically", () => {
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain(
      "v_current_status = 'received' AND p_next_status IN ('in_review', 'cancelled')",
    );
    expect(migration).toContain("v_current_status = 'in_review'");
    expect(migration).toContain("v_current_status = 'waiting_for_requester'");
    expect(migration).not.toContain("v_current_status = 'completed' AND");
    expect(migration).not.toContain("v_current_status = 'denied' AND");
  });

  it("requires JWT, admin authorization and MFA-aware admin helper", () => {
    expect(config).toMatch(/\[functions\.admin-privacy-rpc\]\s*verify_jwt = true/);
    expect(authPolicy).toContain('"admin-privacy-rpc"');
    expect(broker).toContain("requireAdmin(req, ALLOWED_METHODS)");
    expect(broker).toContain("admin_list_privacy_subject_requests");
    expect(broker).toContain("admin_get_privacy_subject_request");
    expect(broker).toContain("admin_transition_privacy_subject_request");
  });

  it("never bypasses the RPC authority with direct table access", () => {
    expect(broker).not.toContain('.from("privacy_subject_requests")');
    expect(broker).not.toContain("requester_email:");
    expect(broker).not.toContain("message:");
  });
});
