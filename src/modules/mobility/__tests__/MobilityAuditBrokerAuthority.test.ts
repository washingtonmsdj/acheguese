import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility ride audit authority", () => {
  it("keeps ride-state audit and terminal offer invalidation inside atomic commands", () => {
    const operationalService = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const transition = readProjectFile(
      "supabase/migrations/20260909191423_fix_terminal_driver_release_availability_g19.sql",
    );
    const pinProtocol = readProjectFile(
      "supabase/migrations/20260909145145_harden_operational_pin_protocol_g7.sql",
    );

    expect(operationalService).not.toContain("MobilityAuditService");
    expect(operationalService).not.toContain("mobilityAuditService");
    expect(operationalService).not.toContain("stopDispatchForRide");
    expect(operationalService).not.toContain("logRideStateChange");

    expect(rpcService).not.toContain('"logRideStateChange"');
    expect(rpcService).not.toContain('"cancelPendingOffers"');
    expect(broker).not.toContain("handleLogRideStateChange");
    expect(broker).not.toContain("handleCancelPendingOffers");
    expect(broker).not.toContain('supabaseAdmin.from("ride_state_audit").insert');
    expect(broker).not.toContain('"cancel_pending_ride_offers"');

    expect(transition).toContain("UPDATE public.ride_offers offer");
    expect(transition).toContain("offer.status IN ('pending', 'sent')");
    expect(transition).toContain("UPDATE public.ride_dispatch_audit dispatch");
    expect(transition).toContain("UPDATE public.driver_availability availability");
    expect(transition).toContain("INSERT INTO public.ride_state_audit");

    expect(pinProtocol).toContain("verification_attempts = v_attempts");
    expect(pinProtocol).toContain("last_attempt_at = v_now");
    expect(pinProtocol).toContain("verified_by = v_actor_profile_id");
  });
});
