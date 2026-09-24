export type NearbyProviderId = "business";

export interface NearbyProviderDefinition {
  id: NearbyProviderId;
  label: string;
}

const NEARBY_PROVIDERS: Record<NearbyProviderId, NearbyProviderDefinition> = {
  business: {
    id: "business",
    label: "Empresas",
  },
};

export const NEARBY_PROVIDER_ORDER: readonly NearbyProviderId[] = ["business"];

export function getNearbyProvider(
  providerId: NearbyProviderId,
): NearbyProviderDefinition | null {
  return NEARBY_PROVIDERS[providerId] ?? null;
}
