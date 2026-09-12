import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G147 retired static mobility readers", () => {
  const mobilityImpl = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const functionalQueries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );
  const driverQueries = readProjectFile(
    "src/core/mobility/services/MobilityServiceDriverQueries.ts",
  );

  it("does not rebuild duplicate static read authorities", () => {
    for (const retiredMethod of [
      "getRideSourceIdById",
      "getActiveRideByDriverProfile",
      "getRideDispatchData",
      "getDriverDataByProfileIds",
      "getMobilityStats",
      "getDriverEarnings",
      "getCompletedRidePaymentsByDriver",
      "getPassengerRating",
      "listMotoboyDeliveries",
      "listMotoboyStatsRows",
      "countDeliveredBySource",
      "countDeliveredMotoboyRides",
      "getRideById",
    ]) {
      expect(mobilityImpl).not.toContain(`static async ${retiredMethod}(`);
    }
  });

  it("keeps functional/dedicated owners for active capabilities", () => {
    expect(functionalQueries).toContain("export async function getActiveRideByDriverProfile(");
    expect(functionalQueries).toContain("export async function getRideDispatchData(");
    expect(driverQueries).toContain("export async function getDriverDataByProfileIds(");
    expect(driverQueries).toContain("export async function getMobilityStats(");
    expect(driverQueries).toContain("export async function getCompletedRidePaymentsByDriver(");
    expect(driverQueries).toContain("export async function getPassengerRating(");
  });

  it("keeps only the last compatibility command with a proven current caller", () => {
    expect(mobilityImpl).toContain("static async ensureDriverDataRow(");
    expect(mobilityImpl).not.toContain("RideOperationalContextReadService");
  });

  it("does not retain imports used only by retired wrappers", () => {
    expect(mobilityImpl).not.toContain("DriverEarningsReadService");
    expect(mobilityImpl).not.toContain("RideRatingService");
    expect(mobilityImpl).not.toContain("profileService");
    expect(mobilityImpl).not.toContain("logger");
  });
});
