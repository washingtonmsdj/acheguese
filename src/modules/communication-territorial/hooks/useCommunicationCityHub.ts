import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunicationCityHub(state: string, city: string) {
  return useQuery({
    queryKey: ["communication-territorial", "city", state, city],
    queryFn: () => communicationTerritorialGateway.getPublicHub({ state, city }),
  });
}

