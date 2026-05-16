import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunityCommunicationFeed(locationIds: string[]) {
  return useQuery({
    queryKey: ["community", "communication", "distributed", locationIds],
    queryFn: () =>
      communicationTerritorialGateway.listDistributedPublications({
        locationIds,
        targetType: "community_tab",
        limit: 40,
      }),
    enabled: locationIds.length > 0,
  });
}

