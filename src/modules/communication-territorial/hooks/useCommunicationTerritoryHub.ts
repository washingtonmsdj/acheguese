import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunicationTerritoryHub(state: string, city: string, territorySlug: string) {
  return useQuery({
    queryKey: ["communication-territorial", "territory", state, city, territorySlug],
    queryFn: () => communicationTerritorialGateway.getPublicHub({ state, city, territorySlug }),
  });
}

