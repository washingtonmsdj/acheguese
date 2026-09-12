import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G128 weekly earnings canonical read model", () => {
  const chart = readProjectFile(
    "src/core/mobility/components/driver/WeeklyEarningsChart.tsx",
  );

  it("reads the weekly window through DriverEarningsReadService", () => {
    expect(chart).toContain("DriverEarningsReadService.list(driverProfileId");
    expect(chart).toContain("sinceIso: startOfWindow.toISOString()");
    expect(chart).not.toContain("MobilityService.getDriverEarnings(");
  });

  it("uses realized earning values instead of estimated price", () => {
    expect(chart).toContain("earning.final_price ?? earning.actual_fare ?? 0");
    expect(chart).not.toContain("suggested_price");
  });

  it("never constructs a date directly from nullable completed_at", () => {
    expect(chart).toContain("earning.completed_at ?? earning.updated_at");
    expect(chart).not.toContain("new Date(e.completed_at)");
  });
});
