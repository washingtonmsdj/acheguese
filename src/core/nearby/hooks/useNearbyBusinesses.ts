import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useSpatialSearchByRadius,
  useSpatialSearchHybrid,
} from "@/core/geospatial/hooks/useSpatialSearch";
import type { NearbyBusiness } from "../domain/types";

export interface UseNearbyBusinessesOptions {
  radiusKm: number;
  center: { latitude: number; longitude: number } | null;
  locationId?: string;
  locationIds?: string[];
  limit?: number;
  enabled?: boolean;
}

/**
 * Business adapter for the horizontal Nearby capability.
 *
 * The adapter stays in stable React hook order, but performs no spatial or
 * Business-owner work unless the lifecycle-scoped provider is enabled.
 */
export function useNearbyBusinesses(options: UseNearbyBusinessesOptions) {
  const providerEnabled = options.enabled !== false;
  const center = options.center;
  const locationIds = useMemo(
    () => [...new Set((options.locationIds ?? []).filter(Boolean))],
    [options.locationIds],
  );
  const usesGroupFilter = locationIds.length > 1;
  const effectiveLocationId =
    options.locationId ?? (locationIds.length === 1 ? locationIds[0] : undefined);

  const radiusSpatial = useSpatialSearchByRadius({
    center: center ?? { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: "business",
    locationId: effectiveLocationId,
    limit: options.limit,
    enabled: providerEnabled && center !== null && !usesGroupFilter,
  });
  const groupSpatial = useSpatialSearchHybrid({
    center: center ?? { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: "business",
    locationIds,
    limit: options.limit,
    enabled: providerEnabled && center !== null && usesGroupFilter,
  });

  const spatialResults = useMemo(
    () =>
      providerEnabled
        ? usesGroupFilter
          ? (groupSpatial.data ?? []).filter((item) => item.in_territory === true)
          : (radiusSpatial.data ?? [])
        : [],
    [groupSpatial.data, providerEnabled, radiusSpatial.data, usesGroupFilter],
  );
  const ids = useMemo(
    () => [...new Set(spatialResults.map((item) => item.id))],
    [spatialResults],
  );

  const details = useQuery({
    queryKey: ["nearby", "business-provider", "details", ids],
    queryFn: async (): Promise<NearbyBusiness[]> => {
      const [{ BusinessService }, { BusinessUrlService }] = await Promise.all([
        import("@/core/business/services/BusinessService"),
        import("@/core/business/services/BusinessUrlService"),
      ]);
      const businesses = await BusinessService.getBusinessesByIds(ids);
      const byId = new Map(
        businesses.map((business) => [business.id, business]),
      );

      return spatialResults.flatMap((spatialBusiness) => {
        const business = byId.get(spatialBusiness.id);
        if (!business?.slug || !business.geographic_path) return [];

        let canonicalUrl: string;
        try {
          canonicalUrl = BusinessUrlService.getPublicCanonicalUrl({
            id: business.id,
            slug: business.slug,
            is_premium: business.is_premium,
            geographic_path: business.geographic_path,
          });
        } catch {
          return [];
        }

        return [{
          id: business.id,
          name: business.name,
          category: business.category,
          distanceMeters: spatialBusiness.distance_meters ?? 0,
          latitude: spatialBusiness.latitude,
          longitude: spatialBusiness.longitude,
          canonicalUrl,
          neighborhood: business.neighborhood,
          city: business.city,
          logo: business.logo,
          rating: business.rating ?? 0,
          verified: business.verified ?? false,
        }];
      });
    },
    enabled: providerEnabled && ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    businesses: providerEnabled ? (details.data ?? []) : [],
    isLoading:
      providerEnabled &&
      ((usesGroupFilter ? groupSpatial.isLoading : radiusSpatial.isLoading) ||
        (ids.length > 0 && details.isLoading)),
    isError:
      providerEnabled &&
      ((usesGroupFilter ? groupSpatial.isError : radiusSpatial.isError) ||
        details.isError),
  };
}
