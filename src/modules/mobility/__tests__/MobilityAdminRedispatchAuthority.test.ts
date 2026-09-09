import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility admin redispatch authority", () => {
  it("keeps admin redispatch behind the authenticated atomic broker", () => {
    const adminService = readProjectFile(
      "src/core/admin/services/AdminMotoboyOperationsService.ts",
    );
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const migration = readProjectFile(
      "supabase/migrations/20260909132019_add_atomic_admin_motoboy_redispatch_g6.sql",
    );

    const redispatchMethod = adminService
      .split("static async redispatch(")[1]
      ?.split("\n  }\n}")[0];

    expect(redispatchMethod).toBeTruthy();
    expect(redispatchMethod).toContain("MobilityRpcService.adminRedispatch");
    expect(redispatchMethod).not.toContain("MobilityService.updateRide(");

    expect(rpcService).toContain('"adminRedispatch"');
    expect(rpcService).toContain("static async adminRedispatch");

    expect(broker).toContain("handleAdminRedispatch");
    expect(broker).toContain("auth.isProjectAdmin");
    expect(broker).toContain('"mobility_admin_redispatch_atomic"');
    expect(broker).toContain('p_changed_by: `admin:${auth.userId}`');

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_admin_redispatch_atomic",
    );
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("UPDATE public.driver_availability");
    expect(migration).toContain("UPDATE public.ride_dispatch_audit");
    expect(migration).toContain("status = 'rejected'");
    expect(migration).toContain("driver_profile_id = NULL");
    expect(migration).toContain("INSERT INTO public.ride_state_audit");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
