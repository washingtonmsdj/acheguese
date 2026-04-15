import type { MapLayerKey } from "../types/core";

export const MAP_RUNTIME_LAYER_KEYS: MapLayerKey[] = [
  "businesses",
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
    route: "/mapa",
    owner: "src/core/maps/pages/MapaPageV4.tsx",
    status: "official",
    note: "Entrada global do produto mapa.",
  },
  {
    route: "/mapa/:state/:city",
    owner: "src/core/routing/components/TerritorialModulePages.tsx",
    status: "official",
    note: "Superficie territorial canonica do mapa.",
  },
  {
    route: "/mapa/:state/:city/:groupSlugOrDistrict",
    owner: "src/core/routing/components/TerritorialModulePages.tsx",
    status: "official",
    note: "Mapa contextual por bairro ou grupo territorial.",
  },
  {
    route: "/perto-de-mim",
    owner: "src/pages/NearbyPage.tsx",
    status: "attention",
    note: "Superficie ativa, mas ainda fora do ownership direto de core/maps.",
  },
];
