import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility driver offer authority", () => {
  it("keeps offer discovery territorial, brokered and on the canonical schedule field", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909173500_broker_driver_offer_read_model_g10.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const offerService = readProjectFile(
      "src/core/mobility/services/MobilityOfferService.ts",
    );
    const queries = readProjectFile(
      "src/core/mobility/services/mobility.queries.ts",
    );
    const dispatchConfig = readProjectFile(
      "src/core/mobility/services/MobilityDispatchConfigService.ts",
    );

    expect(migration).toContain("private.mobility_operational_city_id");
    expect(migration).toContain("public.mobility_list_driver_offers");
    expect(migration).toContain(
      "private.mobility_operational_city_id(ride.pickup_location_id)",
    );
    expect(migration).toContain("driver.subscription_active = true");
    expect(migration).toContain("availability.is_available = true");
    expect(migration).toContain("ride.departure_time >= v_now + INTERVAL '2 hours'");
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.get_ride_offer_trust_decisions(uuid[])",
    );
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.get_driver_dispatch_summaries(uuid[])",
    );

    expect(broker).toContain("listDriverOffers: true");
    expect(broker).toContain("handleListDriverOffers");
    expect(broker).toContain(
      "User cannot list offers for this driver profile",
    );

    expect(rpcService).toContain('"listDriverOffers"');
    expect(offerService).toContain("MobilityRpcService.listDriverOffers");
    expect(offerService).not.toContain("getOpenBoardOfferRides");
    expect(offerService).not.toContain("getReservationOfferRides");
    expect(offerService).not.toContain("getExclusiveOfferRideForDriver");
    expect(offerService).not.toContain("getRideCounterpartyDecisions");

    expect(queries).toContain(
      '.select("ride_mode, source_type, departure_time, status")',
    );
    expect(queries).not.toContain("is_scheduled, scheduled_for");
    expect(queries).not.toContain("getOpenBoardOfferRides");
    expect(queries).not.toContain("getReservationOfferRides");
    expect(queries).not.toContain("getExclusiveOfferRideForDriver");

    expect((dispatchConfig.match(/requiresSubscription: true/g) ?? []).length)
      .toBeGreaterThanOrEqual(3);
  });
});
