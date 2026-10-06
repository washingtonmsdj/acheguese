import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const appLayout = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const appShell = read("src/app/components/AppLayoutSidebar.tsx");
const messagingInboxPage = read("src/app/pages/MessagingInboxPage.tsx");
const messagingRoutes = read("src/core/messaging/routes/messagingRoutes.ts");
const messagingCss = read("src/modules/messaging/pages/MensagensPage.css");
const routeRegistry = read(
  "src/app/routes/sections/AppLayoutRouteRegistry.tsx",
);
const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
const prefetch = read("src/app/routes/prefetch.ts");
const activeTerritorialPages = read(
  "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
);

describe("active AppLayout route boundary", () => {
  it("does not mount paused product modules or paused fallbacks", () => {
    expect(
      existsSync("src/app/routes/sections/CommunityTerritoryRoutes.tsx"),
    ).toBe(false);
    expect(existsSync("src/app/routes/lazyImports.ts")).toBe(false);
    expect(
      existsSync("src/app/routes/territorial/TerritorialModulePages.tsx"),
    ).toBe(false);
    expect(existsSync("src/app/routes/launchPausedComponent.ts")).toBe(false);
    expect(existsSync("src/app/pages/LaunchPausedPage.tsx")).toBe(false);

    for (const forbidden of [
      "DIRECT_PAUSED_ROUTES",
      "LaunchPausedPage",
      "launchElement(",
      "CommunityTerritoryRoutes",
      "mobilityRoutes",
      "gastronomyPublicRoutes",
      "professionalPublicRoutes",
      "touristPointPublicRoutes",
      "isFeatureEnabled",
      '"../lazyImports"',
    ]) {
      expect(appLayout).not.toContain(forbidden);
    }

    for (const pausedPath of [
      'path="/planos"',
      'path="/classificados',
      'path="/servicos',
      'path="/educacao"',
      'path="/comunicacao',
      'path="/cupons',
      'path="/analytics"',
      'path="/alertas"',
      'path="/problemas"',
      'path="/recomendacoes',
      'path="/achados-perdidos',
      'path="/ranking"',
      'path="/gamificacao"',
    ]) {
      expect(appLayout).not.toContain(pausedPath);
    }

    expect(appLayout).toContain('<Route path="*" element={<P.NotFound />} />');
  });

  it("derives mounted active surfaces from the canonical lifecycle", () => {
    expect(appLayout).toContain('isProductModuleEnabled("business")');
    for (const capability of [
      "profiles",
      "account",
      "territory",
      "map",
      "nearby",
      "search",
      "notifications",
      "messaging",
    ]) {
      expect(appLayout).toContain(
        `isPlatformCapabilityEnabled("${capability}")`,
      );
    }

    expect(appLayout).toContain('path="/empresas"');
    expect(appLayout).toContain('path="/mapa"');
    expect(appLayout).toContain('path="/perto-de-mim"');
    expect(appLayout).toContain('path="/busca"');
    expect(appLayout).toContain('path="/notificacoes"');
    expect(appLayout).toContain("path={ACCOUNT_PATHS.notifications}");
    expect(appLayout).toContain("messagingRoutes.inbox()");
    expect(appLayout).toContain("messagingRoutes.threadPattern()");
    expect(messagingRoutes).toContain('inbox: () => "/mensagens"');
  });

  it("keeps Messaging inbox in the app shell while threads use focused conversation mode", () => {
    expect(appShell).toContain(
      "const MESSAGING_INBOX_PATH = messagingRoutes.inbox();",
    );
    expect(appShell).toContain(
      "pathname.startsWith(`${MESSAGING_INBOX_PATH}/`) && pathSegments.length >= 3",
    );
    expect(appShell).not.toContain('pathSegments[0] === "mensagens"');
    expect(appShell).toContain("if (isConversationRoute)");
    expect(appShell).not.toContain("if (isMessagingRoute)");
    expect(appShell).toContain(
      'className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas"',
    );
    expect(appShell).toContain("<AppSidebar />");
    expect(appShell).toContain("<AppTopbar />");
    expect(messagingInboxPage).toContain("getActiveMessagingProviderIds()");
    expect(messagingInboxPage).not.toContain("PublicBrandHeader");
    expect(messagingInboxPage).not.toContain("LAUNCH_URLS");

    const inboxRule = messagingCss.match(/\.messaging-inbox \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(inboxRule).toContain("min-height: 0;");
    expect(inboxRule).not.toContain("height: 100dvh");
    expect(messagingCss).toContain(
      ".messaging-route-shell .messaging-inbox {\n  height: 100%;\n}",
    );
  });

  it("keeps prefetch and idle warmup limited to selected active chunks", () => {
    for (const forbidden of [
      "@/modules/professionals",
      "@/modules/classifieds",
      "@/modules/business/gastronomy",
      "@/core/community-feed",
      "@/modules/guide",
      "APP_MODULE_SLUGS.services",
      "APP_MODULE_SLUGS.classifieds",
      "APP_MODULE_SLUGS.gastronomy",
      "APP_MODULE_SLUGS.community",
      "APP_MODULE_SLUGS.touristPoints",
    ]) {
      expect(prefetch).not.toContain(forbidden);
    }

    for (const activeOwner of [
      "@/app/pages/EmpresasLandingPage",
      "@/app/pages/MapaPage",
      "@/app/pages/NearbyPage",
      "@/app/pages/BuscaPage",
    ]) {
      expect(prefetch).toContain(activeOwner);
    }

    expect(prefetch).not.toContain("@/app/config/launchScope");
    expect(prefetch).toContain('isProductModuleEnabled("business")');
    // Messaging/Notifications are active, but intentionally not idle-warmed.
    expect(prefetch).not.toContain('import("@/app/pages/NotificationsPage")');
    expect(prefetch).not.toContain('import("@/app/pages/MessagingInboxPage")');
  });

  it("keeps active lazy graph limited to certified owners", () => {
    for (const forbidden of [
      "createLaunchPausedRoute",
      "LaunchPausedPage",
      "@/modules/business/gastronomy",
      "@/modules/professionals",
      "@/modules/classifieds",
      "@/modules/community-",
      "@/modules/business/education",
      "@/core/mobility",
    ]) {
      expect(activeLazyImports).not.toContain(forbidden);
    }

    for (const activeOwner of [
      "EmpresasLandingPage",
      "MapaPage",
      "NearbyPage",
      "NotificationsPage",
      "NotificationPreferencesPage",
      "MessagingInboxPage",
    ]) {
      expect(activeLazyImports).toContain(activeOwner);
    }
  });

  it("keeps territorial registry limited to active territorial owners", () => {
    for (const activeId of [
      "business-detail",
      "business-category-city",
      "business-category-territory",
      "business-territory",
      "business-city",
      "map-territory",
      "map-city",
      "nearby-territory",
      "nearby-city",
    ]) {
      expect(routeRegistry).toContain(`id: "${activeId}"`);
    }

    for (const pausedMarker of [
      "services-",
      "classified-",
      "events-",
      "LaunchPausedPage",
      "pausedModuleName",
    ]) {
      expect(routeRegistry).not.toContain(pausedMarker);
    }

    expect(routeRegistry).toContain("isProductModuleEnabled");
    expect(routeRegistry).toContain("isPlatformCapabilityEnabled");
  });

  it("keeps active territorial wrappers on the canonical Territory portal owner", () => {
    expect(activeTerritorialPages).toContain("CategoryBusinessPage");
    expect(activeTerritorialPages).toContain("@/app/pages/TerritoryHomePage");
    expect(activeTerritorialPages).toContain('<TerritoryHomePage activeView="map" />');
    expect(activeTerritorialPages).toContain('<TerritoryHomePage activeView="business" />');
    expect(activeTerritorialPages).toContain('<TerritoryHomePage activeView="nearby" />');
    expect(activeTerritorialPages).toContain('<TerritoryHomePage activeView="search" />');
    expect(activeTerritorialPages).not.toContain("@/app/pages/MapaPage");

    for (const pausedImport of [
      "community-feed",
      "professionals",
      "classifieds",
      "community-events",
      "gastronomy",
      "education",
      "mobility",
      "VagasPublicPage",
      "createLaunchPausedRoute",
    ]) {
      expect(activeTerritorialPages).not.toContain(pausedImport);
    }
  });
});
