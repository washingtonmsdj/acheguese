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
const service = read("src/core/admin/services/AdminPrivacyRequestsService.ts");
const page = read("src/modules/admin/pages/AdminPrivacyRequests.tsx");
const lazyImports = read("src/app/routes/adminLazyImports.ts");
const routes = read("src/app/routes/sections/AdminRoutes.tsx");
const navigation = read("src/modules/admin/config/adminNavigation.config.ts");

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
    expect(broker).toContain("getCorsHeaders(ALLOWED_METHODS, req)");
    expect(broker).toContain("admin_list_privacy_subject_requests");
    expect(broker).toContain("admin_get_privacy_subject_request");
    expect(broker).toContain("admin_transition_privacy_subject_request");
  });

  it("audits admin reads and transitions without logging DPO message content", () => {
    expect(broker).toContain("auditLog({");
    expect(broker).toContain('resource: "admin-privacy-rpc"');
    expect(broker).toContain("`admin_privacy_${safeAction}`");
    expect(broker).toContain("getAuditInfo(req)");
    expect(broker).not.toContain("details: { message");
    expect(broker).not.toContain("details: { requester");
  });

  it("never bypasses the RPC authority with direct table access", () => {
    expect(broker).not.toContain('.from("privacy_subject_requests")');
    expect(broker).not.toContain("requester_email:");
    expect(broker).not.toContain("message:");
    expect(service).toContain("invokeSupabaseBroker");
    expect(service).toContain('ADMIN_PRIVACY_RPC_FUNCTION = "admin-privacy-rpc"');
    expect(service).not.toContain("privacy_subject_requests");
    expect(page).not.toContain("privacy_subject_requests");
  });

  it("loads sensitive content only through the individual detail action", () => {
    expect(page).toContain("adminPrivacyRequestsService.listRequests(filters)");
    expect(page).toContain("adminPrivacyRequestsService.getRequest(selectedId!)");
    expect(page).toContain("enabled: Boolean(selectedId)");
    expect(page).toContain("Dados sensíveis deste pedido");
  });

  it("keeps the DPO inbox out of bulk-export flows", () => {
    expect(page).not.toContain("Exportar tudo");
    expect(page).not.toContain("downloadCsv");
    expect(page).not.toContain("text/csv");
    expect(service).not.toContain("exportAll");
  });

  it("registers the queue in lazy routing and canonical admin navigation", () => {
    expect(lazyImports).toContain(
      'import("@/modules/admin/pages/AdminPrivacyRequests")',
    );
    expect(routes).toContain(
      'path="privacidade" element={<P.AdminPrivacyRequests />}',
    );
    expect(navigation).toContain('to: "/admin/privacidade"');
    expect(navigation).toContain('label: "Privacidade e LGPD"');
    expect(navigation).toContain('section: "moderacao"');
  });
});
