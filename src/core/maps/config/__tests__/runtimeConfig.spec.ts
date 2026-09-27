import { describe, expect, it } from "vitest";

import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import {
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { MAP_PRODUCT_SURFACES } from "../runtimeConfig";

describe("map runtime config", () => {
  it("keeps public map surfaces aligned with territorial route SSOT", () => {
    const routes = MAP_PRODUCT_SURFACES.map((surface) => surface.route);

    expect(routes).toContain(buildAppModulePath(APP_MODULE_SLUGS.map));
    expect(routes).toContain(buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map));
    expect(routes).toContain(
      buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.map),
    );
    expect(routes).not.toContain("/mapa/:state/:city/:territorySlug");
    expect(routes).not.toContain("/:state/:city/mapa/:district");
  });
});
