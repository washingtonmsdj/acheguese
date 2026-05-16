import {
  CommunicationDistributionService,
  CommunicationTerritorialService,
  type CommunicationChannelUrlParts,
  type CommunicationDistributionTarget,
  type CommunicationHubData,
  type CommunicationLocation,
  type CommunicationPublicationDistribution,
  type CreateCommunicationPublicationInput,
  type PublicationType,
  type RequestCommunicationChannelInput,
} from "@/core/communication-territorial";

export const communicationTerritorialGateway = {
  getPublicHub(params: { state?: string; city?: string; territorySlug?: string }): Promise<CommunicationHubData> {
    return CommunicationTerritorialService.getPublicHub(params);
  },
  getChannelPublicPage(channelSlug: string) {
    return CommunicationTerritorialService.getChannelPublicPage(channelSlug);
  },
  listDistrictOptions(): Promise<CommunicationLocation[]> {
    return CommunicationTerritorialService.listDistrictOptions();
  },
  requestChannel(input: RequestCommunicationChannelInput) {
    return CommunicationTerritorialService.requestChannel(input);
  },
  createPublication(input: CreateCommunicationPublicationInput) {
    return CommunicationTerritorialService.createPublication(input);
  },
  publishPublication(publicationId: string) {
    return CommunicationTerritorialService.publishPublication(publicationId);
  },
  listManagedChannels() {
    return CommunicationTerritorialService.listManagedChannels();
  },
  listAuthorizedTerritories(channelId: string) {
    return CommunicationTerritorialService.listAuthorizedTerritories(channelId);
  },
  listPublications(options: {
    locationIds?: string[];
    channelId?: string;
    status?: "published" | "draft";
    limit?: number;
  }) {
    return CommunicationTerritorialService.listPublications(options);
  },
  listDistributedPublications(options: {
    locationIds: string[];
    targetType?: CommunicationDistributionTarget;
    publicationType?: PublicationType;
    limit?: number;
  }): Promise<CommunicationPublicationDistribution[]> {
    return CommunicationDistributionService.listDistributedPublications(options);
  },
  resolvePublicationInteraction(
    distribution: CommunicationPublicationDistribution,
    params: Omit<CommunicationChannelUrlParts, "channelSlug">,
  ): { mode: "canonical" | "inline"; href?: string } {
    return CommunicationDistributionService.resolvePublicationInteraction(distribution, params);
  },
};
