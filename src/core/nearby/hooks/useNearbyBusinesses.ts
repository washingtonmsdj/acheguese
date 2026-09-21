import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { useSpatialSearchByRadius } from "@/core/geospatial/hooks/useSpatialSearch";
import type { NearbyBusiness } from "../domain/types";

export interface UseNearbyBusinessesOptions {
  radiusKm: number;
  center: { latitude: number; longitude: number } | null;
  locationId?: string;
  limit?: number;
}

export function useNearbyBusinesses(options: UseNearbyBusinessesOptions) {
  const center = options.center;
  const spatial = useSpatialSearchByRadius({
    center: center ?? { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: "business",
    locationId: options.locationId,
    limit: options.limit,
    enabled: center !== null,
  });

  const spatialResults = useMemo(() => spatial.data ?? [], [spatial.data]);
  const ids = useMemo(
    () => [...new Set(spatialResults.map((item) => item.id))],
    [spatialResults],
  );

  const details = useQuery({
    queryKey: ["nearby", "business-details", ids],
    queryFn: () => BusinessService.getBusinessesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const businesses = useMemo<NearbyBusiness[]>(() => {
    const byId = new Map((details.data ?? []).map((business) => [business.id, business]));

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
  }, [details.data, spatialResults]);

  return {
    businesses,
    isLoading: spatial.isLoading || (ids.length > 0 && details.isLoading),
    isError: spatial.isError || details.isError,
  };
}
