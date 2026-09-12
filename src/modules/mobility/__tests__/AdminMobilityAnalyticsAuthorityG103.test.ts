import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G103 factual admin mobility analytics", () => {
  const hook = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/useAdminMobilityAnalytics.ts",
  );
  const types = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/AdminMobilityAnalytics.types.ts",
  );
  const cards = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/AdminMobilityStatsCards.tsx",
  );
  const charts = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/AdminMobilityCharts.tsx",
  );
  const rates = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/AdminMobilityRates.tsx",
  );
  const page = readProjectFile(
    "src/modules/admin/pages/AdminAnalyticsMobilidade.tsx",
  );

  it("derives analytics from shared lifecycle classifiers", () => {
    expect(hook).toContain("isOpenRideStatus");
    expect(hook).toContain("isClosedRideStatus");
    expect(hook).toContain("isCancelledRideStatus");
    expect(hook).toContain("isPreAcceptRideStatus");
    expect(hook).toContain("isDriverOwnedOpenRideStatus");
    expect(hook).not.toContain('ride.status === RIDE_STATUS.PENDING');
    expect(hook).not.toContain('ride.status === RIDE_STATUS.CANCELLED');
    expect(hook).not.toContain('ride.status === "driver_assigned"');
  });

  it("uses realized completed value and never suggested price as revenue", () => {
    expect(hook).toContain("ride.final_price ?? ride.actual_fare ?? 0");
    expect(hook).not.toContain("suggested_price");
    expect(types).toContain("completedValue: number");
    expect(types).not.toContain("totalRevenue");
    expect(types).not.toContain("revenue: number");
    expect(cards).toContain("Valor concluído no período");
    expect(cards).not.toContain("Receita Total");
    expect(charts).toContain("Valor de Corridas Concluídas por Dia");
    expect(charts).not.toContain("Receita Diária");
  });

  it("bases completion and cancellation rates on resolved rides", () => {
    expect(hook).toContain("resolutionCount");
    expect(hook).toContain("completedRides.length / resolutionCount");
    expect(hook).toContain("cancelledRides.length / resolutionCount");
    expect(rates).toContain("stats.resolvedRides");
    expect(rates).not.toContain("stats.cancelledRides / stats.totalRides");
  });

  it("presents lifecycle distribution rather than old pending/in-progress buckets", () => {
    expect(page).toContain('name: "Abertas"');
    expect(page).toContain('name: "Concluídas"');
    expect(page).toContain('name: "Canceladas"');
    expect(page).toContain('name: "Falhas/expiradas"');
    expect(page).not.toContain("stats.inProgressRides");
    expect(page).not.toContain("stats.pendingRides");
  });
});
