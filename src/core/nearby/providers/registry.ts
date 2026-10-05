export type NearbyProviderId = "business";

export interface NearbyProviderDefinition {
  id: NearbyProviderId;
  label: string;
}

const businessNearbyProviderDefinition: NearbyProviderDefinition = {
  id: "business",
  label: "Empresas",
};

export const NEARBY_PROVIDER_ORDER: readonly NearbyProviderId[] = ["business"];

export function getNearbyProvider(
  providerId: NearbyProviderId,
): NearbyProviderDefinition | null {
  switch (providerId) {
    case "business":
      return businessNearbyProviderDefinition;
  }
}
