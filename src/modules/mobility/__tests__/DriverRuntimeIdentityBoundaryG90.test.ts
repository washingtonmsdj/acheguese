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

describe("G90 driver runtime identity boundary", () => {
  const runtimeService = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );
  const profileLayout = readProjectFile(
    "src/core/mobility/components/driver/DriverProfileLayout.tsx",
  );

  it("uses an explicit driver_data projection for runtime identity", () => {
    const projection = sliceBetween(
      runtimeService,
      "const DRIVER_RUNTIME_IDENTITY_SELECT = [",
      "class MobilityServiceInstance",
    );
    const reader = sliceBetween(
      runtimeService,
      "async getDriverData(identifier: string)",
      "async updateDriverData(",
    );

    expect(reader).toContain(".select(DRIVER_RUNTIME_IDENTITY_SELECT)");
    expect(reader).not.toContain('.select("*")');

    for (const requiredField of [
      "profile_id",
      "is_verified",
      "rating",
      "license_number",
      "vehicle_plate",
      "background_check_status",
      "can_do_delivery",
      "can_do_rides",
    ]) {
      expect(projection).toContain(`\"${requiredField}\"`);
    }

    for (const presenceField of [
      "is_online",
      "is_available",
      "last_location_update",
      "last_seen_at",
      "current_location",
      "current_lat",
      "current_lng",
      "active_ride_id",
      "active_ride_mode",
    ]) {
      expect(projection).not.toContain(`\"${presenceField}\"`);
    }
  });

  it("keeps public profile identity out of driver_data", () => {
    expect(profileLayout).toContain("sessionDriverProfile");
    expect(profileLayout).toContain("sessionDriverProfile?.displayName");
    expect(profileLayout).toContain("sessionDriverProfile?.avatarUrl");
    expect(profileLayout).not.toContain("snapshot?.display_name");
    expect(profileLayout).not.toContain("snapshot?.avatar_url");
  });
});
