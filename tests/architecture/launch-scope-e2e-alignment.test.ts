import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";
import { PLATFORM_CAPABILITY_REGISTRY } from "../../src/app/config/platformCapabilityRegistry";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const searchProviders = read("src/core/search/providers/searchProviders.ts");
const searchPage = read("src/app/pages/BuscaPage.tsx");
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
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby.dependsOnProductModules).toEqual([
      "business",
    ]);

    expect(launchScope).toContain(
      'search: isPlatformCapabilityEnabled("search")',
    );
    expect(launchScope).toContain(
      'map: isPlatformCapabilityEnabled("map")',
    );
    expect(launchScope).toContain(
      'nearby: isPlatformCapabilityEnabled("nearby")',
    );
    expect(appRoutes).toContain('launchElement("map", "Mapa"');
    expect(appRoutes).toContain('launchElement("nearby", "Perto de mim"');
    expect(appRoutes).toContain('launchElement("search", "Busca"');
  });

  it("limits global search providers to launch-enabled domains", () => {
    expect(searchProviders).toContain(
      'bucket: "professionals",\n  linkedEntityTypes: ["professional"],\n  isEnabled: () => isLaunchSurfaceEnabled("services")',
    );
    expect(searchProviders).toContain(
      'bucket: "opportunities",\n  linkedEntityTypes: [],\n  isEnabled: () => isLaunchSurfaceEnabled("jobs")',
    );
    expect(searchProviders).toContain(
      'bucket: "events",\n  linkedEntityTypes: ["event"],\n  isEnabled: () => isLaunchSurfaceEnabled("events")',
    );
    expect(searchProviders).toContain(
      'bucket: "businesses",\n  linkedEntityTypes: ["business"],\n  isEnabled: () => isLaunchSurfaceEnabled("business")',
    );

    expect(searchPage).toContain('launchSurface: "community"');
    expect(searchPage).toContain('launchSurface: "services"');
    expect(searchPage).toContain('launchSurface: "classifieds"');
    expect(searchPage).toContain('surface: "services"');
    expect(searchPage).toContain('surface: "classifieds"');
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

  it("keeps representative paused routes in the public isolation E2E", () => {
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
