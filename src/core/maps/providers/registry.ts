import type {
  MapLayerProviderDefinition,
  MapLayerProviderId,
  MapLayerProviderRuntime,
} from "./types";

const MAP_LAYER_PROVIDERS = {
  business: {
    id: "business",
    layerKey: "businesses",
    label: "Empresas",
    load: async () => {
      const module = await import("./businessMapLayerProvider");
      return module.businessMapLayerProvider;
    },
  },
} satisfies Record<MapLayerProviderId, MapLayerProviderDefinition>;

export const MAP_LAYER_PROVIDER_ORDER: readonly MapLayerProviderId[] = [
  "business",
];

export function getMapLayerProviderDefinition(
  providerId: MapLayerProviderId,
): MapLayerProviderDefinition | null {
  switch (providerId) {
    case "business":
      return MAP_LAYER_PROVIDERS.business;
  }
}

export async function loadMapLayerProvider(
  providerId: MapLayerProviderId,
): Promise<MapLayerProviderRuntime> {
  const definition = getMapLayerProviderDefinition(providerId);
  if (!definition) {
    throw new Error(`Unknown Map layer provider: ${providerId}`);
  }
  return definition.load();
}
