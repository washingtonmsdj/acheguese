import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { resolveGastronomyProximity } from "../utils/proximity";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function collectCodeFiles(directoryPath: string): string[] {
  const entries = readdirSync(directoryPath);
  const files: string[] = [];

  for (const entry of entries) {
    const absoluteEntryPath = resolve(directoryPath, entry);
    const stats = statSync(absoluteEntryPath);

    if (stats.isDirectory()) {
      files.push(...collectCodeFiles(absoluteEntryPath));
      continue;
    }

    if (absoluteEntryPath.endsWith(".ts") || absoluteEntryPath.endsWith(".tsx")) {
      files.push(absoluteEntryPath);
    }
  }

  return files;
}

describe("gastronomy runtime boundaries", () => {
  it("keeps public runtime pages free from mock imports", () => {
    const landing = read("src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx");
    const detail = read("src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx");

    expect(landing).not.toContain("__mocks__");
    expect(detail).not.toContain("__mocks__");
  });

  it("avoids generic hardcoded gastronomy navigation outside the SSOT", () => {
    const nearbyPage = read("src/app/pages/NearbyPage.tsx");

    expect(nearbyPage).not.toContain("navigate('/gastronomia')");
    expect(nearbyPage).toContain("moduleUrls.gastronomy");
  });

  it("allows mock imports only inside __mocks__/__tests__ or gated dev runtime adapters", () => {
    const gastronomyRoot = resolve(root, "src/modules/business/gastronomy");
    const codeFiles = collectCodeFiles(gastronomyRoot);

    const invalidImports = codeFiles.filter((filePath) => {
      const normalizedPath = filePath.replace(/\\/g, "/");
      const isMockOrTestFile =
        normalizedPath.includes("/__mocks__/") || normalizedPath.includes("/__tests__/");

      if (isMockOrTestFile) return false;

      const content = readFileSync(filePath, "utf8");
      if (!content.includes("__mocks__/")) return false;

      const isDevRuntimeAdapter = normalizedPath.includes("/src/modules/business/gastronomy/dev/");
      if (isDevRuntimeAdapter && content.includes("import.meta.env.DEV")) {
        return false;
      }

      return true;
    });

    expect(invalidImports).toEqual([]);
  });

  it("keeps legacy menu mutations out of public service barrels", () => {
    const serviceBarrel = read("src/modules/business/gastronomy/services/index.ts");
    const facade = read("src/modules/business/gastronomy/services/GastronomyService.ts");

    expect(serviceBarrel).not.toContain("menu.mutations");
    expect(facade).not.toContain("menu.mutations");
    expect(serviceBarrel).not.toContain("gastronomy.mutations");
    expect(facade).not.toContain("gastronomy.mutations");
    expect(facade).not.toContain("class GastronomyService");
    expect(facade).not.toContain("export default");
    expect(serviceBarrel).toContain("MenuService");
    expect(serviceBarrel).not.toContain("isGastronomyBusinessOpen");
    expect(facade).not.toContain("helpers:");
    expect(
      existsSync(
        resolve(root, "src/modules/business/gastronomy/services/gastronomy.helpers.ts"),
      ),
    ).toBe(false);
  });

  it("keeps the retired duplicate favoriters hook out of the runtime API", () => {
    const hooksBarrel = read("src/modules/business/gastronomy/hooks/index.ts");
    const hooksReadme = read("src/modules/business/gastronomy/hooks/README.md");

    expect(
      existsSync(
        resolve(
          root,
          "src/modules/business/gastronomy/hooks/useGastronomyFavoriters.ts",
        ),
      ),
    ).toBe(false);
    expect(hooksBarrel).not.toContain("useGastronomyFavoriters");
    expect(hooksReadme).not.toContain("useGastronomyFavoritersCount");
    expect(hooksReadme).toContain("BusinessFavoriteStore");
  });

  it("keeps gastronomy read queries implemented only in core business", () => {
    const retiredModuleQueries = resolve(
      root,
      "src/modules/business/gastronomy/services/gastronomy.queries.ts",
    );
    const coreQueries = read("src/core/business/services/gastronomy.queries.ts");

    expect(existsSync(retiredModuleQueries)).toBe(false);
    expect(coreQueries).toContain("fetchActiveGastronomyProfileByBusinessDataId");
    expect(coreQueries).toContain("BusinessService.toBusinessReadModel");
  });
});

describe("gastronomy proximity ssot", () => {
  it("returns null when distance input is invalid", () => {
    expect(resolveGastronomyProximity(undefined)).toBeNull();
    expect(resolveGastronomyProximity(Number.NaN)).toBeNull();
    expect(resolveGastronomyProximity(-5)).toBeNull();
  });

  it("formats distance in km and minutes from user", () => {
    expect(resolveGastronomyProximity(1550)).toEqual({
      distanceKm: 1.55,
      distanceLabel: "1,6 km",
      etaMinutes: 4,
      etaLabel: "4 min",
      summaryLabel: "1,6 km - 4 min",
    });
  });
});
