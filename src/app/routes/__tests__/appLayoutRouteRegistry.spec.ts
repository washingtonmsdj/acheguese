import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES } from "../sections/AppLayoutRouteRegistry";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("AppLayoutRouteRegistry", () => {
  it("keeps only active Business and Map territorial descriptors", () => {
    expect(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id)).toEqual([
      "business-detail",
      "business-category-city",
      "business-category-district",
      "business-district",
      "business-city",
      "map-district",
      "map-city",
    ]);

    const ids = APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates canonical Business and Map territorial paths", () => {
    const pathsById = new Map(
      APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => [route.id, route.path]),
    );

    expect(pathsById.get("business-detail")).toBe(
      "/empresas/:state/:city/:district/:slug",
    );
    expect(pathsById.get("business-category-city")).toBe(
      "/empresas/:state/:city/categoria/:category",
    );
    expect(pathsById.get("business-district")).toBe(
      "/empresas/:state/:city/:district",
    );
    expect(pathsById.get("map-district")).toBe(
      "/mapa/:state/:city/:district",
    );
    expect(pathsById.get("map-city")).toBe("/mapa/:state/:city");
  });

  it("derives route inclusion from the canonical lifecycle without paused fallbacks", () => {
    const registrySource = readProjectFile(
      "src/app/routes/sections/AppLayoutRouteRegistry.tsx",
    );

    expect(registrySource).toContain("isProductModuleEnabled");
    expect(registrySource).toContain("isPlatformCapabilityEnabled");
    expect(registrySource).not.toContain("LaunchPausedPage");
    expect(registrySource).not.toContain("pausedModuleName");
    expect(registrySource).not.toContain('"services-');
    expect(registrySource).not.toContain('"classified-');
    expect(registrySource).not.toContain('"events-');
  });

  it("keeps AppLayoutRoutes consuming the active registry instead of re-declaring it", () => {
    const appLayoutRoutes = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );

    expect(appLayoutRoutes).toContain("APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES");
    expect(appLayoutRoutes).toContain("renderAppLayoutRouteDescriptors");
    expect(appLayoutRoutes).not.toContain(
      "<P.TerritorialCategoryBusinessPage />",
    );
    expect(appLayoutRoutes).not.toContain("<P.TerritorialMapPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialServicesPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialClassificadosPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialEventosPage />");
  });
});
