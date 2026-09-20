import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const launchE2e = read("tests/e2e/launch-scope-public.spec.ts");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const screenMap = read("docs/SCREEN-MAP.md");
const featureMap = read("docs/FEATURE-MAP.md");
const homeInventory = read("docs/05-ux/HOME-INVENTORY.md");

describe("MVP launch-scope E2E alignment", () => {
  it("does not classify enabled community messaging as paused", () => {
    expect(launchScope).toContain("communityCommunication: true");
    expect(launchE2e).not.toContain("'/mensagens'");
    expect(appRoutes).toContain('path="/mensagens"');
    expect(appRoutes).toContain('"communityCommunication"');
    expect(appRoutes).toContain("protectedElement(");
  });

  it("keeps active launch documentation aligned with paused MVP surfaces", () => {
    const pausedFlags = [
      "billing=false",
      "education=false",
      "communication=false",
      "mobility=false",
      "coupons=false",
      "gamification=false",
      "communityAlerts=false",
      "communityIssues=false",
      "communityLostFound=false",
    ];

    for (const flag of pausedFlags) {
      expect(
        [screenMap, featureMap, homeInventory].some((source) =>
          source.includes(flag),
        ),
        flag,
      ).toBe(true);
    }

    expect(screenMap).toContain("communityCommunication");
    expect(screenMap).toContain("DM comunitária");
    expect(featureMap).toContain("Direct messages comunitário");
    expect(homeInventory).toContain("Mensagens diretas | Sim");
  });

  it("keeps explicitly paused public modules in the launch isolation E2E", () => {
    for (const path of [
      "/educacao",
      "/comunicacao",
      "/cupons",
      "/analytics",
      "/mobilidade",
      "/ranking",
      "/alertas",
      "/problemas",
      "/achados-perdidos",
    ]) {
      expect(launchE2e).toContain(`'${path}'`);
    }
  });
});
