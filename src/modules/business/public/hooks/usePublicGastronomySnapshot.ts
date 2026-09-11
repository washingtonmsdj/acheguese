import { useQuery } from "@tanstack/react-query";
import { PublicGastronomySnapshotService } from "../services/PublicGastronomySnapshotService";
import type {
  PublicGastronomySnapshot,
  PublicSlugRouteParams,
} from "@/core/business/types/publicSnapshots";

const FIVE_MINUTES = 5 * 60 * 1000;

export function usePublicGastronomySnapshot(
  params: Partial<PublicSlugRouteParams>,
  options: { mockSnapshot?: PublicGastronomySnapshot } = {},
) {
  const hasRoute = Boolean(
    params.state && params.city && params.slug,
  );
  const mockSnapshot = options.mockSnapshot;

  return useQuery({
    queryKey: [
      "public-gastronomy-snapshot",
      params.state,
      params.city,
      params.district,
      params.slug,
      mockSnapshot ? "mock" : "live",
    ],
    queryFn: () =>
      mockSnapshot
        ? Promise.resolve(mockSnapshot)
        : PublicGastronomySnapshotService.getByTerritorySlug(
            params as PublicSlugRouteParams,
          ),
    enabled: hasRoute,
    initialData: mockSnapshot,
    retry: mockSnapshot ? false : undefined,
    staleTime: mockSnapshot ? Infinity : FIVE_MINUTES,
  });
}
