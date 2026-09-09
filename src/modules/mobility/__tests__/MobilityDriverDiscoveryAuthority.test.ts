import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility ride-scoped driver discovery authority", () => {
  it("requires a concrete ride and keeps candidate discovery server-owned", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909181500_broker_available_driver_discovery_g11.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const availabilityService = readProjectFile(
      "src/core/mobility/services/DriverAvailabilityService.ts",
    );
    const gate5 = readProjectFile(
      "tests/operational/gate5-availability-test.test.ts",
    );

    expect(migration).toContain(
      "public.mobility_find_available_drivers_for_ride",
    );
    expect(migration).toContain(
      "Ride requester or admin authority required",
    );
    expect(migration).toContain(
      "private.mobility_operational_city_id(profile.location_id)",
    );
    expect(migration).toContain("driver.subscription_active = true");
    expect(migration).toContain("availability.last_seen_at >=");
    expect(migration).toContain("profile.user_id <> (");
    expect(migration).toContain("TO service_role");

    expect(broker).toContain("findAvailableDriversForRide: true");
    expect(broker).toContain("handleFindAvailableDriversForRide");
    expect(broker).toContain(
      "Only the ride requester or admin can discover drivers",
    );

    expect(rpcService).toContain('"findAvailableDriversForRide"');
    expect(availabilityService).toContain(
      "static async findAvailableDriversForRide",
    );
    expect(availabilityService).not.toContain(
      "static async findAvailableDrivers(",
    );
    expect(availabilityService).not.toContain("getDriverDataByProfileIds");

    expect(gate5).toContain(
      "descoberta por rideId retorna somente motorista elegível do município",
    );
    expect(gate5).toContain(
      "terceiro sem vínculo com a corrida não descobre motoristas",
    );
    expect(gate5).not.toContain("findAvailableDrivers(");
  });
});
