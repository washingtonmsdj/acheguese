import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility admin cancellation authority", () => {
  it("routes admin cancellation through the canonical ride transition owner", () => {
    const adminService = readProjectFile(
      "src/core/admin/services/AdminMotoboyOperationsService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const transitionMigration = readProjectFile(
      "supabase/migrations/20260909120726_add_atomic_mobility_ride_transition_command_g6.sql",
    );

    const cancelMethod = adminService
      .split("static async cancelOperational(")[1]
      ?.split("/**\n   * Redispatch")[0];

    expect(cancelMethod).toBeTruthy();
    expect(cancelMethod).toContain("RideOperationalService.transitionTo");
    expect(cancelMethod).toContain("resolveAdminCancellationTarget");
    expect(cancelMethod).not.toContain("MobilityService.updateRide(");
    expect(cancelMethod).not.toContain("mobilityAuditService");

    expect(adminService).toContain("RideStateMachine.canTransition");
    expect(broker).toContain("handleTransitionRideState");
    expect(broker).toContain("auth.isProjectAdmin");

    expect(transitionMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_transition_ride_state_atomic",
    );
    expect(transitionMigration).toContain("FOR UPDATE");
    expect(transitionMigration).toContain("INSERT INTO public.ride_state_audit");
    expect(transitionMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(transitionMigration).toContain("TO service_role");
  });
});
