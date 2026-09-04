import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const retiredRuntimeFixtures = [
  "src/core/business/fixtures/tonePizzariaRouteFixture.ts",
  "src/modules/business/public/fixtures/tonePizzariaPublicSnapshotFixture.ts",
  "src/modules/business/company/fixtures/tonePizzariaVisualFixture.ts",
];

const runtimeAuthorities = [
  "src/core/business/services/BusinessUrlService.ts",
  "src/modules/business/public/services/PublicBusinessSnapshotService.ts",
  "src/app/pages/EmpresaDetailLandingPage.tsx",
];

describe("G6 Business test fixture boundary", () => {
  it("keeps demo business fixtures out of runtime source", () => {
    for (const relativePath of retiredRuntimeFixtures) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }

    for (const relativePath of runtimeAuthorities) {
      const source = readFileSync(join(ROOT, relativePath), "utf8");
      expect(source).not.toMatch(
        /tonePizzaria|TonePizzaria|tone-cos-loja|mock-tone-pizzaria/,
      );
    }
  });

  it("keeps the replacement fixture under Playwright test support", () => {
    const support = join(
      ROOT,
      "tests",
      "e2e",
      "support",
      "businessRouteFixtures.ts",
    );
    expect(existsSync(support)).toBe(true);
    expect(readFileSync(support, "utf8")).toContain(
      "installBusinessRouteFixtures",
    );
  });
});
