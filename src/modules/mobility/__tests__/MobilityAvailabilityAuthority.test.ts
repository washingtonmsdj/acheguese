import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility availability authority", () => {
  it("keeps presence intent brokered and busy state server-owned", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909162500_harden_driver_availability_authority_g8.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const availabilityService = readProjectFile(
      "src/core/mobility/services/DriverAvailabilityService.ts",
    );
    const offerService = readProjectFile(
      "src/core/mobility/services/MobilityOfferService.ts",
    );
    const operationalHook = readProjectFile(
      "src/core/mobility/hooks/useDriverOperationalStatus.ts",
    );

    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_availability FROM authenticated",
    );
    expect(migration).toContain("public.mobility_update_driver_availability");
    expect(migration).toContain(
      "FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain("TO service_role");
    expect(migration).toContain(
      "public.mobility_reconcile_stale_driver_availability",
    );

    expect(broker).toContain("updateDriverAvailability: true");
    expect(broker).toContain("reconcileStaleDriverAvailability: true");
    expect(broker).toContain("profileBelongsToUser");
    expect(broker).toContain('"Admin authority is required to reconcile stale drivers"');

    expect(rpcService).toContain('"updateDriverAvailability"');
    expect(rpcService).toContain('"reconcileStaleDriverAvailability"');
    const terminalTransition = readProjectFile(
      "supabase/migrations/20260909191423_fix_terminal_driver_release_availability_g19.sql",
    );
    expect(rpcService).not.toContain("releaseDriverAvailabilityForRide");
    expect(broker).not.toContain("handleReleaseDriverAvailability");
    expect(broker).not.toContain("canAccessRideAsParticipantOrAdmin");
    expect(terminalTransition).toContain("UPDATE public.driver_availability availability");
    expect(terminalTransition).toContain("availability.active_ride_id = p_ride_id");
    expect(terminalTransition).toContain("availability.current_lat IS NOT NULL");
    expect(terminalTransition).toContain("availability.current_lng IS NOT NULL");
    expect(terminalTransition).toContain(
      "availability.last_location_update >= v_now - interval '5 minutes'",
    );

    expect(availabilityService).toContain(
      "MobilityRpcService.updateDriverAvailability",
    );
    expect(availabilityService).toContain(
      "MobilityRpcService.reconcileStaleDriverAvailability",
    );
    expect(availabilityService).not.toContain("static async setBusy");
    expect(availabilityService).not.toContain("static async releaseBusy");
    expect(availabilityService).not.toMatch(
      /from\(['"]driver_availability['"]\)[\s\S]{0,160}\.(?:update|upsert|insert)\(/,
    );

    expect(offerService).not.toContain("DriverAvailabilityService.setBusy");
    expect(operationalHook).toContain(
      "DriverAvailabilityService.pauseAvailable",
    );
  });
});
