import { ModuleKey } from "@/core/rollout/types";

export type NearbyProviderId = "business";

export interface NearbyProviderDefinition {
  id: NearbyProviderId;
  label: string;
  territoryModuleKey: ModuleKey;
}

const NEARBY_PROVIDERS: Record<NearbyProviderId, NearbyProviderDefinition> = {
  business: {
    id: "business",
    label: "Empresas",
    territoryModuleKey: ModuleKey.BUSINESS,
  },
};

export const NEARBY_PROVIDER_ORDER: readonly NearbyProviderId[] = ["business"];

export function getNearbyProvider(
  providerId: NearbyProviderId,
): NearbyProviderDefinition | null {
  return NEARBY_PROVIDERS[providerId] ?? null;
}

export function getNearbyTerritoryModuleKey(
  providerId: NearbyProviderId,
): ModuleKey {
  return NEARBY_PROVIDERS[providerId].territoryModuleKey;
}
