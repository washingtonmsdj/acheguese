import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OWNER = path.normalize("src/app/config/launchScope.ts");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public launch scope SSOT", () => {
  it("owns VITE_PRELAUNCH_LOCKDOWN only in launchScope", () => {
    const offenders = collectSourceFiles(SRC)
      .map((absolute) => ({
        relative: path.normalize(path.relative(ROOT, absolute)),
        source: fs.readFileSync(absolute, "utf8"),
      }))
      .filter(
        ({ relative, source }) =>
          relative !== OWNER && source.includes("VITE_PRELAUNCH_LOCKDOWN"),
      )
      .map(({ relative }) => relative);

    expect(offenders).toEqual([]);

    const owner = read(OWNER);
    expect(owner).toContain("export const PRELAUNCH_LOCKDOWN_ENABLED");
    expect(owner).toContain("publicEnv.VITE_PRELAUNCH_LOCKDOWN");
    expect(owner).toContain("mobility: false");
  });

  it("keeps launch consumers on the canonical flag", () => {
    const consumers = [
      "src/app/components/AppRuntime.tsx",
      "src/app/routes/RootRouteEntry.tsx",
      "src/app/routes/AppRoutes.tsx",
      "src/app/components/privacy/ConsentBannerContent.tsx",
    ];

    consumers.forEach((relativePath) => {
      const source = read(relativePath);
      expect(source).toContain("PRELAUNCH_LOCKDOWN_ENABLED");
      expect(source).toContain("@/app/config/launchScope");
      expect(source).not.toContain("VITE_PRELAUNCH_LOCKDOWN");
    });
  });

  it("keeps consent auth-surface detection on AUTH_PATHS", () => {
    const banner = read("src/app/components/privacy/ConsentBannerContent.tsx");

    expect(banner).toContain("AUTH_PATHS.login");
    expect(banner).toContain("AUTH_PATHS.signup");
    expect(banner).toContain("AUTH_PATHS.signupConfirmation");
    expect(banner).toContain("AUTH_PATHS.termsAcceptance");
    expect(banner).toContain("AUTH_PATHS.passwordReset");
    expect(banner).not.toContain('pathname === "/login"');
    expect(banner).not.toContain('pathname === "/cadastro"');
    expect(banner).not.toContain('pathname === "/reset-password"');
  });

  it("keeps prelaunch interest submission on canonical territory slugs", () => {
    const waitlist = read("src/app/pages/PreLaunchWaitlist.tsx");

    expect(waitlist).toContain("LAUNCH_CITY_PATH");
    expect(waitlist).toContain("TERRITORY_CONFIG.launch.community.slug");
    expect(waitlist).toContain("SALVADOR_COMMUNITY_LAUNCH_CLUSTER");
    expect(waitlist).toContain(
      "territoryPath: `${LAUNCH_CITY_PATH}/${selectedTerritory.slug}`",
    );
    expect(waitlist).toContain(
      "communitySlug: TERRITORY_CONFIG.launch.city || null",
    );
    expect(waitlist).not.toContain(
      "territoryPath: `/ba/salvador/${territorySlug}`",
    );
    expect(waitlist).not.toContain("slugifyTerritory(selectedBairro)");
    expect(waitlist).not.toContain('"Complexo Nordeste de Amaralina"');
  });
  it("owns paused Business category discovery policy in launchScope", () => {
    const owner = read(OWNER);
    const businessQueries = read("src/core/business/services/business.queries.ts");
    const landingFeatured = read("src/core/landing/services/LandingFeaturedService.ts");
    const spatial = read("src/core/geospatial/services/SpatialSearchService.ts");

    expect(owner).toContain("getLaunchPausedBusinessCategoryIds");
    expect(owner).toContain('educacao: "education"');
    expect(businessQueries).toContain("getLaunchPausedBusinessCategoryIds");
    expect(businessQueries).toContain("category.not.in.");
    expect(landingFeatured).toContain("applyLaunchBusinessCategoryExclusion");
    expect(spatial).toContain("isLaunchBusinessCategoryEnabled");
    expect(spatial).toContain("business launch-category lookup failed");
    expect(spatial).toContain("return [];");
  });

});
