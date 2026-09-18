import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("compatibility facade retirement", () => {
  it("keeps the Guide URL facade physically retired", () => {
    expect(
      existsSync(resolve(root, "src/modules/guide/hooks/useGuideUrls.ts")),
    ).toBe(false);

    for (const path of [
      "src/modules/guide/components/GuideSidebarItem.tsx",
      "src/modules/guide/pages/TouristPointDetailPage.tsx",
      "src/modules/guide/pages/TouristPointsPage.tsx",
    ]) {
      const source = read(path);
      expect(source).toContain(
        "@/core/guide/tourist-points/routes/useTouristPointPublicUrls",
      );
      expect(source).not.toContain("useGuideUrls");
      expect(source).not.toContain("hooks/useGuideUrls");
    }

    expect(read("src/modules/guide/index.ts")).not.toContain("useGuideUrls");
  });

  it("keeps the multi-profile Business facade physically retired", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/profiles/services/multi-profile/businessService.ts",
        ),
      ),
    ).toBe(false);

    const editor = read(
      "src/core/profiles/services/multi-profile/profileService.ts",
    );
    const rules = read("src/core/profiles/utils/profileDomainRules.ts");
    const barrel = read("src/core/profiles/services/multi-profile/index.ts");

    for (const source of [editor, rules]) {
      expect(source).toContain(
        "@/core/business/services/business.profile-extension",
      );
      expect(source).not.toContain("multi-profile/businessService");
      expect(source).not.toContain("BusinessService.");
    }

    expect(barrel).not.toContain("./businessService");
  });

  it("keeps the Mobility ride snapshot forwarding facade retired", () => {
    const page = read("src/modules/mobility/pages/BuscandoMotoristaPage.tsx");
    const runtime = read(
      "src/core/mobility/services/MobilityRuntimeService.ts",
    );

    expect(page).toContain(
      "@/core/mobility/services/mobility.ride-read-queries",
    );
    expect(page).toContain("getRideWithAddresses(rideId!)");
    expect(page).not.toContain("mobilityService.getRideWithAddresses");

    expect(runtime).not.toContain("async getRideWithAddresses(");
    expect(runtime).not.toContain("readRideSearchSnapshot");
  });

  it("keeps the Gastronomy mutation compatibility API retired", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/business/services/gastronomy.mutations.ts",
        ),
      ),
    ).toBe(false);

    const barrel = read("src/core/business/services/index.ts");
    const setup = read(
      "src/modules/business/gastronomy/hooks/useGastronomySetup.ts",
    );

    expect(barrel).not.toContain("./gastronomy.mutations");
    expect(setup).toContain("GastronomyProfileService");
  });

  it("keeps the canonical registry at zero live runtime facades", () => {
    const registry = read("docs/03-architecture/COMPATIBILITY_BRIDGES.md");

    expect(registry).toContain("zero live runtime compatibility facades");
    expect(registry).toContain("There are **no approved live runtime compatibility facades**");
    expect(registry).not.toContain("| Compatibility surface |");
  });
});
