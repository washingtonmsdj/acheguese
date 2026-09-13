import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Mobility query surface integrity", () => {
  const queries = read("src/core/mobility/services/mobility.queries.ts");
  const rideService = read("src/core/mobility/services/RideService.ts");

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
});
