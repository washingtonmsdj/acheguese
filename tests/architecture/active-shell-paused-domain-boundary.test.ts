import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("active shell paused-domain boundary", () => {
  const navigationConfig = read(
    "src/app/components/navigation/navigation.config.ts",
  );
  const appShell = read("src/app/components/AppLayoutSidebar.tsx");
  const appSidebar = read("src/app/components/navigation/AppSidebar.tsx");

  it("does not import paused domain owners into active navigation config", () => {
    expect(navigationConfig).toContain("filterLaunchSections(RAW_NAV_SECTIONS)");
    expect(navigationConfig).not.toContain(
      "@/core/verticals/gastronomy/routes/gastronomyPublicRoutes",
    );
    expect(navigationConfig).not.toContain("@/modules/");
    expect(navigationConfig).not.toContain("@/core/community-feed");
    expect(navigationConfig).not.toContain("@/core/mobility");
  });

  it("keeps paused route families out of active shell behavior", () => {
    for (const forbidden of [
      "MODULE_SLUGS.community",
      "MODULE_SLUGS.services",
      "MODULE_SLUGS.gastronomy",
      "isCommunityRouteSuffixSegment",
      "isCommunityPublicLandingRoute",
      "isCommunityAliasPublicRoute",
      "isShortCommunityRoute",
      "isProfessionalPublicRoute",
      "isGastronomyOrderTrackingRoute",
      'pathSegments[0] === "grupos"',
    ]) {
      expect(appShell).not.toContain(forbidden);
    }

    expect(appShell).toContain("MODULE_SLUGS.business");
    expect(appShell).toContain("MODULE_SLUGS.search");
    expect(appShell).toContain('pathSegments[0] === "mensagens"');
    expect(appShell).toContain('pathSegments[0] === "conta"');
  });

  it("keeps the rendered desktop sidebar limited by lifecycle-filtered navigation", () => {
    expect(appSidebar).toContain("NAV_SECTIONS.map");
    expect(appSidebar).not.toContain("gastronomyPublicRoutes");
    expect(appSidebar).not.toContain("professionalPublicRoutes");
    expect(appSidebar).not.toContain("mobilityRoutes");
  });
});
