import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G112 admin realtime driver separation", () => {
  const reader = readProjectFile(
    "src/core/admin/services/AdminMobilityRealtimeDriverReadService.ts",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const adminQueries = readProjectFile(
    "src/core/admin/services/admin.queries.ts",
  );

  it("uses dedicated global metrics and online-only directory methods", () => {
    expect(adminService).toContain("getRealtimeDriverMetricRows()");
    expect(adminService).toContain("getRealtimeOnlineDriverDirectory(profileIds");
    expect(adminQueries).toContain("adminMobilityService.getRealtimeDriverMetricRows()");
    expect(adminQueries).toContain(
      "adminMobilityService.getRealtimeOnlineDriverDirectory(onlineProfileIds)",
    );

    const realtimeStart = adminQueries.indexOf("export async function getRealtimeMetrics");
    const reputationStart = adminQueries.indexOf("export async function getReputationStats");
    const realtimeMethod = adminQueries.slice(realtimeStart, reputationStart);
    expect(realtimeMethod).not.toContain("getAllDriversComplete()");
  });

  it("keeps global driver metric rows identity-free", () => {
    const metricStart = reader.indexOf("static async listMetricRows()");
    const directoryStart = reader.indexOf("static async listOnlineDirectory(");
    const metricMethod = reader.slice(metricStart, directoryStart);

    expect(metricMethod).toContain('.select("rating, is_verified")');
    for (const forbidden of [
      "profile_id",
      "name",
      "display_name",
      "avatar_url",
      "total_rides",
      "vehicle_model",
      "vehicle_plate",
      "is_online",
      "is_available",
    ]) {
      expect(metricMethod).not.toContain(forbidden);
    }
  });

  it("limits identity and vehicle reads to the online profile ids", () => {
    const directoryStart = reader.indexOf("static async listOnlineDirectory(");
    const directoryMethod = reader.slice(directoryStart);

    expect(directoryMethod).toContain('.in("profile_id", profileIds)');
    expect(directoryMethod).toContain("profiles!inner(name, display_name, avatar_url)");
    expect(directoryMethod).toContain("vehicle_model");
    expect(directoryMethod).toContain("vehicle_plate");
    expect(directoryMethod).not.toContain("is_online");
    expect(directoryMethod).not.toContain("is_available");
  });

  it("keeps operational presence on driver_availability instead of driver_data", () => {
    expect(adminQueries).toContain("AdminDriverPresenceReadService.listOnline()");
    expect(reader).not.toContain("driver_availability");
  });
});
