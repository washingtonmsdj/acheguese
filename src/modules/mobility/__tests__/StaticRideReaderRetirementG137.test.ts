import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G137 static ride reader retirement", () => {
  const staticService = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const rideService = readProjectFile(
    "src/core/mobility/services/RideService.impl.ts",
  );

  it("removes duplicate passenger and active ride readers from the static compatibility class", () => {
    expect(staticService).not.toContain("static async getRidesByPassenger(");
    expect(staticService).not.toContain("static async getActiveRide(userProfileId");
    expect(staticService).not.toContain("QUERYABLE_OPEN_RIDE_STATUSES");
  });

  it("keeps the canonical ride service routed through mobility queries", () => {
    expect(rideService).toContain("getRidesByPassenger,");
    expect(rideService).toContain("getActiveRide,");
    expect(rideService).toContain("await getRidesByPassenger(passengerId)");
    expect(rideService).toContain("await getActiveRide(userId)");
  });

  it("does not restore broad passenger or active reads in the static service", () => {
    expect(staticService).not.toContain('.eq("passenger_profile_id", passengerProfileId)');
    expect(staticService).not.toContain("passenger_profile_id.eq.${userProfileId}");
  });
});
