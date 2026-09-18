import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Mobility query surface integrity", () => {
  const queries = read("src/core/mobility/services/mobility.queries.ts");
  const rideReads = read("src/core/mobility/services/mobility.ride-read-queries.ts");
  const rideService = read("src/core/mobility/services/RideService.ts");
  const mobilityService = read("src/core/mobility/services/MobilityService.ts");
  const runtimeService = read("src/core/mobility/services/MobilityRuntimeService.ts");
  const serviceIndex = read("src/core/mobility/services/index.ts");
  const useDelivery = read("src/modules/mobility/hooks/useDelivery.ts");
  const useActiveRide = read("src/modules/mobility/hooks/useActiveRide.ts");
  const useRideHistory = read("src/modules/mobility/hooks/useRideHistory.ts");
  const rideHistoryUnified = read("src/modules/mobility/components/RideHistoryUnified.tsx");

  it("preserves the driver query owners required by active mobility consumers", () => {
    expect(queries).toContain("export async function getDriverDataIdByProfileId(");
    expect(queries).toContain("export async function getDriverData(profileId: string)");
    expect(queries).toContain("export async function getDriverStatsDetailed(");
    expect(queries).toContain("export async function getRidesByDriverProfile(");
  });

  it("keeps the unused RideService driver-history facade retired", () => {
    expect(rideService).not.toContain("getRidesByDriverProfile");
    expect(rideService).not.toContain("getRidesByDriver(");
    expect(rideService).toContain("getRidesByPassenger");
    expect(rideService).toContain("getActiveRide");
  });

  it("keeps ride-by-id on the direct query owner", () => {
    expect(queries).toContain("export async function getRideById(");
    expect(serviceIndex).toContain("getRideById,");
    expect(mobilityService).not.toContain("static getRideById");
    expect(mobilityService).not.toMatch(/export\s*\{[^}]*\bgetRideById\b/s);
    expect(runtimeService).not.toContain("async getRideById(");
    expect(useDelivery).toContain("getRideById(event.rideId)");
    expect(useDelivery).not.toContain("mobilityService.getRideById");
  });

  it("keeps user ride reads on the typed query owner", () => {
    expect(queries).toContain("export async function getUserRides(");
    expect(mobilityService).not.toContain("static getUserRides");
    expect(runtimeService).not.toContain("async getUserRides(");
    expect(runtimeService).not.toContain("RideRequestReadModel");
    expect(useActiveRide).toContain("getUserRides(user.id)");
    expect(useRideHistory).toContain("getUserRides(user.id)");
    expect(useDelivery).toContain("getUserRides(user.id)");
    expect(rideHistoryUnified).toContain("getUserRides(user.id)");
    expect(useActiveRide).not.toContain("MobilityFacade.getUserRides");
    expect(useRideHistory).not.toContain("MobilityFacade.getUserRides");
    expect(useDelivery).not.toContain("mobilityService.getUserRides");
    expect(rideHistoryUnified).not.toContain("mobilityService.getUserRides");
  });

  it("keeps bounded ride projections owned by the query layer", () => {
    expect(rideReads).not.toContain('from "./MobilityRuntimeService"');
    expect(rideReads).toContain('.from<RideSearchSnapshotRow>("ride_requests")');
    expect(rideReads).toContain(".select(RIDE_SEARCH_SNAPSHOT_SELECT)");
    expect(rideReads).toContain('.from<RideBasicInfoRow>("ride_requests")');
    expect(rideReads).toContain('.select("id, origin, destination, status, final_price, suggested_price")');
    expect(rideReads).toContain('.from<RideAvailableSeatsRow>("ride_requests")');
    expect(rideReads).toContain('.select("available_seats")');
    expect(runtimeService).not.toContain("async getRideBasicInfo(");
    expect(runtimeService).not.toContain("async getRideAvailableSeats(");
    expect(runtimeService).not.toContain("async getRideWithAddresses(");
    expect(runtimeService).not.toContain("readRideSearchSnapshot");
  });
});
