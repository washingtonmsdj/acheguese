import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";
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

const MAP_LAYER_LAUNCH_SURFACES: Partial<Record<MapLayerKey, Parameters<typeof isLaunchSurfaceEnabled>[0]>> = {
  businesses: "business",
  gastronomy: "gastronomy",
  services: "services",
  classifieds: "classifieds",
  events: "events",
  alerts: "communityAlerts",
  tourist_points: "touristPoints",
};

export function isMapRuntimeLayerEnabled(key: MapLayerKey): boolean {
  const surface = MAP_LAYER_LAUNCH_SURFACES[key];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

export const MAP_PUBLIC_RUNTIME_LAYER_KEYS: MapLayerKey[] =
  MAP_RUNTIME_LAYER_KEYS.filter(isMapRuntimeLayerEnabled);

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
