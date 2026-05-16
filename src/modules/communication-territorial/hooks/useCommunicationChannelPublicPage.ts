import { useQuery } from "@tanstack/react-query";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunicationChannelPublicPage(channelSlug: string) {
  return useQuery({
    queryKey: ["communication-territorial", "channel", channelSlug],
    queryFn: () => communicationTerritorialGateway.getChannelPublicPage(channelSlug),
  });
}

