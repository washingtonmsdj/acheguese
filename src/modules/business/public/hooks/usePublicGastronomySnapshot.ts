import { useQuery } from "@tanstack/react-query";
import { PublicGastronomySnapshotService } from "../services/PublicGastronomySnapshotService";
import type { PublicSlugRouteParams } from "../types/publicSnapshots";

const FIVE_MINUTES = 5 * 60 * 1000;

export function usePublicGastronomySnapshot(
  params: Partial<PublicSlugRouteParams>,
) {
  const hasRoute = Boolean(params.state && params.city && params.slug);

  return useQuery({
    queryKey: [
      "public-gastronomy-snapshot",
      params.state,
      params.city,
      params.district,
      params.slug,
    ],
    queryFn: () =>
      PublicGastronomySnapshotService.getByTerritorySlug(
        params as PublicSlugRouteParams,
      ),
    enabled: hasRoute,
    retry: 1,
    retryDelay: 750,
    staleTime: FIVE_MINUTES,
  });
}
