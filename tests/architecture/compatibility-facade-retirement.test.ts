import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("active compatibility facade retirement", () => {
  it("keeps the Guide URL facade physically retired", () => {
    expect(
      fs.existsSync(path.join(ROOT, "src/modules/guide/hooks/useGuideUrls.ts")),
    ).toBe(false);

    for (const relativePath of [
      "src/modules/guide/components/GuideSidebarItem.tsx",
      "src/modules/guide/pages/TouristPointsPage.tsx",
      "src/modules/guide/pages/TouristPointDetailPage.tsx",
      "src/modules/guide/index.ts",
    ]) {
      const source = read(relativePath);
      expect(source).not.toContain("hooks/useGuideUrls");
      expect(source).not.toContain("useGuideUrls");
    }

    expect(read("src/modules/guide/components/GuideSidebarItem.tsx")).toContain(
      "useTouristPointPublicUrls",
    );
  });

  it("keeps the multi-profile Business facade physically retired", () => {
    expect(
      fs.existsSync(
        path.join(
          ROOT,
          "src/core/profiles/services/multi-profile/businessService.ts",
        ),
      ),
    ).toBe(false);

    const profileService = read(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const profileRules = read("src/core/profiles/utils/profileDomainRules.ts");
    const barrel = read("src/core/profiles/services/multi-profile/index.ts");

    expect(profileService).toContain(
      "@/core/business/services/business.profile-extension",
    );
    expect(profileService).toContain("getBusinessProfileExtension(profile.id)");
    expect(profileService).toContain("updateBusinessProfileExtension(profile.id");
    expect(profileService).not.toContain("./businessService");
    expect(profileRules).not.toContain("multi-profile/businessService");
    expect(profileRules).not.toContain("saveProfileExtensionByType");
    expect(profileRules).not.toContain("loadProfileExtensionByType");
    expect(barrel).not.toContain("BusinessService");
  });
});
