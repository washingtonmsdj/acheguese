import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunicationLocations() {
  return useQuery({
    queryKey: ["communication-territorial", "locations"],
    queryFn: () => communicationTerritorialGateway.listDistrictOptions(),
  });
}

