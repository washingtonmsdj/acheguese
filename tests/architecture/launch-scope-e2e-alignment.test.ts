import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const productRegistry = read("src/app/config/productModuleRegistry.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const searchProviders = read("src/core/search/providers/searchProviders.ts");
const searchPage = read("src/app/pages/BuscaPage.tsx");
const screenMap = read("docs/SCREEN-MAP.md");
const featureMap = read("docs/FEATURE-MAP.md");
const homeInventory = read("docs/05-ux/HOME-INVENTORY.md");

describe("MVP launch-scope alignment", () => {
  it("keeps Mapa, Empresas, Perto de mim and Busca active in the product registry", () => {
    expect(productRegistry).toContain('business: { status: "active" }');
    expect(productRegistry).toContain('map: { status: "active" }');
    expect(productRegistry).toContain(
      'nearby: { status: "active", dependsOn: ["map", "business"] }',
    );
    expect(productRegistry).toContain('search: { status: "active" }');

    for (const moduleKey of [
      "community",
      "gastronomy",
      "services",
      "classifieds",
      "touristPoints",
      "jobs",
      "events",
      "messaging",
      "communityCommunication",
    ]) {
      expect(productRegistry).toContain(`${moduleKey}: { status: "paused"`);
    }

    expect(launchScope).toContain('search: isProductModuleEnabled("search")');
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

  it("keeps active documentation aligned with the narrow MVP flags", () => {
    const pausedFlags = [
      "billing=false",
      "gastronomy=false",
      "services=false",
      "touristPoints=false",
      "map=true",
      "nearby=true",
      "search=true",
      "education=false",
      "jobs=false",
      "events=false",
      "communityEventsPreview=false",
      "communication=false",
      "messaging=false",
      "mobility=false",
      "coupons=false",
      "gamification=false",
      "communityCommunication=false",
    ];

    for (const [documentName, source] of [
      ["SCREEN-MAP", screenMap],
      ["FEATURE-MAP", featureMap],
      ["HOME-INVENTORY", homeInventory],
    ] as const) {
      for (const flag of pausedFlags) {
        expect(source, `${documentName}: ${flag}`).toContain(flag);
      }
    }
  });

  it("keeps representative paused routes in the public isolation E2E", () => {
    for (const path of [
      "/gastronomia",
      "/servicos",
      "/vagas",
      "/eventos",
      "/mensagens",
      "/educacao",
      "/mobilidade",
    ]) {
      expect(launchE2e).toContain(`'${path}'`);
    }
  });
});
