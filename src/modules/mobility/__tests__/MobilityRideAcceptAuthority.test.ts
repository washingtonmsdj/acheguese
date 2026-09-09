import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility ride acceptance authority", () => {
  it("keeps driver acceptance behind the authenticated atomic broker", () => {
    const dispatchService = readProjectFile(
      "src/core/mobility/core/RideDispatchService.ts",
    );
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const dispatchMigration = readProjectFile(
      "supabase/migrations/20260909125837_harden_atomic_mobility_dispatch_authority_g6.sql",
    );

    const acceptMethod = dispatchService.split("static async acceptRide(")[1]?.split(
      "/** Expira corrida",
    )[0];

    expect(acceptMethod).toBeTruthy();
    expect(acceptMethod).toContain("MobilityRpcService.acceptRideAtomic");
    expect(acceptMethod).not.toContain("updateRideWithGuards(");
    expect(acceptMethod).not.toContain("DriverAvailabilityService.setBusy");
    expect(acceptMethod).not.toContain("logStateChange(");

    expect(rpcService).toContain('"acceptRide"');
    expect(rpcService).toContain("acceptRideAtomic");
    expect(broker).toContain("handleAcceptRide");
    expect(broker).toContain('"accept_ride_atomic"');
    expect(broker).toContain(
      "User cannot accept rides with this driver profile",
    );

    expect(dispatchMigration).toContain("CREATE OR REPLACE FUNCTION public.accept_ride_atomic");
    expect(dispatchMigration).toContain("FOR UPDATE NOWAIT");
    expect(dispatchMigration).toContain("UPDATE public.driver_availability");
    expect(dispatchMigration).toContain("INSERT INTO public.ride_state_audit");
    expect(dispatchMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(dispatchMigration).toContain("TO service_role");
  });
});
