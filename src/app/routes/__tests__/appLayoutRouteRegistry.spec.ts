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
  it("keeps only active MVP territorial descriptors", () => {
    expect(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id)).toEqual([
      "business-detail",
      "business-category-city",
      "business-category-territory",
      "business-territory",
      "business-city",
      "map-territory",
      "map-city",
      "nearby-territory",
      "nearby-city",
    ]);

    const ids = APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates canonical territory-first MVP paths", () => {
    const pathsById = new Map(
      APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => [route.id, route.path]),
    );

    expect(pathsById.get("business-detail")).toBe(
      "/:state/:city/:territorySlug/empresas/:slug",
    );
    expect(pathsById.get("business-category-city")).toBe(
      "/:state/:city/empresas/categoria/:category",
    );
    expect(pathsById.get("business-territory")).toBe(
      "/:state/:city/:territorySlug/empresas",
    );
    expect(pathsById.get("map-territory")).toBe(
      "/:state/:city/:territorySlug/mapa",
    );
    expect(pathsById.get("map-city")).toBe("/:state/:city/mapa");
    expect(pathsById.get("nearby-territory")).toBe(
      "/:state/:city/:territorySlug/perto-de-mim",
    );
    expect(pathsById.get("nearby-city")).toBe("/:state/:city/perto-de-mim");
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
