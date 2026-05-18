export interface CommunicationLandingFilters {
  state: string;
  city: string;
}

export type {
  CommunicationChannelRequest,
  CommunicationChannel,
  CommunicationChannelTerritory,
  CommunicationPublication,
  CommunicationPublicationDistribution,
  PublicationType,
  CommunicationContentFormat,
} from "@/core/communication-territorial/types";

export * from "./constants";
export * from "./errors";
