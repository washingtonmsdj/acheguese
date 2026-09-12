import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G100 realtime admin mobility authority", () => {
  const queries = readProjectFile("src/core/admin/services/admin.queries.ts");
  const types = readProjectFile("src/core/admin/services/types.ts");
  const dashboard = readProjectFile(
    "src/modules/admin/pages/AdminRealtimeDashboard.tsx",
  );
  const widget = readProjectFile(
    "src/modules/admin/components/RealtimeStatsWidget.tsx",
  );

  it("reads online presence and active lifecycle from canonical authorities", () => {
    expect(queries).toContain("AdminDriverPresenceReadService.listOnline()");
    expect(queries).toContain("QUERYABLE_OPEN_RIDE_STATUSES");
    expect(queries).toContain("QUERYABLE_CLOSED_RIDE_STATUSES");
    expect(queries).not.toContain("const ACTIVE_RIDE_STATUSES = new Set([");
    expect(queries).not.toContain("isTruthy(driver.is_online)");
    expect(queries).not.toContain('getString(driver.status).toLowerCase() === "online"');
  });

  it("computes completion rate over resolved rides only", () => {
    expect(queries).toContain("resolvedRidesCount");
    expect(queries).toContain("completedCount / resolvedRidesCount");
    expect(queries).not.toContain("completedCount / totalRides");
  });

  it("does not label completed ride value as platform revenue", () => {
    for (const source of [queries, types, dashboard, widget]) {
      expect(source).not.toContain("revenueToday");
      expect(source).not.toContain("revenueWeek");
      expect(source).not.toContain("revenueMonth");
    }

    expect(types).toContain("completedValueToday");
    expect(types).toContain("completedValueWeek");
    expect(types).toContain("completedValueMonth");
    expect(queries).not.toContain("ride.suggested_price");
    expect(dashboard).not.toContain("Receita Hoje");
    expect(dashboard).not.toContain("Resumo Financeiro");
    expect(widget).toContain("Valor concluído hoje");
  });

  it("counts currently suspended drivers from current moderation state", () => {
    expect(queries).toContain("AdminDriverModerationService.getModerationRows");
    expect(queries).toContain("row.is_suspended === true");
    expect(queries).not.toContain("driver.suspension_count > 0");
  });
});
