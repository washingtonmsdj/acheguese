import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";
import { PLATFORM_CAPABILITY_REGISTRY } from "../../src/app/config/platformCapabilityRegistry";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const nearbyProviderScope = read("src/app/config/nearbyProviderScope.ts");
const searchProviderScope = read("src/app/config/searchProviderScope.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const searchProviders = read("src/core/search/providers/searchProviders.ts");
const searchPage = read("src/app/pages/BuscaPage.tsx");
const publicCitySelector = read(
  "src/app/components/navigation/PublicCitySelector.tsx",
);
const screenMap = read("docs/SCREEN-MAP.md");
const featureMap = read("docs/FEATURE-MAP.md");
const homeInventory = read("docs/05-ux/HOME-INVENTORY.md");

describe("MVP launch-scope alignment", () => {
  it("keeps Business as the active domain while Map/Nearby/Search are horizontal capabilities", () => {
    expect(PRODUCT_MODULE_REGISTRY.business.status).toBe("active");

    for (const moduleKey of [
      "community",
      "gastronomy",
      "services",
      "classifieds",
      "touristPoints",
      "jobs",
      "events",
      "communityCommunication",
    ] as const) {
      expect(PRODUCT_MODULE_REGISTRY[moduleKey].status, moduleKey).toBe("paused");
    }

    expect(PLATFORM_CAPABILITY_REGISTRY.map.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.search.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby.dependsOnCapabilities).toEqual([
      "map",
      "location",
    ]);
    expect(
      PLATFORM_CAPABILITY_REGISTRY.nearby.dependsOnProductModules,
    ).toBeUndefined();
    expect(nearbyProviderScope).toContain(
      'isPlatformCapabilityEnabled("nearby")',
    );
    expect(nearbyProviderScope).toContain(
      "isProductModuleEnabled(productModule)",
    );

    expect(launchScope).toContain(
      'search: isPlatformCapabilityEnabled("search")',
    );
    expect(launchScope).toContain(
      'map: isPlatformCapabilityEnabled("map")',
    );
    expect(launchScope).toContain(
      'nearby: isPlatformCapabilityEnabled("nearby")',
    );
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("map")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("nearby")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("search")');
    expect(appRoutes).not.toContain("launchElement(");
    expect(appRoutes).not.toContain("LaunchPausedPage");
  });

  it("limits global search providers through the app lifecycle scope", () => {
    expect(searchProviders).not.toContain("@/app/config/launchScope");
    expect(searchProviders).not.toContain("isLaunchSurfaceEnabled");
    expect(searchProviders).toContain("SEARCH_PROVIDER_BUCKET_ORDER");
    expect(searchProviderScope).toContain(
      'isPlatformCapabilityEnabled("search")',
    );
    expect(searchProviderScope).toContain(
      "isProductModuleEnabled(productModule)",
    );
    expect(searchProviderScope).toContain('businesses: "business"');
    expect(searchProviderScope).toContain('professionals: "services"');
    expect(searchProviderScope).toContain('opportunities: "jobs"');
    expect(searchProviderScope).toContain('events: "events"');
    expect(searchProviderScope).toContain('posts: "community"');

    expect(searchPage).toContain("getActiveSearchProviderBuckets()");
    expect(searchPage).toContain(
      "providerBuckets: activeSearchProviderBuckets",
    );
    expect(searchPage).toContain('providerBucket: "businesses"');
    expect(searchPage).toContain('providerBucket: "professionals"');
    expect(searchPage).toContain('surface: "services"');
    expect(searchPage).toContain('surface: "classifieds"');
    expect(searchPage).toContain("isProductModuleEnabled(item.surface)");
    expect(searchPage).toContain('isProductModuleEnabled("education")');
    expect(searchPage).not.toContain("@/app/config/launchScope");
    expect(searchPage).not.toContain("isLaunchSurfaceEnabled");

    expect(publicCitySelector).toContain("isProductModuleEnabled(entry.surface)");
    expect(publicCitySelector).toContain(
      "isPlatformCapabilityEnabled(entry.surface)",
    );
    expect(publicCitySelector).not.toContain("@/app/config/launchScope");
    expect(publicCitySelector).not.toContain("isLaunchSurfaceEnabled");
  });

  it("keeps active documentation aligned with domain/capability lifecycle", () => {
    for (const source of [screenMap, homeInventory]) {
      for (const flag of [
        "map=true",
        "nearby=true",
        "search=true",
        "messaging=true",
        "billing=false",
        "services=false",
        "events=false",
        "mobility=false",
      ]) {
        expect(source, flag).toContain(flag);
      }
    }

    expect(featureMap).toContain("Domínio de produto ativo");
    expect(featureMap).toContain("Empresas (`business`)");
    expect(featureMap).toContain("Capacidades horizontais ativas");
    expect(featureMap).toContain("Business Direct Messaging");
    expect(featureMap).toContain("Community;");
    expect(featureMap).toContain("Classificados;");
    expect(featureMap).toContain("Billing.");
    expect(featureMap).not.toContain("messaging=false");
  });

  it("keeps representative paused routes in the public 404 E2E", () => {
    expect(launchE2e).toContain("expectNotFoundPublicRoute");
    expect(launchE2e).not.toContain("expectPausedLaunchSurface");
    for (const path of [
      "/gastronomia",
      "/servicos",
      "/vagas",
      "/eventos",
      "/educacao",
      "/mobilidade",
    ]) {
      expect(launchE2e).toContain(`'${path}'`);
    }
  });
});
