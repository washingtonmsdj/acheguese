import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G86 driver registration authority", () => {
  const profileService = readProjectFile(
    "src/core/profiles/services/ProfileService.ts",
  );
  const governanceLoaders = readProjectFile(
    "src/core/admin/services/AdminProfileGovernanceLoaders.ts",
  );
  const governanceService = readProjectFile(
    "src/core/admin/services/AdminProfileGovernanceService.ts",
  );
  const driverRegistrationService = readProjectFile(
    "src/core/profiles/services/multi-profile/driverService.ts",
  );

  it("does not expose driver registration through the generic ProfileService", () => {
    expect(profileService).not.toContain("getDriverData(");
  });

  it("routes admin governance driver registration reads through DriverService", () => {
    expect(governanceLoaders).toContain(
      'import { DriverService } from "@/core/profiles/services/multi-profile/driverService";',
    );
    expect(governanceLoaders).toContain("DriverService.getDriverData(profileId)");
    expect(governanceLoaders).not.toContain("profileService.getDriverData(");

    expect(governanceService).toContain(
      'import { DriverService } from "@/core/profiles/services/multi-profile/driverService";',
    );
    expect(governanceService).toContain("DriverService.getDriverData(profileId)");
    expect(governanceService).not.toContain("profileService.getDriverData(");
  });

  it("keeps the registration reader free from operational presence fields", () => {
    expect(driverRegistrationService).toContain("DRIVER_DATA_PROFILE_EDITOR_SELECT");

    for (const operationalField of [
      "is_online",
      "is_available",
      "current_location",
      "current_lat",
      "current_lng",
      "last_location_update",
      "last_seen_at",
      "active_ride_id",
      "active_ride_mode",
    ]) {
      expect(driverRegistrationService).not.toContain(`'${operationalField}'`);
      expect(driverRegistrationService).not.toContain(`\"${operationalField}\"`);
    }
  });
});
