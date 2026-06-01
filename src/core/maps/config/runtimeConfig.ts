import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import type { MapLayerKey } from "../types/core";

export const MAP_RUNTIME_LAYER_KEYS: MapLayerKey[] = [
  "businesses",
  "gastronomy",
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
    owner: "src/app/routes/territorial/TerritorialModulePages.tsx",
    status: "official",
    note: "Superficie territorial canonica do mapa.",
  },
  {
    route: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map, [
      TERRITORIAL_ROUTE_PARAMS.district,
    ]),
    owner: "src/app/routes/territorial/TerritorialModulePages.tsx",
    status: "official",
    note: "Mapa contextual por bairro.",
  },
  {
    route: "/perto-de-mim",
    owner: "src/pages/NearbyPage.tsx",
    status: "attention",
    note: "Superficie ativa, mas ainda fora do ownership direto de core/maps.",
  },
];
