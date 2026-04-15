import { useQuery } from "@tanstack/react-query";
import { jobService } from "../services";
import type { NeighborhoodWithJobCount } from "../services";

export type NeighborhoodWithCount = NeighborhoodWithJobCount;

export function useNeighborhoodsWithJobs(cityId: string | null) {
  return useQuery({
    queryKey: ["neighborhoods-with-jobs", cityId],
    queryFn: async () => {
      if (!cityId) return [];
      return jobService.getNeighborhoodsWithJobs(cityId);
    },
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
  });
}
