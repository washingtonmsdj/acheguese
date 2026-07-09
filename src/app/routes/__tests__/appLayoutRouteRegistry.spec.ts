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
  it("keeps stable declarative route ids and order for extracted territorial domains", () => {
    expect(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id)).toEqual([
      "business-detail",
      "business-category-city",
      "business-category-district",
      "business-district",
      "business-city",
      "services-district",
      "services-city",
      "classified-detail",
      "classified-subcategory-district",
      "classified-category-district",
      "classified-district",
      "classified-city",
      "events-detail",
      "events-favorites",
      "events-calendar",
      "events-map",
      "events-district",
      "events-city",
      "map-district",
      "map-city",
    ]);

    const ids = APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => route.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates the canonical territorial paths for business, services, and classifieds", () => {
    const pathsById = new Map(
      APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.map((route) => [route.id, route.path]),
    );

    expect(pathsById.get("business-detail")).toBe("/empresas/:state/:city/:district/:slug");
    expect(pathsById.get("business-category-city")).toBe(
      "/empresas/:state/:city/categoria/:category",
    );
    expect(pathsById.get("services-district")).toBe("/servicos/:state/:city/:district");
    expect(pathsById.get("classified-detail")).toBe(
      "/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId",
    );
    expect(pathsById.get("classified-city")).toBe("/classificados/:state/:city");
    expect(pathsById.get("events-detail")).toBe("/eventos/:state/:city/evento/:eventId");
    expect(pathsById.get("events-city")).toBe("/eventos/:state/:city");
    expect(pathsById.get("map-district")).toBe("/mapa/:state/:city/:district");
  });

  it("gates territorial event routes in the route registry itself", () => {
    const eventRoutes = APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES.filter((route) =>
      route.id.startsWith("events-"),
    );

    expect(eventRoutes).toHaveLength(6);
    expect(eventRoutes.every((route) => route.launchSurface === "events")).toBe(true);
    expect(eventRoutes.every((route) => route.pausedModuleName === "Eventos")).toBe(true);

    const appLayoutRoutes = readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx");
    expect(appLayoutRoutes).not.toContain("APP_LAYOUT_EVENT_TERRITORIAL_ROUTES.map");
  });

  it("keeps AppLayoutRoutes consuming the registry instead of re-declaring extracted domains", () => {
    const appLayoutRoutes = readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(appLayoutRoutes).toContain("APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES");
    expect(appLayoutRoutes).toContain("renderAppLayoutRouteDescriptors");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialClassificadosPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialServicesPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialCategoryBusinessPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialEventosPage />");
    expect(appLayoutRoutes).not.toContain("<P.TerritorialMapPage />");
  });
});
