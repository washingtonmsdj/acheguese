import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G106 admin driver directory authority", () => {
  const queries = readProjectFile(
    "src/core/mobility/services/MobilityServiceDriverQueries.ts",
  );
  const hook = readProjectFile(
    "src/core/admin/drivers/hooks/useDriverManagement.ts",
  );
  const types = readProjectFile(
    "src/core/admin/drivers/sections/types.ts",
  );
  const helpers = readProjectFile(
    "src/core/admin/drivers/utils/driverHelpers.ts",
  );
  const stats = readProjectFile(
    "src/core/admin/drivers/utils/statsCalculator.ts",
  );
  const infoCard = readProjectFile(
    "src/core/admin/drivers/components/cards/DriverInfoCard.tsx",
  );
  const moderation = readProjectFile(
    "src/core/admin/services/AdminDriverModerationService.ts",
  );

  it("builds the admin directory from explicit registration and public identity fields", () => {
    const method = queries.slice(
      queries.indexOf("export async function getDriverProfiles"),
      queries.indexOf("export async function getDriverDataByProfileIds"),
    );

    expect(method).toContain('.from<DriverDirectoryRow>("driver_data")');
    expect(method).toContain("license_number");
    expect(method).toContain("license_category");
    expect(method).toContain("license_expiry");
    expect(method).toContain("license_state");
    expect(method).toContain("vehicle_plate");
    expect(method).toContain("profiles!inner(name, display_name, avatar_url, neighborhood, city)");
    expect(method).not.toContain("driver_complete_profile");
    expect(method).not.toContain('select("*")');
    expect(method).not.toContain("user_id");
    expect(method).not.toContain("current_location");
    expect(method).not.toContain("last_location_update");
    expect(method).not.toContain("is_available");
    expect(method).not.toContain("is_online");
  });

  it("composes the admin driver dto without profile-context N+1 or fictional document fields", () => {
    expect(hook).not.toContain("getProfileContext(");
    expect(hook).not.toContain("profileContext");
    expect(hook).not.toContain("cnh_image_url");
    expect(hook).not.toContain("avg_rating");
    expect(hook).toContain("fallbackVerified: Boolean(driverRow.is_verified)");
    expect(hook).toContain("rating: driverRow.rating ?? 0");
    expect(hook).toContain("license_number: driverRow.license_number ?? null");
    expect(hook).toContain("setDrivers(driverReadModels)");

    expect(types).not.toContain("ProfileContext");
    expect(types).not.toContain("cnh_image_url");
    expect(types).toContain("license_number?: string | null");
    expect(types).toContain('verification_status: "pending" | "verified" | "rejected"');
  });

  it("keeps explicit moderation decisions separate from registration fallback", () => {
    expect(moderation).toContain('verification_status: decision');
    expect(moderation).toContain(': null,');
    expect(moderation).toContain('return context.fallbackVerified ? "verified" : "pending"');
    expect(moderation).not.toContain(': "pending",\n            verification_rejection_reason');
  });

  it("derives filters and helper state from the resolved admin read model", () => {
    expect(helpers).not.toContain("profileContext");
    expect(helpers).toContain('driver.verification_status === "pending"');
    expect(helpers).toContain('driver.verification_status === "verified"');
    expect(helpers).toContain("return driver.is_suspended");

    expect(stats).toContain('driver.verification_status === "rejected"');
    expect(stats).not.toContain("filtered = []");
  });

  it("renders authoritative license metadata instead of a nonexistent CNH image column", () => {
    expect(infoCard).not.toContain("cnh_image_url");
    expect(infoCard).not.toContain("SafeImage");
    expect(infoCard).not.toContain("SafeLink");
    expect(infoCard).toContain("driver.license_number");
    expect(infoCard).toContain("driver.license_category");
    expect(infoCard).toContain("driver.license_state");
    expect(infoCard).toContain("driver.license_expiry");
  });
});
