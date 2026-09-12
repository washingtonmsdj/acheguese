import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function projectPath(path: string): string {
  return resolve(process.cwd(), path);
}

function readProjectFile(path: string): string {
  return readFileSync(projectPath(path), "utf8");
}

describe("G137 static ride reader retirement", () => {
  const facade = readProjectFile(
    "src/core/mobility/services/MobilityService.ts",
  );
  const rideService = readProjectFile(
    "src/core/mobility/services/RideService.ts",
  );

  it("keeps retired split implementation paths absent", () => {
    expect(
      existsSync(projectPath("src/core/mobility/services/MobilityService.impl.ts")),
    ).toBe(false);
    expect(
      existsSync(projectPath("src/core/mobility/services/RideService.impl.ts")),
    ).toBe(false);
    expect(facade).not.toContain("MobilityService.impl");
    expect(facade).not.toContain("RideService.impl");
  });

  it("keeps the canonical ride service routed through mobility queries", () => {
    expect(rideService).toContain("getRidesByPassenger,");
    expect(rideService).toContain("getActiveRide,");
    expect(rideService).toContain("return getRidesByPassenger(passengerId)");
    expect(rideService).toContain("return getActiveRide(userId)");
  });

  it("does not restore duplicate passenger or active ride readers in the facade", () => {
    expect(facade).not.toContain("static async getRidesByPassenger(");
    expect(facade).not.toContain("static async getActiveRide(userProfileId");
    expect(facade).not.toContain("QUERYABLE_OPEN_RIDE_STATUSES");
    expect(facade).not.toContain('.eq("passenger_profile_id", passengerProfileId)');
  });

  it("does not preserve the dead shareRide no-op", () => {
    expect(rideService).not.toContain("shareRide(");
    expect(rideService).not.toContain("Future implementation");
  });
});
