import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const migration = read(
  "supabase/migrations/20260916103200_add_admin_privacy_request_authority.sql",
);
const piiMinimizationMigration = read(
  "supabase/migrations/20260916113200_minimize_admin_privacy_queue_pii.sql",
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
    expect(piiMinimizationMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(piiMinimizationMigration).toContain("TO service_role");
    expect(piiMinimizationMigration).toContain("private.is_admin(p_actor_user_id)");
  });

  it("keeps the bounded queue free of direct identifiers and request bodies", () => {
    expect(piiMinimizationMigration).toContain("p_limit < 1 OR p_limit > 100");
    expect(piiMinimizationMigration).toContain("count(*) OVER() AS total_count");
    expect(piiMinimizationMigration).not.toContain("request.requester_name");
    expect(piiMinimizationMigration).not.toContain("request.requester_email");
    expect(piiMinimizationMigration).not.toContain("request.subject");
    expect(piiMinimizationMigration).not.toContain("request.message");

    const summaryStart = service.indexOf("export interface AdminPrivacyRequestSummary");
    const detailStart = service.indexOf("export interface AdminPrivacyRequestDetail");
    const summaryContract = service.slice(summaryStart, detailStart);
    expect(summaryContract).not.toContain("requester_name");
    expect(summaryContract).not.toContain("requester_email");
    expect(page).not.toContain("item.requester_name");
    expect(page).not.toContain("item.requester_email");
    expect(page).toContain("protocolLabel(item.id)");
  });

  it("preserves pagination totals even when the requested page is empty", () => {
    expect(broker).toContain("if (items.length === 0 && page > 1)");
    expect(broker).toContain("p_limit: 1");
    expect(broker).toContain("p_offset: 0");
    expect(page).toContain("if (!listQuery.isFetching && page > totalPages)");
    expect(page).toContain("setPage(totalPages)");
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
    expect(page).toContain("queryClient.removeQueries({");
    expect(page).toContain('queryKey: ["admin-privacy-request", requestId]');
    expect(page).toContain("exact: true");
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
