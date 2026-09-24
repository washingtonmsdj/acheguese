import type {
  MapLayerProviderDefinition,
  MapLayerProviderId,
  MapLayerProviderRuntime,
} from "./types";

const MAP_LAYER_PROVIDERS: Record<
  MapLayerProviderId,
  MapLayerProviderDefinition
> = {
  business: {
    id: "business",
    layerKey: "businesses",
    label: "Empresas",
    load: async () => {
      const module = await import("./businessMapLayerProvider");
      return module.businessMapLayerProvider;
    },
  },
};

export const MAP_LAYER_PROVIDER_ORDER: readonly MapLayerProviderId[] = [
  "business",
];

export function getMapLayerProviderDefinition(
  providerId: MapLayerProviderId,
): MapLayerProviderDefinition | null {
  return MAP_LAYER_PROVIDERS[providerId] ?? null;
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
