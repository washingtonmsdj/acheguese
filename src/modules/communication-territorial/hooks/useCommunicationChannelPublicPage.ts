import { useQuery } from "@tanstack/react-query";
import { PublicIdentityService } from "@/core/public-identity";
import { communicationTerritorialGateway } from "../services/communicationTerritorialGateway";

export function useCommunicationChannelPublicPage(channelSlug: string) {
  const normalizedSlug = PublicIdentityService.normalize(channelSlug, "communication_channel");

  return useQuery({
    queryKey: ["communication-territorial", "channel", normalizedSlug],
    queryFn: () => communicationTerritorialGateway.getChannelPublicPage(normalizedSlug),
    enabled: normalizedSlug.length > 0,
  });
}
