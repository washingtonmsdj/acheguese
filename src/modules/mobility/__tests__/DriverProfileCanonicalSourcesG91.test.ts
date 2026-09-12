import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G91 driver profile canonical sources", () => {
  const profileHook = readProjectFile(
    "src/modules/mobility/hooks/useDriverProfile.ts",
  );
  const profilePage = readProjectFile(
    "src/modules/mobility/pages/DriverProfilePage.tsx",
  );
  const mobilityConstants = readProjectFile(
    "src/shared/types/mobility.constants.ts",
  );

  it("keeps public identity separate from driver_data", () => {
    expect(profileHook).toContain("driverIdentity: sessionDriverProfile");
    expect(profilePage).toContain("driverIdentity?.displayName");
    expect(profilePage).toContain("driverIdentity?.avatarUrl");
    expect(profilePage).toContain("driverIdentity?.bio");

    for (const retiredIdentityRead of [
      "profileAny",
      "profileAny.display_name",
      "profileAny.name",
      "profileAny.avatar_url",
      "profileAny.bio",
    ]) {
      expect(profilePage).not.toContain(retiredIdentityRead);
    }
  });

  it("reads earnings and review count from their canonical services", () => {
    expect(profilePage).toContain(
      "mobilityService.getDriverEarnings(driverProfileId, 30)",
    );
    expect(profilePage).toContain(
      "ReviewsService.getReviewCount(driverProfileId",
    );
    expect(profilePage).toContain(
      "MOBILITY_QUERY_KEYS.driverProfileMetrics(driverProfileId",
    );
    expect(mobilityConstants).toContain(
      "driverProfileMetrics: (profileId: string) => ['driver-profile-metrics', profileId]",
    );

    expect(profilePage).not.toContain("profileAny.total_earnings");
    expect(profilePage).not.toContain("profileAny.total_ratings");
  });

  it("uses service-area coverage instead of invented driver radius fields", () => {
    expect(profilePage).toContain('useServiceAreas(driverProfileId ?? "")');
    expect(profilePage).toContain("primaryServiceArea.location_full_name");
    expect(profilePage).toContain("activeServiceAreas");

    expect(profilePage).not.toContain("max_search_radius_km");
    expect(profilePage).not.toContain("searchRadiusText");
    expect(profilePage).not.toContain("Raio de busca");
  });

  it("shows actual subscription state instead of a fabricated priority plan", () => {
    expect(profilePage).toContain("profile.subscription_active === true");
    expect(profilePage).toContain("Assinatura ativa");
    expect(profilePage).not.toContain("subscription_plan");
    expect(profilePage).not.toContain("Prioritario");
  });
});
