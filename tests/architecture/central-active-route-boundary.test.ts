import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("active Central runtime boundary", () => {
  const routes = read("src/app/routes/sections/CentralRoutes.tsx");
  const lazyGraph = read("src/app/routes/activeCentralLazyImports.ts");
  const hub = read("src/modules/central/pages/CentralHubPage.tsx");
  const navigation = read(
    "src/modules/central/components/centralNavigation.config.ts",
  );
  const shell = read(
    "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
  );
  const overview = read(
    "src/modules/business/dashboard/pages/BusinessOverviewPage.tsx",
  );
  const details = read(
    "src/modules/business/dashboard/pages/BusinessDetailsPage.tsx",
  );

  it("keeps paused domains out of the active Central route graph", () => {
    expect(routes).toContain('from "../activeCentralLazyImports"');
    expect(routes).toContain('isProductModuleEnabled("business")');
    expect(routes).toContain(
      "CentralLayout businessEnabled={businessEnabled}",
    );
    expect(routes).toContain(
      "CentralHubPage businessEnabled={businessEnabled}",
    );
    expect(routes).not.toContain("centralLazyImports");
    expect(routes).not.toContain("LaunchPausedPage");
    expect(routes).not.toContain("launchElement");

    for (const pausedRoute of [
      'path="eventos"',
      'path="comunicacao"',
      'path="profissional"',
      'path="motorista"',
      'path="motoboy"',
      'path="gastronomia"',
      'path="educacao"',
      'path="planos"',
      'path="analytics"',
      'path="anuncios"',
      'path="link-premium"',
    ]) {
      expect(routes).not.toContain(pausedRoute);
    }

    expect(routes).toContain('path="empresas"');
    expect(routes).toContain('path="empresas/nova"');
    expect(routes).toContain('path="empresas/:businessId"');
    expect(routes).toContain('path="editar"');
    expect(routes).toContain('path="dados"');
    expect(routes).toContain('path="configuracoes"');
    expect(routes).toContain('path="*" element={<P.NotFound />}');
  });

  it("keeps the active lazy graph free of post-MVP owners", () => {
    expect(lazyGraph).toContain(
      "Lazy imports reachable from the active Central runtime only.",
    );
    expect(lazyGraph).not.toContain("createLaunchPausedRoute");
    expect(lazyGraph).not.toContain('from "./centralLazyImports"');
    expect(lazyGraph).not.toContain('from "../centralLazyImports"');

    for (const pausedOwner of [
      "EventsOrganizer",
      "Gastronomy",
      "Education",
      "ProfessionalGuard",
      "DriverGuard",
      "CentralMotorista",
      "CentralMotoboy",
      "CommunicationAgent",
      "BusinessPlansPage",
      "BusinessAdsPage",
      "BusinessPremiumSitePage",
      "BusinessAnalyticsPage",
    ]) {
      expect(lazyGraph).not.toContain(pausedOwner);
    }
  });

  it("keeps the Central hub and navigation truthful to the MVP lifecycle", () => {
    for (const pausedReference of [
      "profissional",
      "motorista",
      "motoboy",
      "eventos",
      "comunicacao",
      "servicos.create",
    ]) {
      expect(hub.toLowerCase()).not.toContain(pausedReference);
      expect(navigation.toLowerCase()).not.toContain(pausedReference);
    }

    expect(hub).toContain("businessManagementRoutes.list()");
    expect(hub).toContain("businessManagementRoutes.create()");
    expect(navigation).toContain("businessManagementRoutes.list()");
    expect(navigation).toContain("businessEnabled");
    expect(hub).toContain("businessEnabled");
    expect(navigation).not.toContain("@/app/config");
    expect(hub).not.toContain("@/app/config");
  });

  it("keeps the active Business dashboard independent from paused extensions", () => {
    for (const pausedDependency of [
      "useBusinessSubscription",
      "useGastronomyStatus",
      "isEligibleForVertical",
      "isLaunchSurfaceEnabled",
      "buildBusinessPremiumUrl",
      "businessManagementRoutes.gastronomia",
      "businessManagementRoutes.education",
      "businessManagementRoutes.planos",
      "businessManagementRoutes.anuncios",
      "businessManagementRoutes.linkPremium",
      "businessManagementRoutes.analytics",
    ]) {
      expect(shell).not.toContain(pausedDependency);
      expect(overview).not.toContain(pausedDependency);
    }

    expect(details).not.toContain("Plano premium");
  });
});
