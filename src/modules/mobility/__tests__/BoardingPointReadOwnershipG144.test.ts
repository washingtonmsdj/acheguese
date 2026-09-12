import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G144 boarding point read ownership", () => {
  const boarding = readProjectFile(
    "src/core/mobility/services/BoardingPointService.ts",
  );
  const staticService = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );

  it("owns the recent pickup projection inside BoardingPointService", () => {
    expect(boarding).toContain('.from("ride_requests")');
    expect(boarding).toContain("pickup_location_id");
    expect(boarding).toContain("pickup_location:locations!ride_requests_pickup_location_id_fkey");
    expect(boarding).toContain("RECENT_BOARDING_POINT_SAMPLE_LIMIT");
    expect(boarding).not.toContain('select("*")');
  });

  it("retires the static compatibility reader", () => {
    expect(staticService).not.toContain("listRecentRidePickupLocations(");
    expect(boarding).not.toContain("MobilityService.listRecentRidePickupLocations");
  });
});
