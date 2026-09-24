import { mapBusinessLayerRuntimeService } from "@/core/maps/services/MapBusinessLayerRuntimeService";
import { mapEntityProjection } from "@/core/maps/services/MapEntityProjectionService";
import type { TerritoryFilter } from "@/core/location/types";
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from "@/core/routing/utils/territoryUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { EntityStatus } from "@/shared/types/enums";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import type { BoundingBox, MapMarker } from "../types/core";
import type { MapLayerProviderRuntime } from "./types";

const BUSINESS_MAP_BASE_URL = buildAppModulePath(APP_MODULE_SLUGS.business);

function resolveBusinessListUrl(
  resolved: ResolvedTerritory | null,
): string {
  if (!resolved) return BUSINESS_MAP_BASE_URL;

  if (resolved.kind === "location") {
    return buildModuleTerritoryUrl(
      MODULE_SLUGS.business,
      geoPathToPublicUrl(resolved.location.geographic_path),
    );
  }

  const firstMember = resolved.group.members.at(0);
  if (!firstMember?.geographic_path) return BUSINESS_MAP_BASE_URL;

  const [country, state, city] = firstMember.geographic_path
    .split("/")
    .filter(Boolean);
  if (!country || !state || !city) return BUSINESS_MAP_BASE_URL;

  return buildModuleTerritoryUrl(
    MODULE_SLUGS.business,
    buildGroupBaseUrl(resolved.group, `/${country}/${state}/${city}`),
  );
}

function createBusinessFetcher(territoryFilter?: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const businesses =
        await mapBusinessLayerRuntimeService.getBusinessesByBounds(bounds, {
          territoryFilter,
          limit: 200,
        });

      return mapEntityProjection.projectEntities(
        businesses.map((business) => ({
          id: business.id,
          name: business.name,
          latitude: business.latitude,
          longitude: business.longitude,
          status: EntityStatus.ACTIVE,
          slug: business.slug ?? undefined,
          url: business.canonical_url,
          is_premium: business.is_premium,
          is_verified: business.is_verified,
          rating: business.rating,
          category: business.category,
          map_layer_key: "businesses",
        })),
        "business",
        { includeMetadata: true, calculateScore: true },
      );
    } catch {
      return [];
    }
  };
}

export const businessMapLayerProvider: MapLayerProviderRuntime = {
  id: "business",
  layerKey: "businesses",
  label: "Empresas",
  createFetcher: createBusinessFetcher,
  getBrowseLink: (resolved) => ({
    label: "Empresas",
    href: resolveBusinessListUrl(resolved),
  }),
};
