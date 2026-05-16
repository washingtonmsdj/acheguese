import { useQuery } from "@tanstack/react-query";
import { fetchCommunicationLandingHub } from "../services/landingHubService";
import type { CommunicationLandingFilters } from "../types";

export function useCommunicationLandingHub(filters: CommunicationLandingFilters) {
  return useQuery({
    queryKey: ["communication-territorial", "landing", filters.state, filters.city],
    queryFn: () => fetchCommunicationLandingHub(filters),
    staleTime: 60_000,
  });
}

