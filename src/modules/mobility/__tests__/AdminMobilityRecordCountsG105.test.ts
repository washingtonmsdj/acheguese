import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G105 admin mobility record counts", () => {
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const mobilityQueries = readProjectFile(
    "src/core/mobility/services/MobilityServiceDriverQueries.ts",
  );

  it("does not download ride and driver rows just to count them", () => {
    const method = adminService.slice(
      adminService.indexOf("async getMobilityStats"),
      adminService.indexOf("async getOperationalSnapshot"),
    );

    expect(method).toContain("getMobilityRecordCounts()");
    expect(method).not.toContain("getAllRides()");
    expect(method).not.toContain("getDriversRaw()");
    expect(method).not.toContain(".length");
  });

  it("keeps the canonical count read payload-free", () => {
    expect(mobilityQueries).toContain('select("id", { count: "exact", head: true })');
    expect(mobilityQueries).toContain("total_drivers: driversResult.count ?? 0");
    expect(mobilityQueries).toContain("total_rides: ridesResult.count ?? 0");
  });
});
