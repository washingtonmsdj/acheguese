import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import type { MapLayerKey } from "../types/core";

export const MAP_RUNTIME_LAYER_KEYS: MapLayerKey[] = [
  "businesses",
  "gastronomy",
  "services",
  "classifieds",
  "events",
  "alerts",
  "tourist_points",
];

export interface MapProductSurface {
  route: string;
  owner: string;
  status: "official" | "attention";
  note: string;
}

export const MAP_PRODUCT_SURFACES: MapProductSurface[] = [
  {
    route: buildAppModulePath(APP_MODULE_SLUGS.map),
    owner: "src/core/maps/pages/MapaPageV4.tsx",
    status: "official",
    note: "Entrada global do produto mapa.",
  },
  {
    route: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map),
    owner: "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
    status: "official",
    note: "Superficie territorial canonica do mapa.",
  },
  {
    route: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map, [
      TERRITORIAL_ROUTE_PARAMS.district,
    ]),
    owner: "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
    status: "official",
    note: "Mapa contextual por bairro.",
  },
  {
    route: buildAppModulePath(APP_MODULE_SLUGS.nearby),
    owner: "src/core/nearby/pages/NearbyPage.tsx",
    status: "official",
    note: "Superficie oficial de proximidade; usa localizacao compartilhada, BusinessService e o runtime de mapa.",
  },
];
