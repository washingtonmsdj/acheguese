import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("G85 admin driver detail authority", () => {
  const detailService = readProjectFile(
    "src/core/admin/services/AdminDriverDetailReadService.ts",
  );
  const hook = readProjectFile(
    "src/modules/admin/hooks/useAdminUserDetail.ts",
  );
  const detailTab = readProjectFile(
    "src/modules/admin/components/user-detail/DriverDataTab.tsx",
  );
  const analyticsTab = readProjectFile(
    "src/modules/admin/components/user-detail/AnalyticsTab.tsx",
  );

  it("keeps registration and operational presence on separate authorities", () => {
    const registrationSelect = sliceBetween(
      detailService,
      "const DRIVER_DETAIL_SELECT = [",
      "].join(\",\");",
    );

    expect(detailService).toContain('from<DriverRegistrationAndStatsRow>("driver_data")');
    expect(detailService).toContain("AdminDriverPresenceReadService.list([profileId])");

    for (const retiredPresenceField of [
      '"is_online"',
      '"is_available"',
      '"current_lat"',
      '"current_lng"',
      '"last_location_update"',
      '"last_seen_at"',
      '"active_ride_id"',
      '"active_ride_mode"',
    ]) {
      expect(registrationSelect).not.toContain(retiredPresenceField);
    }
  });

  it("loads the driver detail by canonical profile id instead of the dead profile stub", () => {
    expect(hook).toContain("AdminDriverDetailReadService.get(profileData.id)");
    expect(hook).not.toContain("profileService.getDriverData(");
    expect(hook).toContain('profileData.profile_type === "driver"');
  });

  it("does not render the retired admin driver field aliases", () => {
    for (const legacyField of [
      "cnh_number",
      "cnh_expiry_date",
      "last_online_at",
      "total_requests_received",
      "total_requests_accepted",
      "cancellation_count",
    ]) {
      expect(detailTab).not.toContain(legacyField);
      expect(analyticsTab).not.toContain(legacyField);
    }

    expect(detailTab).toContain("driverData.license_number");
    expect(detailTab).toContain("driverData.last_seen_at");
    expect(detailTab).toContain("driverData.total_rides_completed");
    expect(analyticsTab).toContain("driverData.total_rides_cancelled");
  });
});
