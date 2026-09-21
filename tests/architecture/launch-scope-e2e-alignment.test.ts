import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const searchProviders = read("src/core/search/providers/searchProviders.ts");
const screenMap = read("docs/SCREEN-MAP.md");
const featureMap = read("docs/FEATURE-MAP.md");
const homeInventory = read("docs/05-ux/HOME-INVENTORY.md");

describe("narrow MVP launch-scope alignment", () => {
  it("keeps messaging and non-core modules paused without deleting their code", () => {
    for (const flag of [
      "gastronomy: false",
      "services: false",
      "touristPoints: false",
      "map: false",
      "nearby: false",
      "jobs: false",
      "events: false",
      "communityEventsPreview: false",
      "communityCommunication: false",
    ]) {
      expect(launchScope).toContain(flag);
    }

    expect(launchE2e).toContain("'/mensagens'");
    expect(appRoutes).toContain('path="/mensagens"');
    expect(appRoutes).toContain('"communityCommunication"');
    expect(appRoutes).toContain('launchElement("services", "Serviços"');
    expect(appRoutes).toContain('launchElement("map", "Mapa"');
    expect(appRoutes).toContain(
      'launchTerritorialLayout("gastronomy", "Gastronomia")',
    );
    expect(appRoutes).toContain(
      'launchTerritorialLayout("touristPoints", "Pontos turísticos")',
    );
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
  });

  it("keeps active documentation aligned with the narrow MVP flags", () => {
    const pausedFlags = [
      "billing=false",
      "gastronomy=false",
      "services=false",
      "touristPoints=false",
      "map=false",
      "nearby=false",
      "education=false",
      "jobs=false",
      "events=false",
      "communityEventsPreview=false",
      "communication=false",
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
      "/mapa",
      "/perto-de-mim",
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
