import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G97 admin driver lifecycle metrics authority", () => {
  const lifecycleService = readProjectFile(
    "src/core/admin/services/AdminDriverLifecycleMetricsService.ts",
  );
  const adminMobilityService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const adminQueryService = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );
  const cancellationPanel = readProjectFile(
    "src/core/admin/components/DriverCancellationMetrics.tsx",
  );

  it("counts only driver-attributable cancellations with deterministic batched reads", () => {
    expect(lifecycleService).toContain("RIDE_STATUS.CANCELLED_BY_DRIVER");
    expect(lifecycleService).toContain('.in("driver_profile_id", profileIds)');
    expect(lifecycleService).toContain('.eq("action", "suspended")');
    expect(lifecycleService).toContain('.order("id", { ascending: true })');
    expect(lifecycleService).toContain("PAGE_SIZE = 1000");
    expect(lifecycleService).not.toContain('ride.status === "cancelled"');
  });

  it("keeps the admin mobility aggregator free of N+1 lifecycle reads and fabricated earnings", () => {
    expect(adminMobilityService).toContain("AdminDriverLifecycleMetricsService.load(profileIds)");
    expect(adminMobilityService).not.toContain("getDriverRideStatuses");
    expect(adminMobilityService).not.toContain("countDriverSuspensions");
    expect(adminMobilityService).not.toContain("getHighCancellationDrivers");
    expect(adminMobilityService).not.toContain("total_earnings");

    expect(adminQueryService).not.toContain("getDriverRideStatuses");
    expect(adminQueryService).not.toContain("countDriverSuspensions");
    expect(adminQueryService).not.toContain("total_earnings: 0");
    expect(adminQueryService).not.toContain("total_earnings: number");
  });

  it("does not invent suspension thresholds in the admin cancellation UI", () => {
    expect(cancellationPanel).toContain("AdminDriverModerationService.getModerationRows");
    expect(cancellationPanel).toContain('action: "reactivated"');
    expect(cancellationPanel).toContain("driver_cancelled_ride_count");
    expect(cancellationPanel).toContain("assigned_ride_count");
    expect(cancellationPanel).not.toContain("Alto Risco");
    expect(cancellationPanel).not.toContain("limite: 30%");
    expect(cancellationPanel).not.toContain("cancellation_rate > 25");
    expect(cancellationPanel).not.toContain("cancellation_rate > 30");
    expect(cancellationPanel).not.toContain("profileService.getProfileContext");
  });
});
