import { useQuery } from "@tanstack/react-query";
import { PublicBusinessSnapshotService } from "../services/PublicBusinessSnapshotService";
import type { PublicSlugRouteParams } from "../types/publicSnapshots";

const FIVE_MINUTES = 5 * 60 * 1000;

export function usePublicBusinessSnapshot(params: Partial<PublicSlugRouteParams>) {
  const hasRoute = Boolean(
    params.state && params.city && params.slug,
  );

  return useQuery({
    queryKey: ["public-business-snapshot", params.state, params.city, params.district, params.slug],
    queryFn: () =>
      PublicBusinessSnapshotService.getByTerritorySlug(params as PublicSlugRouteParams),
    enabled: hasRoute,
    staleTime: FIVE_MINUTES,
  });
}
