import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const intakeMigration = read(
  "supabase/migrations/20260916101000_create_privacy_subject_request_broker.sql",
);
const migration = read(
  "supabase/migrations/20260916103200_add_admin_privacy_request_authority.sql",
);
const piiMinimizationMigration = read(
  "supabase/migrations/20260916113200_minimize_admin_privacy_queue_pii.sql",
);
const historyMigration = read(
  "supabase/migrations/20260916114500_add_privacy_request_event_history.sql",
);
const denyDirectMigration = read(
  "supabase/migrations/20260916115500_explicitly_deny_direct_privacy_ledger_access.sql",
);
const actorIndexMigration = read(
  "supabase/migrations/20260916120500_index_privacy_request_event_actor.sql",
);
const runtimeGrantsMigration = read(
  "supabase/migrations/20260916121200_tighten_privacy_subject_request_runtime_grants.sql",
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
    const historyStart = service.indexOf("export interface AdminPrivacyRequestHistoryEvent");
    const summaryContract = service.slice(summaryStart, historyStart);
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
    expect(historyMigration).toContain("FOR UPDATE");
    expect(historyMigration).toContain(
      "v_current_status = 'received' AND p_next_status IN ('in_review', 'cancelled')",
    );
    expect(historyMigration).toContain("v_current_status = 'in_review'");
    expect(historyMigration).toContain("v_current_status = 'waiting_for_requester'");
    expect(historyMigration).not.toContain("v_current_status = 'completed' AND");
    expect(historyMigration).not.toContain("v_current_status = 'denied' AND");
  });

  it("persists DPO lifecycle history in the same database authority", () => {
    expect(historyMigration).toContain("CREATE TABLE IF NOT EXISTS public.privacy_subject_request_events");
    expect(historyMigration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(historyMigration).toContain("FORCE ROW LEVEL SECURITY");
    expect(historyMigration).toContain("privacy_subject_request_submission_event");
    expect(historyMigration).toContain("'status_changed'");
    expect(historyMigration).toContain("p_actor_user_id");
    expect(historyMigration).toContain("'history', COALESCE((");
    expect(historyMigration).not.toContain("'actor_user_id', event.actor_user_id");
    expect(service).toContain("AdminPrivacyRequestHistoryEvent");
    expect(service).toContain("history: AdminPrivacyRequestHistoryEvent[]");
    expect(page).toContain("Histórico do pedido");
    expect(page).toContain("detail.history.map");
  });

  it("makes direct ledger and history access explicitly fail closed", () => {
    expect(denyDirectMigration).toContain(
      "CREATE POLICY privacy_subject_requests_deny_direct",
    );
    expect(denyDirectMigration).toContain(
      "CREATE POLICY privacy_subject_request_events_deny_direct",
    );
    expect(denyDirectMigration).toContain("FOR ALL");
    expect(denyDirectMigration).toContain("TO PUBLIC");
    expect(denyDirectMigration.match(/USING \(false\)/g)?.length).toBe(2);
    expect(denyDirectMigration.match(/WITH CHECK \(false\)/g)?.length).toBe(2);
  });

  it("reduces direct service-role ledger authority to public intake insert only", () => {
    expect(runtimeGrantsMigration).toContain(
      "REVOKE ALL ON TABLE public.privacy_subject_requests",
    );
    expect(runtimeGrantsMigration).toContain(
      "FROM PUBLIC, anon, authenticated, service_role",
    );
    expect(runtimeGrantsMigration).toContain(
      "GRANT INSERT ON TABLE public.privacy_subject_requests",
    );
    expect(runtimeGrantsMigration).not.toContain("GRANT SELECT");
    expect(runtimeGrantsMigration).not.toContain("GRANT UPDATE");
    expect(runtimeGrantsMigration).not.toContain("GRANT DELETE");
    expect(runtimeGrantsMigration).not.toContain("GRANT TRUNCATE");
    expect(runtimeGrantsMigration).not.toContain("GRANT TRIGGER");
    expect(runtimeGrantsMigration).not.toContain("GRANT REFERENCES");
    expect(historyMigration).toContain(
      "REVOKE ALL ON TABLE public.privacy_subject_request_events",
    );
    expect(historyMigration).toContain("FROM PUBLIC, anon, authenticated, service_role");
  });

  it("keeps every DPO foreign key covered by a leading index in source", () => {
    expect(intakeMigration).toContain(
      "privacy_subject_requests_user_submitted_idx",
    );
    expect(intakeMigration).toContain(
      "ON public.privacy_subject_requests(user_id, submitted_at DESC)",
    );
    expect(historyMigration).toContain(
      "privacy_subject_request_events_request_time_idx",
    );
    expect(historyMigration).toContain(
      "ON public.privacy_subject_request_events(request_id, occurred_at ASC, id ASC)",
    );
    expect(actorIndexMigration).toContain(
      "privacy_subject_request_events_actor_user_idx",
    );
    expect(actorIndexMigration).toContain(
      "ON public.privacy_subject_request_events(actor_user_id)",
    );
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
