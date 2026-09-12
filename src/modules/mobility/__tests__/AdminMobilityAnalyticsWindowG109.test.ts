import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G109 admin mobility analytics window", () => {
  const hook = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/useAdminMobilityAnalytics.ts",
  );
  const reader = readProjectFile(
    "src/core/admin/services/AdminMobilityAnalyticsReadService.ts",
  );
  const statsCards = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/AdminMobilityStatsCards.tsx",
  );

  it("does not return the analytics hook to a global ride history scan", () => {
    expect(hook).toContain("AdminMobilityAnalyticsReadService.listWindowRides(startISO)");
    expect(hook).not.toContain("adminMobilityService.getAllRides()");
    expect(hook).not.toContain("as unknown as AnalyticsRide[]");
  });

  it("keeps only ride fields needed by the G103 analytics contract", () => {
    const selectStart = reader.indexOf('.select(');
    const filterStart = reader.indexOf('.or(', selectStart);
    const projection = reader.slice(selectStart, filterStart);

    expect(projection).toContain("status");
    expect(projection).toContain("created_at");
    expect(projection).toContain("updated_at");
    expect(projection).toContain("completed_at");
    expect(projection).toContain("cancelled_at");
    expect(projection).toContain("final_price");
    expect(projection).toContain("actual_fare");
    expect(projection).toContain("driver_profile_id");
    expect(projection).not.toContain('select("*")');
    expect(projection).not.toContain("passenger_profile_id");
    expect(projection).not.toContain("origin");
    expect(projection).not.toContain("destination");
    expect(projection).not.toContain("pickup_");
    expect(projection).not.toContain("dropoff_");
  });

  it("preserves both creation and resolution clocks inside the selected period", () => {
    expect(reader).toContain("created_at.gte.${startIso}");
    expect(reader).toContain("completed_at.gte.${startIso}");
    expect(reader).toContain("cancelled_at.gte.${startIso}");
    expect(reader).toContain("updated_at.gte.${startIso}");
  });

  it("does not silently reinterpret the existing general rating card as period-only", () => {
    expect(statsCards).toContain("Avaliação média geral");
    expect(hook).toContain("adminMobilityService.getAllRideRatings()");
  });
});
