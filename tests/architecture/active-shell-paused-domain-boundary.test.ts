import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("active shell paused-domain boundary", () => {
  const navigationConfig = read(
    "src/app/components/navigation/navigation.config.ts",
  );
  const appShell = read("src/app/components/AppLayoutSidebar.tsx");
  const appSidebar = read("src/app/components/navigation/AppSidebar.tsx");
  const appUrls = read("src/core/routing/hooks/useAppUrls.ts");
  const notificationRoutes = read(
    "src/core/notifications/routes/notificationRoutes.ts",
  );

  it("does not import paused domain owners into active navigation config", () => {
    expect(navigationConfig).toContain("filterNavigationSections(RAW_NAV_SECTIONS)");
    expect(navigationConfig).toContain("isProductModuleEnabled(item.lifecycle.key)");
    expect(navigationConfig).toContain(
      "isPlatformCapabilityEnabled(item.lifecycle.key)",
    );
    expect(navigationConfig).not.toContain("@/app/config/launchScope");
    expect(navigationConfig).not.toContain("filterLaunchSections");
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
    expect(appShell).toContain("const MESSAGING_INBOX_PATH = messagingRoutes.inbox();");
    expect(appShell).toContain("pathname.startsWith(`${MESSAGING_INBOX_PATH}/`)");
    expect(appShell).not.toContain('pathSegments[0] === "mensagens"');
    expect(appShell).toContain('pathSegments[0] === "conta"');
  });

  it("declares every active-shell destination against an explicit lifecycle owner", () => {
    for (const product of [
      "community",
      "business",
      "gastronomy",
      "services",
      "education",
      "classifieds",
      "jobs",
      "events",
      "mobility",
    ]) {
      expect(navigationConfig).toContain(`kind: 'product', key: '${product}'`);
    }

    for (const capability of ["central", "nearby", "map", "search"]) {
      expect(navigationConfig).toContain(
        `kind: 'capability', key: '${capability}'`,
      );
    }

    expect(navigationConfig).toContain("lifecycle: { kind: 'always' }");
  });

  it("derives active navigation hrefs from canonical route owners", () => {
    expect(notificationRoutes).toContain('inbox: () => "/notificacoes"');
    expect(navigationConfig).toContain("href: notificationRoutes.inbox()");
    expect(navigationConfig).toContain("href: centralRoutes.home");
    expect(navigationConfig).toContain("href: NAV_MODULE_ROOTS.search");
    expect(navigationConfig).not.toContain("href: '/notificacoes'");
    expect(navigationConfig).not.toContain("href: '/central'");
    expect(navigationConfig).not.toContain("href: '/busca'");
    expect(appUrls).toContain("notifications: notificationRoutes.inbox()");
    expect(appUrls).not.toContain("notifications: '/notificacoes'");
  });

  it("keeps the rendered desktop sidebar limited by lifecycle-filtered navigation", () => {
    expect(appSidebar).toContain("NAV_SECTIONS.map");
    expect(appSidebar).not.toContain("gastronomyPublicRoutes");
    expect(appSidebar).not.toContain("professionalPublicRoutes");
    expect(appSidebar).not.toContain("mobilityRoutes");
  });
});
