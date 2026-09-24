import type { TerritoryFilter } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { LayerFetcher } from "../hooks/useMapViewportFetch";
import type { MapLayerKey } from "../types/core";

export type MapLayerProviderId = "business";

export interface MapProviderBrowseLink {
  label: string;
  href: string;
}

export interface MapLayerProviderRuntime {
  id: MapLayerProviderId;
  layerKey: MapLayerKey;
  label: string;
  createFetcher: (territoryFilter?: TerritoryFilter) => LayerFetcher;
  getBrowseLink?: (
    resolved: ResolvedTerritory | null,
  ) => MapProviderBrowseLink | null;
}

export interface MapLayerProviderDefinition {
  id: MapLayerProviderId;
  layerKey: MapLayerKey;
  label: string;
  load: () => Promise<MapLayerProviderRuntime>;
}
