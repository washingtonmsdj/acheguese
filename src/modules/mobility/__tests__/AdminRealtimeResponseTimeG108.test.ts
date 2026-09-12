import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G108 realtime response-time authority", () => {
  const queries = readProjectFile("src/core/admin/services/admin.queries.ts");
  const types = readProjectFile("src/core/admin/services/types.ts");
  const dashboard = readProjectFile(
    "src/modules/admin/pages/AdminRealtimeDashboard.tsx",
  );

  it("derives response latency from dispatch and acceptance lifecycle timestamps", () => {
    expect(queries).toContain("getAverageDriverResponseTimeMinutes");
    expect(queries).toContain("ride.driver_assigned_at");
    expect(queries).toContain("ride.driver_accepted_at");
    expect(queries).toContain("(acceptedAt - assignedAt) / 60_000");
    expect(queries).not.toContain("avg_response_time_minutes");
    expect(queries).not.toContain("avg_response_time_seconds");
  });

  it("keeps missing samples distinct from a zero-minute response", () => {
    expect(types).toContain("avgResponseTime: number | null");
    expect(queries).toContain("if (samples.length === 0) return null");
    expect(queries).toContain("avgResponseTime: null");
  });

  it("renders missing response-time samples truthfully", () => {
    expect(dashboard).toContain("metrics.avgResponseTime === null");
    expect(dashboard).toContain('"sem amostra"');
    expect(dashboard).not.toContain("{metrics.avgResponseTime}min");
  });
});
