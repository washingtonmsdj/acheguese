import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("delivery rpc broker security", () => {
  it("routes delivery mutations through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/delivery-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile(
      "src/core/mobility/delivery/services/DeliveryRpcService.ts",
    );
    const ssotService = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliverySSOTService.ts",
    );

    expect(config).toContain("[functions.delivery-rpc]");
    expect(config).toMatch(/\[functions\.delivery-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain(".from(\"orders\")");
    expect(edgeFunction).toContain(".from(\"profiles\")");
    expect(edgeFunction).toContain(".from(\"profile_members\")");
    expect(edgeFunction).toContain(".from(\"user_roles\")");
    expect(edgeFunction).toContain("requireOrderActor");
    expect(edgeFunction).toContain("requireCreateOrderActor");
    expect(edgeFunction).toContain("allowCustomer: false");
    expect(edgeFunction).toContain("allowMerchant: true");
    expect(edgeFunction).toContain("allowCourier: true");
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_create_order"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_transition_logistics_status"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_mark_picked_up"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_attach_delivery_proof"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_mark_delivered"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_transition_financial_status"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_report_occurrence"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_resolve_occurrence"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_update_order_notes"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("delivery_update_order_source_metadata"');
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);

    expect(broker).toContain('const FUNCTION_NAME = "delivery-rpc"');
    expect(ssotService).toContain("DeliveryRpcService.invoke");
    expect(ssotService).not.toMatch(/\.rpc(?:<[^>]+>)?\(\s*["']delivery_/);
  });

  it("keeps backing delivery tables read-only to browser roles", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909205630_close_delivery_direct_table_writes_g30.sql",
    );
    const architectureGuard = readProjectFile(
      "tools/architecture/validate-delivery-architecture-boundaries.ts",
    );

    for (const table of [
      "public.orders",
      "public.order_items",
      "public.delivery_occurrences",
    ]) {
      expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE");
      expect(migration).toContain(`ON TABLE ${table}`);
    }

    for (const policy of [
      "orders_insert",
      "orders_update",
      "order_items_insert",
      "delivery_occurrences_insert",
      "delivery_occurrences_update",
    ]) {
      expect(migration).toContain(`DROP POLICY IF EXISTS ${policy}`);
    }

    expect(migration).toContain(
      'CREATE POLICY "Admins can view orders"',
    );
    expect(architectureGuard).toContain("delivery_occurrences");
    expect(architectureGuard).toContain("order_timeline_events");
  });

  it("revokes direct browser execution of backing delivery RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707222343_route_delivery_order_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.delivery_create_order(",
      "public.delivery_transition_logistics_status(",
      "public.delivery_mark_picked_up(",
      "public.delivery_attach_delivery_proof(",
      "public.delivery_mark_delivered(",
      "public.delivery_transition_financial_status(",
      "public.delivery_report_occurrence(",
      "public.delivery_resolve_occurrence(",
      "public.delivery_update_order_notes(",
      "public.delivery_update_order_source_metadata(",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    expect(migration).toContain("delivery-rpc");
  });
});
